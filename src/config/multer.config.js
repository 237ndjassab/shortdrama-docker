const multer = require('multer');
const path = require('node:path');
const UPLOAD_DIR = '/uploads/'
const UPLOAD_PATH = path.join(__dirname, '../../public', UPLOAD_DIR);

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})


module.exports = {
  diskStorage,
  UPLOAD_PATH,
  UPLOAD_DIR
};