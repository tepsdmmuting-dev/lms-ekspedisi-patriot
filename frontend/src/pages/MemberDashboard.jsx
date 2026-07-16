import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuizModal from '../components/QuizModal';
import ThemeToggle from '../components/ThemeToggle';

const MemberDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/progress/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setModules(data);
          // Pre-fetch quizzes for all modules
          const token2 = localStorage.getItem('token');
          const quizzesMap = {};
          await Promise.all(data.map(async (mod) => {
            try {
              const qRes = await fetch(`/api/quizzes/module/${mod.id}`, {
                headers: { 'Authorization': `Bearer ${token2}` }
              });
              if (qRes.ok) quizzesMap[mod.id] = await qRes.json();
              else quizzesMap[mod.id] = [];
            } catch { quizzesMap[mod.id] = []; }
          }));
          setModuleQuizzes(quizzesMap);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProgress();
  }, [user.id]);

  const fetchQuizzesForModule = async (moduleId) => {
    if (moduleQuizzes[moduleId]) return;
    try {
      const res = await fetch(`/api/quizzes/module/${moduleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModuleQuizzes(prev => ({ ...prev, [moduleId]: data }));
      }
    } catch (err) { console.error(err); }
  };

  const openQuiz = async (quizMeta) => {
    const res = await fetch(`/api/quizzes/${quizMeta.id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      setActiveQuiz(data);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getMediaIcon = (platform) => {
    switch (platform) {
      case 'youtube': return 'smart_display';
      case 'tiktok': return 'movie';
      case 'instagram': return 'video_library';
      case 'gdrive_pdf': return 'picture_as_pdf';
      default: return 'play_circle';
    }
  };

  const formatGdriveDownload = (url) => {
    const fileIdMatch = url.match(/\/d\/(.+?)\//);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    return url;
  };

  const handleToggleComplete = async (mod) => {
    try {
      const token = localStorage.getItem('token');
      const newProgress = mod.completed ? 0 : 100;
      const res = await fetch('/api/progress/update', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: mod.id, progress_percentage: newProgress })
      });
      if (res.ok) {
        setModules(modules.map(m => m.id === mod.id ? { ...m, completed: !mod.completed, progress_percentage: newProgress } : m));
      }
    } catch (err) { console.error(err); }
  };

  const groupedModules = modules.reduce((acc, mod) => {
    const topic = mod.topic || 'Lainnya';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(mod);
    return acc;
  }, {});

  const totalCompleted = modules.filter(m => m.completed).length;
  const overallProgress = modules.length ? Math.round((totalCompleted / modules.length) * 100) : 0;

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-900 transition-colors duration-500 font-body-md text-on-surface dark:text-slate-300 min-h-screen flex relative overflow-hidden z-0">
      
      {/* Global Glassmorphism Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(0,74,116,0.15) 0%, rgba(0,74,116,0) 100%)' }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(244,199,36,0.15) 0%, rgba(244,199,36,0) 100%)' }}></div>
        <div className="absolute top-[30%] left-[50%] w-[50%] h-[50%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0) 100%)' }}></div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/60 shadow-sm z-40 flex items-center justify-between px-4 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm font-bold text-primary dark:text-white">Portal Trainee</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-primary dark:text-white p-2">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-white/95 dark:bg-slate-900/95 lg:bg-white/60 lg:dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/50 dark:border-slate-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary dark:text-white transition-colors duration-500">Portal <span className="text-secondary dark:text-yellow-400">Belajar</span></h2>
            <p className="font-body-md text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mt-1 transition-colors duration-500">Trainee Dashboard</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-on-surface-variant dark:text-slate-400 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5">
          <li>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'dashboard' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>space_dashboard</span> Beranda
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('modules'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg transition-all ${
                activeTab === 'modules' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'modules' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>menu_book</span> Materi Belajar
            </button>
          </li>
        </ul>
        <div className="p-4 border-t border-outline-variant/30 dark:border-slate-700/50 flex flex-col gap-2">
          <div className="hidden lg:flex justify-end px-2 mb-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-2 mb-2">
             <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-[#004A74] shadow-sm flex items-center justify-center text-white font-bold text-lg">
               {user?.name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-primary dark:text-white truncate transition-colors duration-500">{user?.name || 'User'}</p>
               <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate transition-colors duration-500">{user?.role === 'co_admin' ? 'Co-Admin' : 'Trainee'}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-4 text-error dark:text-red-400 px-4 py-3.5 hover:bg-error-container/50 dark:hover:bg-red-900/30 transition-all font-label-lg text-label-lg font-medium rounded-xl w-full text-left">
            <span className="material-symbols-outlined text-[22px]">logout</span> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 min-h-screen pt-24 md:pt-24 lg:pt-8 relative z-10">
        <div className="max-w-container-max mx-auto">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8 lg:mb-12">
                <h1 className="font-headline-xl text-headline-xl text-primary dark:text-white mb-2 transition-colors duration-500">Halo, {user?.name}! 👋</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 transition-colors duration-500">Siap untuk melanjutkan petualangan belajarmu hari ini?</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Overview Card */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-8 lg:col-span-2 flex flex-col justify-center relative overflow-hidden transition-colors duration-500">
                   <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-secondary/10 rotate-12 blur-2xl -z-10"></div>
                   
                   <div className="flex flex-col sm:flex-row items-center gap-8 z-10">
                     {/* Circular Progress */}
                     <div className="relative w-40 h-40 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" fill="transparent" r="42" stroke="rgba(255,255,255,0.5)" strokeWidth="12"></circle>
                          <circle cx="50" cy="50" fill="transparent" r="42" stroke="#004A74" strokeDasharray="264" strokeDashoffset={264 * (1 - (overallProgress / 100))} strokeLinecap="round" strokeWidth="12" className="transition-all duration-1000 ease-out"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display-sm text-primary dark:text-white leading-none transition-colors duration-500">{overallProgress}%</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-primary/70 dark:text-slate-400 mt-1 transition-colors duration-500">Selesai</span>
                        </div>
                     </div>
                     <div className="text-center sm:text-left">
                       <h3 className="font-headline-md text-primary dark:text-white mb-2 transition-colors duration-500">Progres Keseluruhan</h3>
                       <p className="text-on-surface-variant dark:text-slate-300 mb-4 leading-relaxed transition-colors duration-500">Anda telah menyelesaikan {totalCompleted} dari total {modules.length} materi pembelajaran. Terus semangat, sedikit lagi menuju garis akhir!</p>
                       <button onClick={() => setActiveTab('modules')} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                         Lanjutkan Belajar
                       </button>
                     </div>
                   </div>
                </div>

                {/* Info Card */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-8 flex flex-col justify-between transition-colors duration-500">
                   <div>
                     <div className="w-12 h-12 rounded-xl bg-secondary/20 dark:bg-secondary/30 flex items-center justify-center mb-4 text-secondary dark:text-yellow-400 transition-colors duration-500">
                        <span className="material-symbols-outlined text-3xl">emoji_events</span>
                     </div>
                     <h3 className="font-headline-sm text-primary dark:text-white mb-2 transition-colors duration-500">Pencapaian</h3>
                     <p className="text-on-surface-variant dark:text-slate-300 text-sm transition-colors duration-500">Selesaikan semua modul dan kuis untuk membuka sertifikat digital Ekspedisi Patriot.</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8 lg:mb-12">
                <h1 className="font-headline-xl text-headline-xl text-primary dark:text-white mb-2 transition-colors duration-500">Materi Belajar</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 transition-colors duration-500">Daftar lengkap seluruh modul dan tugas yang harus Anda selesaikan.</p>
              </header>

              <div className="space-y-12">
                {Object.entries(groupedModules).map(([topic, topicModules]) => {
                  const completedInTopic = topicModules.filter(m => m.completed).length;
                  const topicProgress = Math.round((completedInTopic / topicModules.length) * 100) || 0;

                  return (
                    <div key={topic} className="relative">
                      {/* Topic Header */}
                      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 p-4 rounded-xl shadow-sm transition-colors duration-500">
                        <h3 className="font-headline-sm text-primary dark:text-white flex items-center gap-3 transition-colors duration-500">
                          <span className="material-symbols-outlined text-secondary dark:text-yellow-400 transition-colors duration-500">folder_special</span> {topic}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-on-surface-variant dark:text-slate-400 uppercase tracking-wide transition-colors duration-500">{topicProgress}% Tuntas</span>
                          <div className="w-32 bg-white dark:bg-slate-900 rounded-full h-2.5 shadow-inner overflow-hidden border border-white dark:border-slate-700 transition-colors duration-500">
                            <div className="bg-secondary dark:bg-yellow-400 h-full rounded-full transition-all duration-1000" style={{ width: `${topicProgress}%` }}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {topicModules.map((mod) => (
                          <div key={mod.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-all duration-300 hover:-translate-y-1"
                            onMouseEnter={() => fetchQuizzesForModule(mod.id)}
                          >
                            {/* Thumbnail */}
                            <a href={mod.media_platform === 'gdrive_pdf' ? formatGdriveDownload(mod.external_url) : mod.external_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-32 h-40 sm:h-auto bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 relative group flex items-center justify-center border border-white/50 dark:border-slate-700/50 cursor-pointer block transition-colors duration-500">
                              {mod.image_url ? (
                                 <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-500 z-0" style={{ backgroundImage: `url('${mod.image_url}')` }}></div>
                              ) : null}
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-0"></div>
                              <span className={`material-symbols-outlined text-4xl opacity-80 z-10 drop-shadow-md ${mod.media_platform === 'gdrive_pdf' ? 'text-red-500' : 'text-white'}`}>
                                {getMediaIcon(mod.media_platform)}
                              </span>
                              <div className="absolute bottom-2 left-2 right-2 text-center bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider z-20">
                                {mod.category}
                              </div>
                            </a>

                            {/* Content */}
                            <div className="flex-1 flex flex-col">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[10px] font-bold text-secondary dark:text-yellow-400 uppercase tracking-widest bg-secondary/10 dark:bg-yellow-400/10 px-2 py-0.5 rounded-full transition-colors duration-500">{mod.media_platform}</span>
                                <button 
                                  onClick={() => handleToggleComplete(mod)}
                                  className={`flex items-center justify-center transition-all hover:scale-110 ${mod.completed ? 'text-green-500 hover:text-green-600' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'}`}
                                  title={mod.completed ? "Tandai Belum Selesai" : "Tandai Selesai"}
                                >
                                  <span className="material-symbols-outlined text-[24px]">
                                    {mod.completed ? 'check_circle' : 'radio_button_unchecked'}
                                  </span>
                                </button>
                              </div>
                              <a href={mod.media_platform === 'gdrive_pdf' ? formatGdriveDownload(mod.external_url) : mod.external_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                <h3 className="font-headline-sm font-bold text-primary dark:text-white line-clamp-2 leading-snug hover:text-[#004A74] dark:hover:text-blue-400 hover:underline decoration-primary/30 dark:decoration-blue-400/30 underline-offset-4 transition-all">{mod.title}</h3>
                              </a>
                              <p className="text-sm text-on-surface-variant dark:text-slate-400 line-clamp-2 mb-4 flex-1 transition-colors duration-500">{mod.description}</p>
                              
                              {/* Quiz Row */}
                              {(moduleQuizzes[mod.id] && moduleQuizzes[mod.id].length > 0) && (
                                <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-2 transition-colors duration-500">
                                  {moduleQuizzes[mod.id].map(q => (
                                    <button
                                      key={q.id}
                                      onClick={() => openQuiz(q)}
                                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 ${q.type === 'pre_test' ? 'border-orange-300/60 dark:border-orange-500/60 text-orange-700 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 hover:bg-orange-100/80 dark:hover:bg-orange-900/50 hover:shadow-md' : 'border-blue-300/60 dark:border-blue-500/60 text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 hover:shadow-md'}`}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">quiz</span>
                                      {q.type === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
                                      {q.my_score !== null ? ` (${q.my_score})` : ''}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onSubmit={(score) => {
            setModuleQuizzes(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(mid => {
                updated[mid] = updated[mid].map(q => q.id === activeQuiz.id ? { ...q, my_score: score } : q);
              });
              return updated;
            });
          }}
        />
      )}
    </div>
  );
};

export default MemberDashboard;
