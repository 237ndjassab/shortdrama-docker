const Yup = require("yup");

const serieSchema = Yup.object().shape({
  title: Yup.string().required(),
  description: Yup.string().optional(),
  language: Yup.string().optional(),
  countryOrigin: Yup.string().required(),
  thumbnail: Yup.string().optional(),
  categoryId: Yup.string().required(),
});

module.exports = { serieSchema };
