const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
    
    // Hash the password
    let passwordToHash = password;
    if (!passwordToHash) {
      passwordToHash = 'password123'; // Default fallback
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);
    
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, region, district) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, region, district',
      [name, email, hashedPassword, role || 'trainee', region, district]
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

// @route   POST api/admin/users/:id/reset-password
// @desc    Reset or update user password
// @access  Private (Admin)
router.post('/users/:id/reset-password', [authMiddleware, adminMiddleware], async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;
  const newPassword = (password && password.trim() !== '') ? password.trim() : 'password123';
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ 
      msg: 'Password berhasil diperbarui', 
      user: result.rows[0],
      new_password: newPassword
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update user details (and optionally password)
// @access  Private (Admin)
router.put('/users/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  const { name, email, role, region, district, password } = req.body;
  const userId = req.params.id;
  try {
    let result;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      result = await db.query(
        `UPDATE users 
         SET name = $1, email = $2, role = $3, region = $4, district = $5, password_hash = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 RETURNING id, name, email, role, region, district`,
        [name, email, role || 'trainee', region, district, hashedPassword, userId]
      );
    } else {
      result = await db.query(
        `UPDATE users 
         SET name = $1, email = $2, role = $3, region = $4, district = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 RETURNING id, name, email, role, region, district`,
        [name, email, role || 'trainee', region, district, userId]
      );
    }
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

// @route   GET api/admin/curriculum/export
// @desc    Export all curriculum (modules, quizzes, questions) to portable JSON
// @access  Private (Admin)
router.get('/curriculum/export', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const modulesRes = await db.query('SELECT * FROM modules ORDER BY topic, module_name, order_index, id');
    const quizzesRes = await db.query('SELECT * FROM quizzes ORDER BY module_id, type, order_index');
    const questionsRes = await db.query('SELECT * FROM quiz_questions ORDER BY quiz_id, id');

    const curriculumData = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      platform: 'Ekspedisi Patriot LMS',
      modules: modulesRes.rows,
      quizzes: quizzesRes.rows,
      quiz_questions: questionsRes.rows
    };

    res.setHeader('Content-Disposition', `attachment; filename="lms_patriot_curriculum_${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(curriculumData, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/curriculum/import
// @desc    Import curriculum package JSON from flashdisk / local file
// @access  Private (Admin)
router.post('/curriculum/import', [authMiddleware, adminMiddleware], async (req, res) => {
  const { modules, quizzes, quiz_questions } = req.body;
  if (!Array.isArray(modules)) {
    return res.status(400).json({ msg: 'Format file paket kurikulum tidak valid.' });
  }

  const client = db.pool ? await db.pool.connect() : null;
  try {
    if (client) await client.query('BEGIN');

    const moduleIdMap = new Map(); // oldId -> newId
    const queryFn = client ? client.query.bind(client) : db.query.bind(db);

    // 1. Import Modules
    for (const mod of modules) {
      const existing = await queryFn(
        'SELECT id FROM modules WHERE topic = $1 AND module_name = $2 AND title = $3',
        [mod.topic, mod.module_name, mod.title]
      );

      let targetId;
      if (existing.rows.length > 0) {
        targetId = existing.rows[0].id;
        await queryFn(
          `UPDATE modules 
           SET description = $1, media_platform = $2, external_url = $3, category = $4,
               visibility = $5, image_url = $6, image_source = $7, order_index = $8, updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [
            mod.description, mod.media_platform, mod.external_url, mod.category,
            mod.visibility || 'restricted', mod.image_url, mod.image_source, mod.order_index || 1, targetId
          ]
        );
      } else {
        const ins = await queryFn(
          `INSERT INTO modules (title, description, media_platform, external_url, category, topic, visibility, image_url, image_source, module_name, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [
            mod.title, mod.description, mod.media_platform, mod.external_url, mod.category,
            mod.topic, mod.visibility || 'restricted', mod.image_url, mod.image_source,
            mod.module_name || 'Modul 1', mod.order_index || 1
          ]
        );
        targetId = ins.rows[0].id;
      }
      moduleIdMap.set(mod.id, targetId);
    }

    // 2. Import Quizzes
    const quizIdMap = new Map(); // oldQuizId -> newQuizId
    if (Array.isArray(quizzes)) {
      for (const q of quizzes) {
        const newModuleId = moduleIdMap.get(q.module_id) || q.module_id;
        const existingQuiz = await queryFn(
          'SELECT id FROM quizzes WHERE module_id = $1 AND type = $2',
          [newModuleId, q.type]
        );

        let targetQuizId;
        if (existingQuiz.rows.length > 0) {
          targetQuizId = existingQuiz.rows[0].id;
          await queryFn(
            'UPDATE quizzes SET title = $1, order_index = $2 WHERE id = $3',
            [q.title, q.order_index || (q.type === 'pre_test' ? 0 : 999), targetQuizId]
          );
        } else {
          const insQuiz = await queryFn(
            'INSERT INTO quizzes (module_id, title, type, order_index) VALUES ($1, $2, $3, $4) RETURNING id',
            [newModuleId, q.title, q.type, q.order_index || (q.type === 'pre_test' ? 0 : 999)]
          );
          targetQuizId = insQuiz.rows[0].id;
        }
        quizIdMap.set(q.id, targetQuizId);
      }
    }

    // 3. Import Quiz Questions
    if (Array.isArray(quiz_questions)) {
      for (const ques of quiz_questions) {
        const newQuizId = quizIdMap.get(ques.quiz_id);
        if (!newQuizId) continue;

        // Check if question already exists in this quiz
        const existingQues = await queryFn(
          'SELECT id FROM quiz_questions WHERE quiz_id = $1 AND question_text = $2',
          [newQuizId, ques.question_text]
        );

        if (existingQues.rows.length > 0) {
          await queryFn(
            'UPDATE quiz_questions SET options = $1, correct_answer_index = $2 WHERE id = $3',
            [JSON.stringify(ques.options), ques.correct_answer_index, existingQues.rows[0].id]
          );
        } else {
          await queryFn(
            'INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer_index) VALUES ($1, $2, $3, $4)',
            [newQuizId, ques.question_text, JSON.stringify(ques.options), ques.correct_answer_index]
          );
        }
      }
    }

    if (client) await client.query('COMMIT');
    res.json({
      msg: 'Paket Kurikulum berhasil diimpor ke server lokal!',
      importedModulesCount: modules.length,
      importedQuizzesCount: (quizzes || []).length
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ msg: `Gagal mengimpor kurikulum: ${err.message}` });
  } finally {
    if (client) client.release();
  }
});

// @route   GET api/admin/grades/export
// @desc    Export student quiz results & progress for offline collection to flashdisk
// @access  Private (Admin)
router.get('/grades/export', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.name as nama_siswa,
        u.email,
        COALESCE(u.region, '-') as wilayah,
        COALESCE(u.district, '-') as distrik,
        COALESCE(m.topic, '-') as topik,
        COALESCE(m.module_name, '-') as modul,
        COALESCE(q.title, 'Kuis') as judul_kuis,
        COALESCE(q.type::text, '-') as tipe_kuis,
        qa.score as nilai,
        qa.created_at as waktu_selesai
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      LEFT JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN modules m ON q.module_id = m.id
      ORDER BY qa.created_at DESC, u.name ASC
    `);

    res.setHeader('Content-Disposition', `attachment; filename="rekap_nilai_siswa_${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Gagal mengekspor data nilai: ' + err.message });
  }
});

module.exports = router;
