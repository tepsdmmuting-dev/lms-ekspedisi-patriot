import React, { useState, useEffect } from 'react';

const QuizModal = ({ quiz, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animDir, setAnimDir] = useState('right'); // 'right' or 'left' for slide direction

  const total = quiz.questions.length;
  const currentQ = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;

  useEffect(() => {
    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const goNext = () => {
    if (currentIndex < total - 1) {
      setAnimDir('right');
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setAnimDir('left');
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < total) {
      // Find first unanswered
      const unansweredIdx = quiz.questions.findIndex(q => answers[q.id] === undefined);
      if (unansweredIdx !== -1) {
        setCurrentIndex(unansweredIdx);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch('/api/quizzes/attempt', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quiz.id, answers })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        onSubmit(data.score);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    if (score >= 40) return '💪';
    return '📚';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Luar Biasa!';
    if (score >= 60) return 'Bagus!';
    if (score >= 40) return 'Cukup Baik';
    return 'Terus Belajar!';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#2563eb';
    if (score >= 40) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative my-auto transition-colors" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full tracking-wider uppercase ${quiz.type === 'pre_test' ? 'bg-tertiary-container dark:bg-orange-900/30 text-white dark:text-orange-400 border border-orange-500/30' : 'bg-primary-container dark:bg-blue-900/30 text-white dark:text-blue-400 border border-blue-500/30'}`}>
                {quiz.type === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
              </span>
              <h2 className="font-headline-sm text-primary dark:text-white mt-3 leading-tight transition-colors duration-500">{quiz.title}</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800 hover:text-error dark:hover:text-red-400 transition-all">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Progress Bar */}
          {!result && (
            <div className="mt-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400 transition-colors duration-500">Soal {currentIndex + 1} dari {total}</span>
                <span className="text-xs font-bold text-primary dark:text-white transition-colors duration-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-surface-container-high dark:bg-slate-800 rounded-full h-2 overflow-hidden transition-colors duration-500">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 mt-3">
                {quiz.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => { setAnimDir(idx > currentIndex ? 'right' : 'left'); setCurrentIndex(idx); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                      idx === currentIndex
                        ? 'bg-primary dark:bg-blue-500 scale-125'
                        : answers[q.id] !== undefined
                          ? 'bg-secondary dark:bg-yellow-400'
                          : 'bg-white/80 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                    }`}
                    title={`Soal ${idx + 1}${answers[q.id] !== undefined ? ' ✓' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden px-6 pb-2">
          {result ? (
            /* ─── Result Screen ─── */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {/* Animated Score Circle */}
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#edeef0" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="42" fill="transparent"
                    stroke={getScoreColor(result.score)}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.score / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-1">{getScoreEmoji(result.score)}</span>
                  <span className="text-3xl font-bold text-primary dark:text-white transition-colors duration-500">{result.score}</span>
                </div>
              </div>
              <h3 className="font-headline-md text-primary dark:text-white mb-1 transition-colors duration-500">{getScoreMessage(result.score)}</h3>
              <p className="text-on-surface-variant dark:text-slate-300 text-sm mb-8 transition-colors duration-500">
                Skor kamu: <strong className="text-primary dark:text-white">{result.score} / 100</strong>
              </p>
              <button onClick={onClose} className="bg-primary text-on-primary px-10 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md">
                Selesai
              </button>
            </div>
          ) : (
            /* ─── Single Question View ─── */
            <div key={currentIndex} className="animate-fadeSlide">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-on-primary text-sm font-bold flex-shrink-0 mt-0.5">
                    {currentIndex + 1}
                  </span>
                  <h3 className="font-body-lg text-on-surface dark:text-slate-200 leading-relaxed text-[17px] pt-1.5 transition-colors duration-500">
                    {currentQ.question_text}
                  </h3>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        setAnswers({ ...answers, [currentQ.id]: oIdx });
                        // Auto-advance after short delay
                        if (currentIndex < total - 1) {
                          setTimeout(() => {
                            setAnimDir('right');
                            setCurrentIndex(currentIndex + 1);
                          }, 400);
                        }
                      }}
                      className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${
                        isSelected
                          ? 'bg-white/90 dark:bg-slate-800 border-primary dark:border-blue-500 shadow-[0_8px_30px_rgba(0,74,116,0.15)] ring-2 ring-primary/20 dark:ring-blue-500/20'
                          : 'bg-white/40 dark:bg-slate-800/40 border-white/60 dark:border-slate-700/60 shadow-sm hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-md hover:border-primary/30 dark:hover:border-blue-400/30'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                          : 'bg-white/60 dark:bg-slate-700 border border-white dark:border-slate-600 shadow-sm text-on-surface-variant dark:text-slate-400 group-hover:bg-primary/10 dark:group-hover:bg-blue-900/30 group-hover:text-primary dark:group-hover:text-blue-400 group-hover:border-primary/30 dark:group-hover:border-blue-400/30'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className={`flex-1 text-[15px] ${isSelected ? 'text-on-primary-container dark:text-white font-medium' : 'text-on-surface dark:text-slate-300'}`}>
                        {opt}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined filled text-primary dark:text-blue-400 text-xl">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!result && (
          <div className="p-6 pt-4 border-t border-outline-variant dark:border-slate-700/50 flex justify-between items-center transition-colors duration-500">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Sebelumnya
            </button>

            <span className="text-xs text-on-surface-variant dark:text-slate-500 transition-colors duration-500">
              {Object.keys(answers).length}/{total} terjawab
            </span>

            {currentIndex === total - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? 'Mengirim...' : 'Submit Jawaban'}
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
              >
                Selanjutnya
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeSlide {
          animation: fadeSlide 0.35s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuizModal;
