const multer = require('multer');
const MIME_TYPE_MAP = {
  'image/png' : 'png',
  'image/jpg' : 'jpg',
  'image/jpe' : 'png',
  'image/jpeg' : 'jpg',
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const name =file.originalname.toLowerCase().split(' ').join('-')
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb( null, name + '-' + Date.now() + '.' + ext);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpe' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

module.exports = multer({
  storage : fileStorage,
  fileFilter : fileFilter
}).single('image');