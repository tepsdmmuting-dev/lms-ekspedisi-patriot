const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Ensure directories exist
const videoDir = path.join(__dirname, '../uploads/videos');
const docDir = path.join(__dirname, '../uploads/documents');
const imageDir = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Storage configuration for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanBase}${ext}`);
  }
});

// Storage configuration for PDF documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanBase}${ext}`);
  }
});

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanBase}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 1024 * 1024 * 800 }, // Max 800MB per video
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.webm', '.m4v', '.mov', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file video tidak didukung. Gunakan format MP4, WEBM, atau MOV.'));
    }
  }
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 1024 * 1024 * 200 }, // Max 200MB per PDF
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file harus berupa dokumen PDF (.pdf).'));
    }
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Max 10MB per image
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format gambar tidak didukung. Gunakan format JPG, PNG, atau WEBP.'));
    }
  }
});

// @route   POST api/upload/video
// @desc    Upload video MP4 to local server
// @access  Private (Admin / Co-Admin)
router.post('/video', [authMiddleware, adminMiddleware], (req, res) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Tidak ada file video yang diunggah.' });
    }

    const relativeUrl = `/uploads/videos/${req.file.filename}`;
    res.json({
      url: relativeUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
});

// @route   POST api/upload/pdf
// @desc    Upload PDF document to local server
// @access  Private (Admin / Co-Admin)
router.post('/pdf', [authMiddleware, adminMiddleware], (req, res) => {
  docUpload.single('pdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Tidak ada file PDF yang diunggah.' });
    }

    const relativeUrl = `/uploads/documents/${req.file.filename}`;
    res.json({
      url: relativeUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
});

// @route   POST api/upload/image
// @desc    Upload image/thumbnail to local server
// @access  Private (Admin / Co-Admin)
router.post('/image', [authMiddleware, adminMiddleware], (req, res) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Tidak ada file gambar yang diunggah.' });
    }

    const relativeUrl = `/uploads/images/${req.file.filename}`;
    res.json({
      url: relativeUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  });
});

// @route   GET api/upload/videos
// @desc    Get list of existing videos in the local uploads/videos folder
// @access  Private (Admin)
router.get('/videos', [authMiddleware, adminMiddleware], (req, res) => {
  try {
    if (!fs.existsSync(videoDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(videoDir);
    const videoFiles = files
      .filter(file => !file.startsWith('.') && ['.mp4', '.webm', '.m4v', '.mov', '.mkv'].includes(path.extname(file).toLowerCase()))
      .map(file => {
        const stats = fs.statSync(path.join(videoDir, file));
        return {
          filename: file,
          url: `/uploads/videos/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(videoFiles);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/upload/documents
// @desc    Get list of existing PDF documents in the local uploads/documents folder
// @access  Private (Admin)
router.get('/documents', [authMiddleware, adminMiddleware], (req, res) => {
  try {
    if (!fs.existsSync(docDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(docDir);
    const docFiles = files
      .filter(file => !file.startsWith('.') && path.extname(file).toLowerCase() === '.pdf')
      .map(file => {
        const stats = fs.statSync(path.join(docDir, file));
        return {
          filename: file,
          url: `/uploads/documents/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(docFiles);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
