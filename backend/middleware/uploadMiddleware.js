import multer from 'multer';
import path from 'path';

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize original filename (remove non-alphanumeric chars)
    const ext = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${file.fieldname}-${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword' // doc
  ];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export default upload;
