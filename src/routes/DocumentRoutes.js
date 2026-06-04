const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if not exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Route to upload document files directly
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'ERR', message: 'Không tìm thấy file tải lên' });
    }
    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    res.status(200).json({ status: 'OK', fileUrl });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
});

router.post('/create', DocumentController.createDocument);
router.put('/update/:id', DocumentController.updateDocument);
router.delete('/delete/:id', DocumentController.deleteDocument);
router.get('/all', DocumentController.getAllDocuments);
router.get('/:id', DocumentController.getDocumentById);

module.exports = router;
