const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/CommentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post("/create", CommentController.createComment);
router.get("/get-by-lesson/:lessonId", CommentController.getCommentsByLesson);

router.post('/upload', upload.array('files', 5), (req, res) => {
  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrls = req.files.map(file => `${protocol}://${host}/uploads/${file.filename}`);
    
    res.status(200).json({ success: true, urls: fileUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
