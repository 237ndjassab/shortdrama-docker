const { ApiReponse } = require("../helpers/response.js");


const errorHandle = (err, req, res, next) => {
  console.log("error", err);

  return ApiReponse.error(res, err.message || "Internal server error.");
};

module.exports = { errorHandle };
