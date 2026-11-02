const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for local uploaded media (videos, images)
const uploadsPath = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
} catch (fsErr) {
  // Read-only filesystem in serverless environments like Vercel
  console.log('Skipping local uploads folder creation on serverless environment');
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));

// Serve Frontend in single-port mode if dist folder exists (Offline / Local mode)
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Do not call app.listen in serverless cloud environment (Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;

