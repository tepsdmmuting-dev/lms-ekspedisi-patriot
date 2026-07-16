import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Quiz Builder for a single module
const QuizBuilder = ({ module, onClose }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null); // { type: 'pre_test'|'post_test', id: null|number }
  const [questions, setQuestions] = useState([]); // [ { question_text, options: ['A','B','C','D'], correct_answer_index: 0 } ]

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (activeQuiz) {
          setActiveQuiz(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeQuiz, onClose]);

  const fetchQuizzes = async () => {
    const res = await fetch(`/api/quizzes/module/${module.id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) setQuizzes(await res.json());
  };

  const startEditing = (type) => {
    const existing = quizzes.find(q => q.type === type);
    setActiveQuiz({ type, id: existing?.id || null, title: existing?.title || `${type === 'pre_test' ? 'Pre-Test' : 'Post-Test'}: ${module.title}` });
    if (existing) {
      fetchQuestions(existing.id);
    } else {
      setQuestions([{ question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);
    }
  };

  const fetchQuestions = async (quizId) => {
    const res = await fetch(`/api/quizzes/${quizId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions.length > 0 ? data.questions.map(q => ({
        ...q, options: q.options
      })) : [{ question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');

    // 1. Create or upsert quiz
    const quizRes = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: module.id, title: activeQuiz.title, type: activeQuiz.type })
    });

    if (!quizRes.ok) { alert('Gagal membuat kuis'); return; }
    const quiz = await quizRes.json();

    // 2. Save questions
    const questRes = await fetch(`/api/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
    });

    if (questRes.ok) {
      alert('Kuis berhasil disimpan!');
      setActiveQuiz(null);
      fetchQuizzes();
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kuis ini beserta semua pertanyaannya?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Kuis berhasil dihapus!');
        fetchQuizzes();
      } else {
        alert('Gagal menghapus kuis');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const quizTypeLabel = (type) => type === 'pre_test' ? 'Pre-Test' : 'Post-Test';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto transition-colors duration-500">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto relative transition-colors duration-500">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/60 dark:border-slate-700">
          <div>
            <h2 className="font-headline-sm text-primary dark:text-white transition-colors duration-500">Manage Quizzes</h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">{module.title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!activeQuiz ? (
            // Quiz selection screen
            <div className="space-y-4">
              {['pre_test', 'post_test'].map(type => {
                const existing = quizzes.find(q => q.type === type);
                return (
                  <div key={type} className="bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/60 shadow-sm rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                    <div className="w-full sm:flex-1">
                      <h3 className="font-label-lg font-bold text-primary dark:text-blue-400">{quizTypeLabel(type)}</h3>
                      {existing ? (
                        <p className="text-sm text-secondary dark:text-yellow-400 mt-1">✓ {existing.title} — telah dibuat</p>
                      ) : (
                        <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">Belum ada soal</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-1 sm:mt-0">
                      <button
                        onClick={() => startEditing(type)}
                        className="bg-primary dark:bg-slate-700 text-on-primary dark:text-white shrink-0 px-4 sm:px-0 sm:w-[120px] py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-primary/90 dark:hover:bg-slate-600 transition-colors text-center flex-1 sm:flex-none"
                      >
                        {existing ? 'Edit Soal' : 'Buat Soal'}
                      </button>
                      {existing && (
                        <button
                          onClick={() => handleDeleteQuiz(existing.id)}
                          className="bg-error/10 dark:bg-red-900/30 text-error dark:text-red-400 p-2.5 shrink-0 rounded-full hover:bg-error/20 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center"
                          title="Hapus Kuis"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Question editor
            <div className="space-y-6">
              <div>
                <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Judul Kuis</label>
                <input
                  type="text"
                  value={activeQuiz.title}
                  onChange={e => setActiveQuiz({ ...activeQuiz, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"
                />
              </div>
              
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/60 shadow-sm rounded-xl p-6 space-y-4 transition-colors">
                  <div className="flex justify-between items-center">
                    <h3 className="font-label-lg font-bold dark:text-slate-200">Soal #{qIdx + 1}</h3>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIdx)} className="text-error dark:text-red-400 text-sm hover:underline">Hapus</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Pertanyaan</label>
                    <textarea
                      rows={2}
                      value={q.question_text}
                      onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-slate-700/60 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"
                      placeholder="Tulis pertanyaan di sini..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-label-sm font-medium dark:text-slate-300">Pilihan Jawaban (pilih yang benar)</label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correct_answer_index === oIdx}
                          onChange={() => updateQuestion(qIdx, 'correct_answer_index', oIdx)}
                          className="w-4 h-4 accent-primary dark:accent-blue-400"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                          className={`flex-1 px-4 py-3 bg-white/70 dark:bg-slate-900/70 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 outline-none transition-all text-sm border ${q.correct_answer_index === oIdx ? 'border-primary ring-1 ring-primary dark:border-blue-400 dark:ring-blue-400 bg-primary/5 dark:bg-blue-400/10' : 'border-white/60 dark:border-slate-700/60'}`}
                          placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                        />
                        {q.correct_answer_index === oIdx && (
                          <span className="text-secondary dark:text-yellow-400 text-xs font-bold">✓ Benar</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-outline-variant dark:border-slate-600 rounded-xl text-on-surface-variant dark:text-slate-400 hover:border-primary dark:hover:border-blue-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
                + Tambah Soal
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-white/60 dark:border-slate-700 flex justify-end gap-3">
          {activeQuiz ? (
            <>
              <button onClick={() => setActiveQuiz(null)} className="px-6 py-2.5 border border-outline-variant dark:border-slate-600 rounded-full text-on-surface-variant dark:text-slate-300 font-bold hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors">Kembali</button>
              <button onClick={handleSave} className="bg-primary dark:bg-yellow-500 text-on-primary dark:text-slate-900 px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-primary/90 dark:hover:bg-yellow-400 transition-colors">Simpan Kuis</button>
            </>
          ) : (
            <button onClick={onClose} className="px-6 py-2.5 border border-outline-variant dark:border-slate-600 rounded-full text-on-surface-variant dark:text-slate-300 font-bold hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors">Tutup</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuizBuilder;
