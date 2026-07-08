const express = require('express');
const router = express.Router();
const ExamController = require('../controllers/ExamController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ file
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

// Route upload file từ thiết bị
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'ERR', message: 'Không tìm thấy file tải lên' });
    }
    // Trả về URL truy cập tĩnh của file vừa upload
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.status(200).json({ status: 'OK', fileUrl });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
});

router.post('/create', ExamController.createExam);
router.put('/update/:id', ExamController.updateExam);
router.delete('/delete/:id', ExamController.deleteExam);
router.get('/all', ExamController.getAllExams);
router.get('/:id', ExamController.getExamById);
router.post('/start-attempt', ExamController.startAttempt);
router.post('/save-progress', ExamController.saveAttemptProgress);
router.post('/submit', ExamController.submitAttempt);
router.get('/submissions/:examId', ExamController.getSubmissionsByExam);
router.get('/student-submissions/:studentId', ExamController.getSubmissionsByStudent);
router.delete('/submission/:id', ExamController.deleteSubmission);

module.exports = router;
