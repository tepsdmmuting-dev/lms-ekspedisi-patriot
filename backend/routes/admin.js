const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // 1. Total Active Links (modules)
    const activeLinksResult = await db.query("SELECT COUNT(*) FROM modules WHERE visibility = 'public' OR visibility = 'restricted'");
    const totalActiveLinks = parseInt(activeLinksResult.rows[0].count);

    // 2. Trainee Retention Rate (completed vs total enrolled)
    // Basic calculation: users who completed at least one module vs total trainees
    const retentionResult = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM progress_tracking WHERE completed = true) * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM users WHERE role = 'trainee'), 0) as retention_rate
    `);
    const retentionRate = parseFloat(retentionResult.rows[0].retention_rate || 0).toFixed(1);

    // 3. Regional Trainee Distribution
    const regionalResult = await db.query(`
      SELECT region, COUNT(*) as count 
      FROM users 
      WHERE role = 'trainee' 
      GROUP BY region 
      ORDER BY count DESC
    `);
    
    // Group users by region logic for map UI
    const regions = regionalResult.rows.map(row => ({
      name: row.region || 'Unknown',
      count: parseInt(row.count)
    }));

    res.json({
      totalActiveLinks,
      retentionRate,
      regions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all trainees
// @access  Private (Admin)
router.get('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.region, u.district, 
             COALESCE(json_agg(ut.topic) FILTER (WHERE ut.topic IS NOT NULL), '[]') as assigned_topics
      FROM users u
      LEFT JOIN user_topics ut ON u.id = ut.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/users
// @desc    Create a new trainee
// @access  Private (Admin)
router.post('/users', [authMiddleware, adminMiddleware], async (req, res) => {
  const { name, email, password, role, region, district } = req.body;
  try {
    // Check if email exists
    const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    
    // Mock hash since bcrypt is not installed in this demo
    const mockHash = '$2b$10$EpI1Fv6/Gv.c.1Y45v6YjO0P0gYy2Dq6R5bVn6R5bVn6R5bVn6R5b';
    
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, region, district) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, region, district',
      [name, email, mockHash, role || 'trainee', region, district]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/users/:id/topics
// @desc    Assign topics to a user
// @access  Private (Admin)
router.post('/users/:id/topics', [authMiddleware, adminMiddleware], async (req, res) => {
  const { topics } = req.body; // Array of topic strings
  const userId = req.params.id;
  try {
    // Delete existing topics
    await db.query('DELETE FROM user_topics WHERE user_id = $1', [userId]);
    
    // Insert new topics
    if (topics && topics.length > 0) {
      const values = topics.map(t => `(${userId}, '${t}')`).join(', ');
      await db.query(`INSERT INTO user_topics (user_id, topic) VALUES ${values}`);
    }
    res.json({ msg: 'Topics updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/users/:id/reset-progress
// @desc    Reset a user's progress
// @access  Private (Admin)
router.post('/users/:id/reset-progress', [authMiddleware, adminMiddleware], async (req, res) => {
  const userId = req.params.id;
  try {
    await db.query('DELETE FROM progress_tracking WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM quiz_attempts WHERE user_id = $1', [userId]);
    res.json({ msg: 'Progress reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update user details
// @access  Private (Admin)
router.put('/users/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const { name, email, role, region, district } = req.body;
  const userId = req.params.id;
  try {
    const result = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, region = $4, district = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id, name, email, role, region, district`,
      [name, email, role || 'trainee', region, district, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Hanya Admin utama yang bisa menghapus user' });
  }
  const userId = req.params.id;
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
