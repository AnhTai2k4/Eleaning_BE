const { Document } = require('../models/DocumentModel');

// 1. Create learning document (Teacher/Admin)
const createDocument = async (req, res) => {
  try {
    const { title, description, fileUrl, grade, createdBy } = req.body;
    
    if (!title || !createdBy) {
      return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin bắt buộc (title, createdBy)' });
    }

    const document = await Document.create({
      title,
      description,
      fileUrl,
      grade: grade ? Number(grade) : 12,
      createdBy
    });

    res.status(201).json({ status: 'OK', data: document });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 2. Update learning document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Document.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy tài liệu' });
    }
    res.status(200).json({ status: 'OK', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 3. Delete learning document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy tài liệu' });
    }
    res.status(200).json({ status: 'OK', message: 'Xóa tài liệu thành công' });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 4. Get all learning documents
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'OK', data: documents });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 5. Get learning document detail by ID
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy tài liệu' });
    }
    res.status(200).json({ status: 'OK', data: document });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

module.exports = {
  createDocument,
  updateDocument,
  deleteDocument,
  getAllDocuments,
  getDocumentById
};
