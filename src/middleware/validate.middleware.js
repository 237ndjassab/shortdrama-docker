const Yup = require("yup");
const { ApiReponse } = require("../helpers/response.js");

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const body = req.body;
      await schema.validate(body, { strict: true, abortEarly: false });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const result = error.inner.reduce((acc, err) => {
          if (err.path && !acc[err.path]) {
            acc[err.path] = err.message;
          }
          return acc;
        }, {});
        return ApiReponse.error(res, "Failed to validate data.", result, 422);
      }

      next(error);
    }
    next();
  }
};

module.exports = {
  validate,
};
