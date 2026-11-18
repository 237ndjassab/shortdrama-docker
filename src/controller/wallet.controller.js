const { ApiReponse } = require("../helpers/response.js");
const { WalletService } = require("../services/wallet.service.js");

const depositController = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount } = req.body;
    console.log("id is : ", userId);
    console.log("\namount is : ", amount);

    const result = await WalletService.deposit(userId, +amount);
    return ApiReponse.success(res, "Deposit successfull", result);
  } catch (error) {
    next(error);
  }
};

const buyCoinsController = async (req, res, next) => {
  try {
    const packId = parseInt(req.params.packId);
    const userId = parseInt(req.user.id);
    const result = await WalletService.buyCoins(userId, packId);
    return ApiReponse.success(
      res,
      "coins added to wallet successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

const withdrawController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const result = await WalletService.withdraw(userId, amount);
    return ApiReponse.success(res, "Withdraw succesful", result);
  } catch (error) {
    next(error);
  }
};

const getMyWalletController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wallet = await WalletService.getMyWallet(userId);
    return ApiReponse.success(res, "Wallet retrieved successfully", wallet);
  } catch (error) {
    next(error);
  }
};

const getWalletTransactionsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await WalletService.getWalletTransaction(userId, req.query);

    return ApiReponse.success(
      res,
      "Transactions retrieved successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

const getWalletByUserId = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const wallet = await WalletService.getWalletByUserId(userId);
    return ApiReponse.success(res, "Wallet retrieved", wallet);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  depositController,
  buyCoinsController,
  withdrawController,
  getMyWalletController,
  getWalletTransactionsController,
  getWalletByUserId,
};
