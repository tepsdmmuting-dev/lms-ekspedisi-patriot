const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// @route   GET api/progress/:userId
// @desc    Get user progress for all modules
// @access  Private
router.get('/:userId', authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  // Ensure user can only see their own progress unless admin or co_admin
  if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'co_admin') {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  try {
    // Check if user has specific assigned topics
    const assignedRes = await db.query(
      "SELECT topic FROM user_topics WHERE user_id = $1 AND topic IS NOT NULL AND topic != ''",
      [userId]
    );
    const assignedTopics = assignedRes.rows.map(r => r.topic);

    let query = '';
    let params = [userId];

    if (assignedTopics.length > 0) {
      // User has specific assigned topics: filter by those topics
      query = `
        SELECT m.*, pt.completed, pt.progress_percentage, pt.completed_at, pt.last_accessed_at 
        FROM modules m
        LEFT JOIN progress_tracking pt ON m.id = pt.module_id AND pt.user_id = $1
        WHERE m.topic = ANY($2::varchar[])
        ORDER BY m.topic ASC, m.module_name ASC, m.order_index ASC, m.id ASC
      `;
      params.push(assignedTopics);
    } else {
      // User has NO specific restrictions: show all modules so dashboard is NEVER empty!
      query = `
        SELECT m.*, pt.completed, pt.progress_percentage, pt.completed_at, pt.last_accessed_at 
        FROM modules m
        LEFT JOIN progress_tracking pt ON m.id = pt.module_id AND pt.user_id = $1
        ORDER BY COALESCE(m.topic, 'Lainnya') ASC, m.module_name ASC, m.order_index ASC, m.id ASC
      `;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/progress/update
// @desc    Update progress for a module
// @access  Private
router.post('/update', authMiddleware, async (req, res) => {
  const { module_id, progress_percentage } = req.body;
  const user_id = req.user.id;
  const completed = progress_percentage >= 100;
  const completed_at = completed ? new Date() : null;

  try {
    // Check if progress exists
    const check = await db.query('SELECT * FROM progress_tracking WHERE user_id = $1 AND module_id = $2', [user_id, module_id]);
    
    if (check.rows.length > 0) {
      // Update
      const result = await db.query(
        `UPDATE progress_tracking 
         SET progress_percentage = $1, completed = $2, completed_at = COALESCE(completed_at, $3), last_accessed_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND module_id = $5 RETURNING *`,
        [progress_percentage, completed, completed_at, user_id, module_id]
      );
      res.json(result.rows[0]);
    } else {
      // Insert
      const result = await db.query(
        `INSERT INTO progress_tracking (user_id, module_id, progress_percentage, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, module_id, progress_percentage, completed, completed_at]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
