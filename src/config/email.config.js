
const nodemailer = require("nodemailer");
const { env } = require("./env.js");

// L'authentification est activée uniquement si les deux identifiants existent.
const auth =
  env.mailuser && env.mailpass
    ? {
        user: env.mailuser,
        pass: env.mailpass,
      }
    : undefined;

const transporter = nodemailer.createTransport({
  host: env.mailhost,
  port: env.mailport,
  secure: false,
  ...(auth && { auth }),
});

(async () => {
  try {
    await transporter.verify();
    console.log("SMTP connected successfully.");
  } catch (error) {
    console.log("SMTP connection error:", error.message);
  }
})();

module.exports = { transporter };
