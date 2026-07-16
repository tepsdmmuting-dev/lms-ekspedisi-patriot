const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET api/quizzes/module/:moduleId
// @desc    Get quizzes for a module (and user's attempts)
// @access  Private
router.get('/module/:moduleId', authMiddleware, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const userId = req.user.id;
    
    const quizzes = await db.query(`
      SELECT q.*, 
        (SELECT MAX(score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $1) as my_score
      FROM quizzes q
      WHERE q.module_id = $2
    `, [userId, moduleId]);
    
    res.json(quizzes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/quizzes
// @desc    Create a quiz
// @access  Private (Admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  const { module_id, title, type } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO quizzes (module_id, title, type) VALUES ($1, $2, $3) ON CONFLICT (module_id, type) DO UPDATE SET title = EXCLUDED.title RETURNING *',
      [module_id, title, type]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/quizzes/:id
// @desc    Get a quiz with its questions
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quiz.rows.length === 0) return res.status(404).json({ msg: 'Quiz not found' });
    
    const questions = await db.query('SELECT id, question_text, options, correct_answer_index FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    
    res.json({ ...quiz.rows[0], questions: questions.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/quizzes/:id/questions
// @desc    Add or update questions for a quiz (Bulk replace)
// @access  Private (Admin)
router.post('/:id/questions', [authMiddleware, adminMiddleware], async (req, res) => {
  const quizId = req.params.id;
  const { questions } = req.body; // array of { question_text, options, correct_answer_index }
  
  try {
    await db.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    
    if (questions && questions.length > 0) {
      for (let q of questions) {
        await db.query(
          'INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer_index) VALUES ($1, $2, $3, $4)',
          [quizId, q.question_text, JSON.stringify(q.options), q.correct_answer_index]
        );
      }
    }
    res.json({ msg: 'Questions updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/quizzes/attempt
// @desc    Submit a quiz attempt
// @access  Private
router.post('/attempt', authMiddleware, async (req, res) => {
  const { quiz_id, answers } = req.body; // answers: { [questionId]: selectedOptionIndex }
  const userId = req.user.id;
  
  try {
    const questions = await db.query('SELECT id, correct_answer_index FROM quiz_questions WHERE quiz_id = $1', [quiz_id]);
    
    let correctCount = 0;
    for (let q of questions.rows) {
      if (answers[q.id] === q.correct_answer_index) {
        correctCount++;
      }
    }
    
    const score = questions.rows.length > 0 ? Math.round((correctCount / questions.rows.length) * 100) : 0;
    
    const attempt = await db.query(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score) VALUES ($1, $2, $3) RETURNING *',
      [userId, quiz_id, score]
    );
    
    res.json(attempt.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   DELETE api/quizzes/:id
// @desc    Delete a quiz (and its questions/attempts)
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const quizId = req.params.id;
    await db.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [quizId]);
    await db.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    await db.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
    res.json({ msg: 'Quiz deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
