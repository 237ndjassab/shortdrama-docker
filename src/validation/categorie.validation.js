const Yup = require("yup");

const categorieSchema = Yup.object().shape({
  description: Yup.string().min(2).max(100).optional(),
  name: Yup.string().min(2).max(100).required(),
  badge: Yup.string().min(2).max(100).optional(),
  isActive: Yup.boolean().optional(),
});

module.exports = { categorieSchema };
