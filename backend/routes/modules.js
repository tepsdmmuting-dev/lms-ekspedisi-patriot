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
        EXISTS(SELECT 1 FROM quizzes q WHERE q.module_id = m.id AND q.type = 'post_test') as has_post_test,
        COALESCE(
          (SELECT json_agg(json_build_object('id', q.id, 'title', q.title, 'type', q.type, 'order_index', q.order_index, 'module_id', q.module_id) ORDER BY q.order_index ASC, q.id ASC)
           FROM quizzes q WHERE q.module_id = m.id),
          '[]'::json
        ) as quizzes
      FROM modules m 
      ORDER BY COALESCE(m.topic, 'ZZZ') ASC, COALESCE(m.module_name, 'Modul 1') ASC, COALESCE(m.order_index, 1) ASC, m.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// @route   POST api/modules
// @desc    Create a module / lesson
// @access  Private (Admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  const { 
    title, description, media_platform, external_url, category, 
    topic, visibility, image_url, image_source, module_name, order_index 
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO modules (title, description, media_platform, external_url, category, topic, visibility, image_url, image_source, module_name, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        title, 
        description, 
        media_platform, 
        external_url, 
        category, 
        topic, 
        visibility || 'restricted', 
        image_url, 
        image_source,
        module_name || 'Modul 1',
        parseInt(order_index) || 1
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/modules/batch-organize
// @desc    Batch update module_name, order_index, or topic
// @access  Private (Admin)
router.put('/batch-organize', [authMiddleware, adminMiddleware], async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ msg: 'Updates array is required' });
  }

  try {
    for (const item of updates) {
      if (item.is_quiz || item.item_type === 'quiz') {
        await db.query(
          `UPDATE quizzes SET order_index = $1 WHERE id = $2`,
          [item.order_index !== undefined ? parseInt(item.order_index) : 0, item.id]
        );
      } else {
        await db.query(
          `UPDATE modules 
           SET module_name = COALESCE($1, module_name), 
               order_index = COALESCE($2, order_index),
               topic = COALESCE($3, topic),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [item.module_name, item.order_index ? parseInt(item.order_index) : null, item.topic, item.id]
        );
      }
    }
    res.json({ msg: 'Modules and quizzes organized successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/modules/:id
// @desc    Update a module / lesson
// @access  Private (Admin)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const { 
    title, description, media_platform, external_url, category, 
    topic, visibility, image_url, image_source, module_name, order_index 
  } = req.body;
  try {
    const result = await db.query(
      `UPDATE modules 
       SET title = $1, description = $2, media_platform = $3, external_url = $4, category = $5, topic = $6, visibility = $7, image_url = $8, image_source = $9, module_name = $10, order_index = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [
        title, 
        description, 
        media_platform, 
        external_url, 
        category, 
        topic, 
        visibility, 
        image_url, 
        image_source,
        module_name || 'Modul 1',
        parseInt(order_index) || 1,
        req.params.id
      ]
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
