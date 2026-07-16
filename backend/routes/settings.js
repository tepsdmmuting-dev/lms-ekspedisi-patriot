const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET api/settings
// @desc    Get all site settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT setting_key, setting_value FROM site_settings');
    // Convert array of rows into a single key-value object
    const settingsObj = {};
    result.rows.forEach(row => {
      settingsObj[row.setting_key] = row.setting_value;
    });
    res.json(settingsObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/settings
// @desc    Update site settings
// @access  Private (Admin)
router.put('/', [authMiddleware, adminMiddleware], async (req, res) => {
  const settings = req.body; // Expects an object like { hero_image_url: "...", hero_title: "..." }
  
  try {
    // Start a transaction or just update each key
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }
    res.json({ msg: 'Settings updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
