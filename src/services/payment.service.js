const crypto = require("crypto");

const { prisma } = require("../model/index.js");

const CampayService = require("./campay.service.js");

class PaymentService {
  /**
   * =========================================
   * 🔥 FLOW INTERNE
   * =========================================
   *
   * 1. Vérifie coin pack
   * 2. Vérifie wallet utilisateur
   * 3. Génère UUID4
   * 4. Crée Payment PENDING
   * 5. Lance paiement Campay
   * 6. Sauvegarde réponse Campay
   * 7. Retourne infos frontend
   *
   * =========================================
   */
  static async initiatePayment({ userId, packId, phoneNumber }) {
    // 🔥 récupérer pack
    const pack = await prisma.coinPack.findUnique({
      where: {
        id: packId,
      },
    });

    if (!pack || !pack.isActive) {
      throw new Error("Coin pack unavailable");
    }

    // pack payant => numéro obligatoire
    if (Number(pack.price) > 0 && (!phoneNumber || !phoneNumber.startsWith("237"))) {
      throw new Error("Invalid phone number");
    }

    if (!pack || !pack.isActive) {
      throw new Error("Coin pack unavailable");
    }

    // 🔥 vérifier wallet
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // =========================================
    // 🔥 PACK GRATUIT
    // =========================================

    if (Number(pack.price) === 0) {
      return await prisma.$transaction(async (tx) => {
        const coinsToAdd = pack.coins + pack.bonusCoins;

        const balanceBefore = wallet.balanceCoins;

        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balanceCoins: {
              increment: coinsToAdd,
            },

            lastTransactionAt: new Date(),
          },
        });

        // historique
        await tx.transaction.create({
          data: {
            walletId: wallet.id,

            amount: coinsToAdd,

            price: 0,

            type: "CREDIT",

            source: "FREE_PACK",

            balanceCoinsBefore: balanceBefore,

            balanceCoinsAfter: updatedWallet.balanceCoins,
          },
        });

        // statistiques du pack
        await tx.coinPack.update({
          where: {
            id: pack.id,
          },

          data: {
            purchaseCount: {
              increment: 1,
            },
          },
        });

        return {
          success: true,

          freePack: true,

          coinsAdded: coinsToAdd,

          balance: updatedWallet.balanceCoins,
        };
      });
    }

    // 🔥 UUID unique Campay
    const reference = crypto.randomUUID();

    // 🔥 créer payment PENDING
    const payment = await prisma.payment.create({
      data: {
        userId,

        amount: pack.price,

        coins: pack.coins + pack.bonusCoins,

        phoneNumber,

        description: `Purchase of ${pack.coins} coins`,

        externalReference: reference,

        status: "PENDING",

        metadata: {
          packId: pack.id,
          packName: pack.name,
        },
      },
    });

    // 🔥 appel Campay
    const campayResponse = await CampayService.requestPayment({
      amount: pack.price,
      phoneNumber,
      description: `Purchase of ${pack.coins} coins`,
      reference,
    });

    // 🔥 update payment avec réponse Campay
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        providerReference:
          campayResponse.reference ||
          campayResponse.transaction_reference ||
          null,

        operator: campayResponse.operator,

        metadata: {
          ...payment.metadata,

          campayResponse,
        },
      },
    });

    return {
      payment: updatedPayment,

      campayResponse,
    };
  }

  /**
   * =========================================
   * 🔥 FLOW INTERNE
   * =========================================
   *
   * WEBHOOK CAMPAY
   *
   * 1. Campay confirme paiement
   * 2. On retrouve Payment
   * 3. Vérifie si déjà SUCCESS
   * 4. Transaction Prisma atomique:
   *
   *    - update payment SUCCESS
   *    - crédit wallet coins
   *    - create transaction CREDIT
   *    - increment coin pack count
   *
   * =========================================
   */
  static async handleWebhook(payload) {
    console.log("CAMPAY WEBHOOK:", payload);

    const reference = payload.external_reference || payload.reference;

    if (!reference) {
      throw new Error("Reference missing");
    }

    // 🔥 retrouver payment
    const payment = await prisma.payment.findUnique({
      where: {
        externalReference: reference,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // 🔥 éviter double crédit
    if (payment.status === "SUCCESS") {
      return {
        success: false,
        message: "Payment already processed",
      };
    }

    // ⚠️ adapter selon vrai status Campay
    const status = payload.status?.toUpperCase();

    if (status === "FAILED" || status === "FAIL" || status === "CANCELLED") {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: "FAILED",

          failureReason: payload.message || "Payment failed",

          webhookReceived: true,

          webhookReceivedAt: new Date(),

          metadata: { ...payment.metadata, payload },
        },
      });

      return {
        success: false,
        message: "Payment failed",
      };
    } else if (status === "SUCCESSFUL" || status === "SUCCESS") {
      // 🔥 transaction atomique
      return await prisma.$transaction(async (tx) => {
        // 🔥 wallet utilisateur
        const wallet = await tx.wallet.findUnique({
          where: {
            userId: payment.userId,
          },
        });

        if (!wallet) {
          throw new Error("Wallet not found");
        }

        // 🔥 update payment
        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status: "SUCCESS",

            webhookReceived: true,

            webhookReceivedAt: new Date(),

            metadata: { ...payment.metadata, payload },
          },
        });

        // 🔥 crédit wallet
        const updatedWallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balanceCoins: {
              increment: payment.coins,
            },

            lastTransactionAt: new Date(),
          },
        });

        // 🔥 transaction historique
        await tx.transaction.create({
          data: {
            walletId: wallet.id,

            amount: payment.coins,

            price: payment.amount,

            type: "CREDIT",

            source: "COIN_PURCHASE",

            balanceCoinsBefore: wallet.balanceCoins,

            balanceCoinsAfter: updatedWallet.balanceCoins,
          },
        });

        // 🔥 increment pack stats
        const packId = payment.metadata?.packId;

        if (packId) {
          await tx.coinPack.update({
            where: {
              id: packId,
            },

            data: {
              purchaseCount: {
                increment: 1,
              },
            },
          });
        }

        return {
          success: true,
          coinsAdded: payment.coins,
          newBalance: updatedWallet.balanceCoins,
          pack: {
            id: packId,
            coins: payment.coins,
            price: payment.amount,
          },
        };
      });
    } else {
      // =========================================
      // 🔥 PENDING
      // =========================================

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: "PENDING",

          webhookReceived: true,

          webhookReceivedAt: new Date(),

          metadata: { ...payment.metadata, payload },
        },
      });

      return {
        success: false,
        message: "Payment pending",
      };
    }
  }

  /**
   * =========================================
   * 🔥 FLOW INTERNE
   * =========================================
   *
   * Permet au frontend de vérifier
   * l'état du paiement.
   *
   * =========================================
   */
  static async getPaymentStatus(reference) {
    const payment = await prisma.payment.findUnique({
      where: {
        externalReference: reference,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  }

  /**
   * =========================================
   * 🔥 FLOW INTERNE
   * =========================================
   *
   * Historique paiements utilisateur
   *
   * =========================================
   */
  static async getUserPayments(userId) {
    return await prisma.payment.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getAllPayments() {
    return await prisma.payment.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

module.exports = PaymentService;
