const Yup = require("yup");

const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/;

const registerSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().matches(passwordRules).required(),
  name: Yup.string().min(2).max(100).required(),
});

const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().matches(passwordRules, { message: "Please create a stronger password" }).min(6).required(),
});

const forgotPasswordSchema = Yup.object({
  email: Yup.string().email().required(),
});

const verifyOTPSchema = Yup.object({
  email: Yup.string().email().required(),
  otp: Yup.string().required(),
});

const resetPasswordSchema = Yup.object({
  email: Yup.string().email().required(),
  password: Yup.string()
    .matches(passwordRules, { message: "Please create a stronger password" })
    .required()
    .min(6),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
};