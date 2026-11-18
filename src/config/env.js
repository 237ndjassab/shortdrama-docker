const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve("./.env") });

const env = {
  port: +process.env.APP_PORT || 3000,
  host: process.env.APP_HOST || "0.0.0.0",
  appname: process.env.APP_NAME || "ShortDramaAfrica",

  mailport: process.env.MAIL_PORT || 1025,
  mailhost: process.env.MAIL_HOST || "localhost",
  mailuser: process.env.MAIL_USER || "ShortDramaAfrica@gmail.com",
  mailpass: process.env.MAIL_PASS,

  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,

  campay_username: process.env.CAMPAY_USERNAME,
  campay_password: process.env.CAMPAY_PASSWORD,
  campay_base_url: process.env.CAMPAY_BASE_URL,

  access_secret: process.env.ACCESS_SECRET,
  refresh_secret: process.env.REFRESH_SECRET,
  access_expires_in: process.env.ACCESS_SECRET_EXPIRES_IN || "1d",
  refresh_expires_in: process.env.REFRESH_SECRET_EXPIRES_IN || "60d",
};

module.exports = { env };
