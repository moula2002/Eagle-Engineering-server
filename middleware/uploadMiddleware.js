import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage(); // Store files in memory as Buffers

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|svg|pdf|doc|docx|raw/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, svg, raw) and documents (pdf, docx) are allowed!'));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});
