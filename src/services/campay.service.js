const { env } = require("../config/env.js");

class CampayService {
  /**
   * =========================================
   * 🔥 FLOW INTERNE
   * * =========================================
   * * 1. Envoie username/password à Campay
   * * 2. Campay retourne un token
   * * 3. Le token servira pour toutes les requêtes
   * * * ========================================= */
  static async getToken() {
    try {
      const response = await fetch(`${env.campay_base_url}/token/`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: env.campay_username,
          password: env.campay_password,
        }),
      });

      const data = await response.json();

      return data.token;
    } catch (error) {
      console.log(error);

      throw new Error("Erreur récupération token");
    }
  }

  /**
   * * =========================================
   * * 🔥 FLOW INTERNE
   * * ========================================= *
   * * 1. Récupère token Campay
   * * 2. Lance demande de paiement Mobile Money
   * * 3. L'utilisateur reçoit popup MTN/Orange
   * * 4. Campay retourne infos transaction
   * * * ========================================= */

  static async requestPayment({ amount, phoneNumber, description, reference }) {
    try {
      const token = await this.getToken();

      const response = await fetch(`${env.campay_base_url}/collect/`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          amount,
          currency: "XAF",
          from: phoneNumber,
          description,
          external_reference: reference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data);

        throw new Error(data.message || "Erreur Campay");
      }

      return data;
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  /**
   * * ========================================= *
   * 🔥 FLOW INTERNE
   * * ========================================= *
   * * Vérifie le status d'une transaction *
   * * Exemple: * - SUCCESSFUL * - FAILED * - PENDING * *
   * ========================================= */

  static async getTransactionStatus(reference) {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${env.campay_base_url}/transaction/${reference}/`,
        { method: "GET", headers: { Authorization: `Token ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) {
        console.log(data);
        throw new Error(data.message || "Transaction status error");
      }
      return data;
    } catch (error) {
      console.log("TRANSACTION STATUS ERROR:", error);
      throw error;
    }
  }
}

module.exports = CampayService;
