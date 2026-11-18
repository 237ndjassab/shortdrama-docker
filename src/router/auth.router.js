const express = require('express');
const { validate } = require('../middleware/validate.middleware.js');
const { registerSchema, loginSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema } = require('../validation/auth.validation.js');
const { register, login, forgotPassword, verifyOTP, resetPassword, logout, refreshToken, getMe } = require('../controller/auth.controller.js');
const { authenticated } = require('../middleware/authenticated.middleware.js');

const authRouter = express.Router();

authRouter.post('/register',validate(registerSchema), register);
authRouter.post('/login',validate(loginSchema), login);
authRouter.post('/forgotPassword',validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/verifyOTP', validate(verifyOTPSchema), verifyOTP);
authRouter.post('/resetPassword',validate(resetPasswordSchema) , resetPassword);
authRouter.post('/refreshToken', refreshToken);

//log pour verfier si l;utilisateur existe et si son token est encore valide
authRouter.get('/me', authenticated, getMe);
//log pour verfier si l;utilisateur existe et si son token est encore valide

authRouter.post('/logout', logout);

module.exports = {
  authRouter,
};