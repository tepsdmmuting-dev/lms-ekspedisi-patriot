const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET api/modules/topics
// @desc    Get all distinct topics used in modules
// @access  Private (Admin)
router.get('/topics', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT topic FROM modules WHERE topic IS NOT NULL AND topic != '' ORDER BY topic ASC"
    );
    res.json(result.rows.map(r => r.topic));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/modules
// @desc    Get all modules
// @access  Public / Private
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, 
        EXISTS(SELECT 1 FROM quizzes q WHERE q.module_id = m.id AND q.type = 'pre_test') as has_pre_test,
        EXISTS(SELECT 1 FROM quizzes q WHERE q.module_id = m.id AND q.type = 'post_test') as has_post_test
      FROM modules m 
      ORDER BY m.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/modules
// @desc    Create a module
// @access  Private (Admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  const { title, description, media_platform, external_url, category, topic, visibility, image_url, image_source } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO modules (title, description, media_platform, external_url, category, topic, visibility, image_url, image_source) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, media_platform, external_url, category, topic, visibility || 'restricted', image_url, image_source]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/modules/:id
// @desc    Update a module
// @access  Private (Admin)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const { title, description, media_platform, external_url, category, topic, visibility, image_url, image_source } = req.body;
  try {
    const result = await db.query(
      `UPDATE modules 
       SET title = $1, description = $2, media_platform = $3, external_url = $4, category = $5, topic = $6, visibility = $7, image_url = $8, image_source = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [title, description, media_platform, external_url, category, topic, visibility, image_url, image_source, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Module not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/modules/:id
// @desc    Delete a module
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Only full admins can delete modules' });
  }
  try {
    const result = await db.query('DELETE FROM modules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Module not found' });
    }
    res.json({ msg: 'Module removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
