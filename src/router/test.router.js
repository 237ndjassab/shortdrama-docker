const express = require("express");
const { testTokenController, testCollectController } = require("../controller/test.controller.js");
const testRouter = express.Router();

testRouter.post("/token", testTokenController);
testRouter.post("/pay", testCollectController);

module.exports = { testRouter };
