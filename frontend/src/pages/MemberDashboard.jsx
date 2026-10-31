import React, { useContext, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuizModal from '../components/QuizModal';
import ThemeToggle from '../components/ThemeToggle';
import TopicRecapModal from '../components/TopicRecapModal';
import { TOPICS_LIST } from '../constants/topics';

const MemberDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTopicTab, setSelectedTopicTab] = useState('ALL');
  const [collapsedModules, setCollapsedModules] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const playingIframeRef = useRef(null);
  const playingVideoRef = useRef(null);
  const [watchNoticeModal, setWatchNoticeModal] = useState({ show: false, module: null });
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [recapModal, setRecapModal] = useState({
    show: false,
    topicName: '',
    topicMeta: null,
    modules: []
  });

  const toggleModuleCollapse = (key) => {
    setCollapsedModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
    
    // YouTube Standard
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&rel=0${originParam}`;
    
    // YouTube Shorts
    const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (ytShortsMatch && ytShortsMatch[1]) return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1&enablejsapi=1&rel=0${originParam}`;
    
    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/.*?\/video\/(\d+)/);
    if (tiktokMatch && tiktokMatch[1]) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    
    // Instagram (Post, Reel, TV)
    const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    if (igMatch && igMatch[1]) return `https://www.instagram.com/p/${igMatch[1]}/embed/`;
    
    // Spotify
    const spotifyMatch = url.match(/open\.spotify\.com\/(track|playlist|episode|album)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
    
    // Google Drive PDF/Docs
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    
    return url;
  };

  const isEmbeddable = (mod) => {
    const url = typeof mod === 'string' ? mod : mod?.external_url;
    const platform = typeof mod === 'object' ? mod?.media_platform : null;
    if (!url) return false;
    if (platform === 'local_pdf' || url.startsWith('/uploads/documents/') || url.endsWith('.pdf')) return false;
    if (platform === 'local_video' || url.startsWith('/uploads/videos/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mkv')) return true;
    return !!(
      url.match(/(?:youtu\.be\/|youtube\.com\/)/) ||
      url.match(/tiktok\.com\/.*?\/video\/\d+/) ||
      url.match(/instagram\.com\/(?:p|reel|tv)\//) ||
      url.match(/open\.spotify\.com\/(track|playlist|episode|album)\//) ||
      url.match(/drive\.google\.com\/file\/d\//)
    );
  };

  const handleMediaClick = (mod) => {
    if (mod.media_platform === 'local_pdf' || mod.external_url?.endsWith('.pdf') || mod.external_url?.startsWith('/uploads/documents/')) {
      window.open(mod.external_url, '_blank');
      return;
    }
    if (isEmbeddable(mod)) {
      setPlayingVideo(mod);
    } else {
      window.open(mod.media_platform === 'gdrive_pdf' ? formatGdriveDownload(mod.external_url) : mod.external_url, '_blank');
    }
  };

  const fetchProgress = async () => {
    setLoadingModules(true);
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
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProgress();
    }
  }, [user?.id]);

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
    try {
      const res = await fetch(`/api/quizzes/${quizMeta.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuiz(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openQuizByType = async (moduleId, type) => {
    try {
      const existing = moduleQuizzes[moduleId]?.find(q => q.type === type);
      if (existing) {
        return openQuiz(existing);
      }
      const res = await fetch(`/api/quizzes/module/${moduleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const list = await res.json();
        setModuleQuizzes(prev => ({ ...prev, [moduleId]: list }));
        const match = list.find(q => q.type === type);
        if (match) {
          openQuiz(match);
        } else {
          alert(`Soal ${type === 'pre_test' ? 'Pre-Test' : 'Post-Test'} belum tersedia untuk materi ini.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getMediaIcon = (platform) => {
    switch (platform) {
      case 'local_video': return 'video_file';
      case 'local_pdf': return 'picture_as_pdf';
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

  const isVideoModule = (mod) => {
    if (!mod) return false;
    if (mod.media_platform === 'local_video' || mod.media_platform === 'youtube' || mod.media_platform === 'tiktok') return true;
    const url = mod.external_url || '';
    if (url.match(/(?:youtu\.be\/|youtube\.com\/|tiktok\.com\/)/)) return true;
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('/uploads/videos/')) return true;
    return false;
  };

  const markModuleCompleted = async (mod) => {
    if (!mod) return;
    const current = modules.find(m => m.id === mod.id);
    if (current?.completed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/progress/update', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: mod.id, progress_percentage: 100 })
      });
      if (res.ok) {
        setModules(prev => prev.map(m => m.id === mod.id ? { ...m, completed: true, progress_percentage: 100 } : m));
        setJustCompletedId(mod.id);
        setTimeout(() => setJustCompletedId(null), 7000);
      }
    } catch (err) {
      console.error("Gagal memperbarui progress", err);
    }
  };

  // Deteksi YouTube ENDED (State 0) saat video ditonton sampai selesai
  useEffect(() => {
    if (!playingVideo) return;

    const handleMessage = (event) => {
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      if (!data || typeof data !== 'object') return;

      let state = null;
      if (data.event === 'onStateChange') {
        state = data.info;
      } else if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
        state = data.info.playerState;
      }

      // State 0 = ENDED (video selesai ditonton full!)
      if (state === 0) {
        markModuleCompleted(playingVideo);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [playingVideo, modules]);

  // Handshake ke YouTube iframe
  useEffect(() => {
    if (!playingVideo) return;
    const isLocal = playingVideo.media_platform === 'local_video' || 
                    playingVideo.external_url?.endsWith('.mp4') || 
                    playingVideo.external_url?.startsWith('/uploads/');
    if (isLocal) return;

    const pingYT = () => {
      if (playingIframeRef.current?.contentWindow) {
        try {
          playingIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'listening' }),
            '*'
          );
          playingIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
            '*'
          );
        } catch (e) {}
      }
    };

    pingYT();
    const interval = setInterval(pingYT, 1000);
    return () => clearInterval(interval);
  }, [playingVideo]);

  const handleToggleComplete = async (mod) => {
    if (!mod.completed) {
      // Jika materi ini adalah video, siswa WAJIB menonton video sampai selesai
      if (isVideoModule(mod)) {
        setWatchNoticeModal({
          show: true,
          module: mod
        });
        return;
      }
      // Untuk dokumen PDF / non-video, langsung tandai selesai
      await markModuleCompleted(mod);
    } else {
      // Jika sudah selesai, konfirmasi jika ingin membatalkan status centang
      if (window.confirm(`Batalkan status centang selesai untuk materi "${mod.title}"?`)) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/progress/update', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ module_id: mod.id, progress_percentage: 0 })
          });
          if (res.ok) {
            setModules(prev => prev.map(m => m.id === mod.id ? { ...m, completed: false, progress_percentage: 0 } : m));
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
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
              {/* Header Materi Belajar */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-500">
                <div>
                  <h1 className="font-headline-xl text-2xl md:text-3xl font-bold text-primary dark:text-white mb-2 transition-colors duration-500 flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary dark:text-yellow-400 text-3xl">menu_book</span>
                    Materi Belajar
                  </h1>
                  <p className="text-sm md:text-base text-on-surface-variant dark:text-slate-400 transition-colors duration-500 max-w-2xl leading-relaxed">
                    Kurikulum pembelajaran resmi Ekspedisi Patriot. Pelajari materi per topik dan modul, serta selesaikan pre-test dan post-test untuk membuka sertifikat digital.
                  </p>
                </div>

                {/* Progress Summary Pill */}
                <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 shrink-0 flex flex-col gap-2 min-w-[220px]">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Progres Belajar</span>
                    <span className="text-primary dark:text-yellow-400">{overallProgress}% Selesai</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary dark:bg-yellow-400 h-full rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    {totalCompleted} dari {modules.length} Materi Tuntas
                  </p>
                </div>
              </div>

              {/* Filter Tabs Berdasarkan Topik */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedTopicTab('ALL')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    selectedTopicTab === 'ALL'
                      ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">apps</span>
                  <span>Semua Topik</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{modules.length}</span>
                </button>

                {TOPICS_LIST.map(topic => {
                  const topicMods = modules.filter(m => (m.topic || '').toLowerCase() === topic.name.toLowerCase());
                  const completedInTopic = topicMods.filter(m => m.completed).length;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopicTab(topic.name)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        selectedTopicTab === topic.name
                          ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                          : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{topic.icon}</span>
                      <span>{topic.name}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        completedInTopic === topicMods.length && topicMods.length > 0
                          ? 'bg-emerald-500 text-white font-bold'
                          : selectedTopicTab === topic.name ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {completedInTopic === topicMods.length && topicMods.length > 0 ? `✓ ${completedInTopic}/${topicMods.length}` : `${completedInTopic}/${topicMods.length}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Loading Skeleton */}
              {loadingModules && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                  <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                </div>
              )}

              {/* Empty State */}
              {!loadingModules && modules.length === 0 && (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 text-secondary dark:text-yellow-400 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary dark:text-white mb-2">Belum Ada Materi Ditugaskan</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Materi belajar untuk akun Anda belum tersedia atau instruktur sedang mempersiapkan kurikulum penugasan. Silakan segarkan halaman atau hubungi administrator jika Anda seharusnya memiliki akses.
                  </p>
                  <button
                    type="button"
                    onClick={fetchProgress}
                    className="px-6 py-2.5 bg-primary dark:bg-yellow-400 text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-md hover:opacity-90 flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    <span>Segarkan Halaman</span>
                  </button>
                </div>
              )}

              {/* Kurikulum LMS Terstruktur (Topik -> Modul -> Materi) */}
              {!loadingModules && modules.length > 0 && (
                <div className="space-y-10">
                  {(() => {
                    // Filter topics
                    let topicsToRender = [];
                    if (selectedTopicTab === 'ALL') {
                      // Collect all distinct topics from modules + TOPICS_LIST order
                      const usedTopics = Array.from(new Set(modules.map(m => m.topic || 'Lainnya')));
                      topicsToRender = TOPICS_LIST.map(t => t.name).filter(name => usedTopics.some(u => u.toLowerCase() === name.toLowerCase()));
                      usedTopics.forEach(u => {
                        if (!topicsToRender.some(t => t.toLowerCase() === u.toLowerCase())) {
                          topicsToRender.push(u);
                        }
                      });
                    } else {
                      topicsToRender = [selectedTopicTab];
                    }

                    return topicsToRender.map(currentTopic => {
                      const topicModules = modules.filter(m => 
                        (m.topic || 'Lainnya').toLowerCase() === currentTopic.toLowerCase()
                      );

                      if (topicModules.length === 0) {
                        return (
                          <div key={currentTopic} className="bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl text-center">
                            <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">auto_stories</span>
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Belum ada materi untuk topik {currentTopic}</h4>
                            <p className="text-xs text-slate-400 mt-1">Materi pada topik ini akan segera diperbarui oleh tim LMS.</p>
                          </div>
                        );
                      }

                      const completedInTopic = topicModules.filter(m => m.completed).length;
                      const topicProgress = Math.round((completedInTopic / topicModules.length) * 100) || 0;
                      const topicMeta = TOPICS_LIST.find(t => t.name.toLowerCase() === currentTopic.toLowerCase());

                      // Group by module_name
                      const moduleGroups = {};
                      topicModules.forEach(m => {
                        const modName = m.module_name || 'Modul 1';
                        if (!moduleGroups[modName]) moduleGroups[modName] = [];
                        moduleGroups[modName].push(m);
                      });

                      // Sort materials inside each module by order_index
                      Object.keys(moduleGroups).forEach(modName => {
                        moduleGroups[modName].sort((a, b) => (parseInt(a.order_index) || 1) - (parseInt(b.order_index) || 1));
                      });

                      const moduleNames = Object.keys(moduleGroups).sort((a, b) => {
                        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                      });

                      return (
                        <div key={currentTopic} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 transition-colors duration-500">
                          {/* Topic Banner */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/60 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-yellow-400/20 text-primary dark:text-yellow-400 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-2xl">{topicMeta?.icon || 'folder_special'}</span>
                              </div>
                              <div>
                                <h3 className="font-headline-sm text-lg md:text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                                  {currentTopic}
                                </h3>
                                {topicMeta?.subtitle && (
                                  <p className="text-xs text-on-surface-variant dark:text-slate-400">{topicMeta.subtitle}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-end md:self-auto">
                              <div className="text-right">
                                <span className="text-xs font-bold text-primary dark:text-yellow-400">{completedInTopic} dari {topicModules.length} Tuntas</span>
                                <p className="text-[10px] text-slate-400">{moduleNames.length} Modul Pembelajaran</p>
                              </div>
                              <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-secondary dark:bg-yellow-400 h-full rounded-full transition-all duration-700" style={{ width: `${topicProgress}%` }}></div>
                              </div>

                              {/* Tombol Cetak Rekap Hasil (Aktif jika 100% tuntas) */}
                              {topicProgress === 100 ? (
                                <button
                                  type="button"
                                  onClick={() => setRecapModal({
                                    show: true,
                                    topicName: currentTopic,
                                    topicMeta,
                                    modules: topicModules
                                  })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 cursor-pointer"
                                  title="Cetak Rekapitulasi Hasil Belajar Topik Ini"
                                >
                                  <span className="material-symbols-outlined text-base">print</span>
                                  <span>Cetak Rekap Hasil</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 font-medium text-xs border border-slate-200 dark:border-slate-700/80 cursor-not-allowed shrink-0"
                                  title="Selesaikan seluruh materi pada topik ini untuk membuka dan mencetak rekapitulasi hasil belajar"
                                >
                                  <span className="material-symbols-outlined text-sm">lock</span>
                                  <span>Rekap Terkunci</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Accordion Modul 1, Modul 2, dst. */}
                          <div className="space-y-4">
                            {moduleNames.map((modName, modIdx) => {
                              const materiList = moduleGroups[modName];
                              const completedInMod = materiList.filter(m => m.completed).length;
                              const isModCompleted = completedInMod === materiList.length;
                              const modProgressPercent = Math.round((completedInMod / materiList.length) * 100);
                              const collapseKey = `${currentTopic}_${modName}`;
                              const isCollapsed = collapsedModules[collapseKey] === true;

                              return (
                                <div 
                                  key={modName} 
                                  className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl overflow-hidden transition-all shadow-sm"
                                >
                                  {/* Modul Header Bar */}
                                  <div 
                                    onClick={() => toggleModuleCollapse(collapseKey)}
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors select-none"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                        isModCompleted 
                                          ? 'bg-emerald-500 text-white' 
                                          : 'bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-400'
                                      }`}>
                                        {isModCompleted ? (
                                          <span className="material-symbols-outlined text-base">check</span>
                                        ) : (
                                          modIdx + 1
                                        )}
                                      </span>
                                      <div>
                                        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
                                          <span>{modName}</span>
                                          {isModCompleted && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                              Tuntas
                                            </span>
                                          )}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {materiList.length} Materi Pembelajaran • {completedInMod} Selesai
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden hidden sm:block">
                                        <div className={`h-full rounded-full transition-all duration-500 ${isModCompleted ? 'bg-emerald-500' : 'bg-primary dark:bg-yellow-400'}`} style={{ width: `${modProgressPercent}%` }}></div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:min-w-[40px] text-right">
                                        {modProgressPercent}%
                                      </span>
                                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                                        expand_more
                                      </span>
                                    </div>
                                  </div>

                                  {/* Modul Content: Organized by Custom Sequence */}
                                  {!isCollapsed && (
                                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/50 dark:border-slate-800/60">
                                      {(() => {
                                        const repModule = materiList.find(m => m.has_pre_test || m.has_post_test) || materiList[0];

                                        // Collect all quizzes across materiList in this module group, deduplicated by id
                                        const allModQuizzesMap = new Map();
                                        materiList.forEach(m => {
                                          (m.quizzes || []).forEach(q => {
                                            if (!allModQuizzesMap.has(q.id)) {
                                              allModQuizzesMap.set(q.id, { ...q, parentModule: m });
                                            }
                                          });
                                          (moduleQuizzes[m.id] || []).forEach(q => {
                                            if (!allModQuizzesMap.has(q.id)) {
                                              allModQuizzesMap.set(q.id, { ...q, parentModule: m });
                                            }
                                          });
                                        });
                                        const modQuizzes = Array.from(allModQuizzesMap.values());

                                        // Combined items: Pre-Test, Lessons (Materi), and Post-Test all in one list, sorted by order_index
                                        const combinedItems = [
                                          ...materiList.map(mod => ({
                                            itemType: 'materi',
                                            id: mod.id,
                                            data: mod,
                                            order_index: mod.order_index != null ? Number(mod.order_index) : 1,
                                            title: mod.title
                                          })),
                                          ...modQuizzes.map(q => ({
                                            itemType: 'quiz',
                                            quizType: q.type,
                                            id: q.id,
                                            data: q,
                                            order_index: q.order_index != null ? Number(q.order_index) : (q.type === 'pre_test' ? 0 : 999),
                                            title: q.title || (q.type === 'pre_test' ? `Pre-Test: ${modName}` : `Post-Test: ${modName}`)
                                          }))
                                        ].sort((a, b) => a.order_index - b.order_index);

                                        return (
                                          <div className="space-y-3 pt-3">
                                            {combinedItems.map((item, itemIdx) => {
                                              if (item.itemType === 'quiz') {
                                                const isPreTest = item.quizType === 'pre_test';
                                                const quiz = item.data;
                                                const hasScore = quiz?.my_score !== null && quiz?.my_score !== undefined;

                                                return (
                                                  <div
                                                    key={`quiz-${item.id}`}
                                                    className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs transition-all ${
                                                      isPreTest
                                                        ? 'bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/60'
                                                        : 'bg-blue-500/10 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700/60'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                        #{itemIdx + 1}
                                                      </span>

                                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                                        isPreTest ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                                      }`}>
                                                        <span className="material-symbols-outlined text-2xl">
                                                          {isPreTest ? 'assignment_turned_in' : 'task_alt'}
                                                        </span>
                                                      </div>

                                                      <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                            isPreTest
                                                              ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40'
                                                              : 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40'
                                                          }`}>
                                                            {isPreTest ? 'PRE-TEST MODUL' : 'POST-TEST (EVALUASI AKHIR)'}
                                                          </span>
                                                          {hasScore && (
                                                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                                              Skor Anda: {quiz.my_score} / 100
                                                            </span>
                                                          )}
                                                        </div>
                                                        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 mt-1 truncate">
                                                          {item.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                          {isPreTest
                                                            ? 'Uji pemahaman awal Anda sebelum mempelajari materi dalam modul ini.'
                                                            : 'Selesaikan evaluasi akhir ini untuk menguji hasil pemahaman Anda setelah mempelajari materi.'}
                                                        </p>
                                                      </div>
                                                    </div>

                                                    <button
                                                      type="button"
                                                      onClick={() => openQuiz(quiz)}
                                                      className={`px-4 py-2 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm hover-lift text-white ${
                                                        isPreTest
                                                          ? 'bg-amber-500 hover:bg-amber-600'
                                                          : 'bg-blue-600 hover:bg-blue-700'
                                                      }`}
                                                    >
                                                      <span className="material-symbols-outlined text-base">quiz</span>
                                                      <span>{hasScore ? `Kerjakan Ulang ${isPreTest ? 'Pre-Test' : 'Post-Test'}` : `Mulai ${isPreTest ? 'Pre-Test' : 'Post-Test'}`}</span>
                                                    </button>
                                                  </div>
                                                );
                                              }

                                              // Lesson item
                                              const mod = item.data;
                                              return (
                                                <div
                                                  key={`materi-${mod.id}`}
                                                  className={`bg-white dark:bg-slate-800/90 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${
                                                    mod.completed 
                                                      ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20' 
                                                      : 'border-slate-200 dark:border-slate-700'
                                                  }`}
                                                  onMouseEnter={() => fetchQuizzesForModule(mod.id)}
                                                >
                                                  {/* Left Info */}
                                                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                                                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                                                      #{itemIdx + 1}
                                                    </span>

                                                    <div 
                                                      onClick={() => handleMediaClick(mod)}
                                                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 relative group flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer"
                                                    >
                                                      {mod.image_url ? (
                                                        <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-90 group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url('${mod.image_url}')` }}></div>
                                                      ) : null}
                                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                                                      <span className={`material-symbols-outlined text-2xl z-10 drop-shadow-md ${
                                                        mod.media_platform === 'local_video' ? 'text-emerald-500' :
                                                        mod.media_platform === 'local_pdf' ? 'text-rose-500' :
                                                        mod.media_platform === 'youtube' ? 'text-red-500' :
                                                        mod.media_platform === 'gdrive_pdf' ? 'text-rose-500' : 'text-white'
                                                      }`}>
                                                        {getMediaIcon(mod.media_platform)}
                                                      </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                          mod.media_platform === 'local_video'
                                                            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60'
                                                            : mod.media_platform === 'local_pdf'
                                                            ? 'text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60'
                                                            : 'text-secondary dark:text-yellow-400 bg-secondary/10 dark:bg-yellow-400/10'
                                                        }`}>
                                                          {mod.media_platform === 'local_video' ? 'MP4 Lokal (Offline)' : mod.media_platform === 'local_pdf' ? 'PDF Lokal (Offline)' : mod.media_platform}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                          {mod.category}
                                                        </span>
                                                      </div>

                                                      <h4 
                                                        onClick={() => handleMediaClick(mod)}
                                                        className="font-bold text-sm sm:text-base text-primary dark:text-white line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                                      >
                                                        {mod.title}
                                                      </h4>
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                        {mod.description || 'Klik untuk membuka materi pembelajaran.'}
                                                      </p>
                                                    </div>
                                                  </div>

                                                  {/* Right Actions */}
                                                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50">
                                                    {/* Play/View Button */}
                                                    <button
                                                      type="button"
                                                      onClick={() => handleMediaClick(mod)}
                                                      className="px-3.5 py-1.5 bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400 hover:bg-primary hover:text-white dark:hover:bg-blue-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                      <span className="material-symbols-outlined text-base">play_circle</span>
                                                      <span>Pelajari</span>
                                                    </button>

                                                    {/* Checkbox Selesai */}
                                                    <button 
                                                      type="button"
                                                      onClick={() => handleToggleComplete(mod)}
                                                      className={`flex items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                                                        mod.completed 
                                                          ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
                                                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                                                      }`}
                                                      title={
                                                        mod.completed 
                                                          ? "Materi Tuntas Selesai (Klik untuk ubah)" 
                                                          : isVideoModule(mod) 
                                                            ? "Wajib tonton video sampai selesai untuk mencentang" 
                                                            : "Tandai Selesai"
                                                      }
                                                    >
                                                      <span className="material-symbols-outlined text-2xl">
                                                        {mod.completed ? 'check_circle' : 'radio_button_unchecked'}
                                                      </span>
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
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

      {playingVideo && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 transition-all overflow-y-auto">
          <div className="w-full max-w-4xl flex flex-col gap-3 relative my-auto">
            {/* Header Status Bar & Close */}
            <div className="flex items-center justify-between gap-3">
              {(() => {
                const isCompleted = modules.find(m => m.id === playingVideo.id)?.completed || justCompletedId === playingVideo.id;
                return (
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm animate-in fade-in">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Materi Ini Telah Tuntas Selesai</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-sky-500/20 text-sky-200 border border-sky-400/30 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-sm">
                        <span className="material-symbols-outlined text-base text-sky-400">info</span>
                        <span>Tonton video ini sampai selesai agar materi otomatis tercentang</span>
                      </span>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => setPlayingVideo(null)}
                className="w-9 h-9 md:w-10 md:h-10 bg-white/10 hover:bg-red-500 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg border border-white/20 hover:border-red-500 cursor-pointer"
                title="Tutup Pemutar"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Video Player */}
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 aspect-video relative">
              {playingVideo.media_platform === 'local_video' || playingVideo.external_url?.endsWith('.mp4') || playingVideo.external_url?.startsWith('/uploads/') ? (
                <video
                  ref={playingVideoRef}
                  src={playingVideo.external_url}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onEnded={() => markModuleCompleted(playingVideo)}
                  onTimeUpdate={(e) => {
                    const v = e.target;
                    if (v.duration > 0 && v.currentTime / v.duration >= 0.95) {
                      markModuleCompleted(playingVideo);
                    }
                  }}
                  className="w-full h-full absolute inset-0 object-contain bg-black"
                >
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              ) : (
                <iframe
                  ref={playingIframeRef}
                  src={getEmbedUrl(playingVideo.external_url)}
                  onLoad={() => {
                    try {
                      playingIframeRef.current?.contentWindow?.postMessage(
                        JSON.stringify({ event: 'listening' }),
                        '*'
                      );
                      playingIframeRef.current?.contentWindow?.postMessage(
                        JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
                        '*'
                      );
                    } catch (e) {}
                  }}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>

            {/* Success Celebration Toast when completed */}
            {justCompletedId === playingVideo.id && (
              <div className="bg-emerald-600/90 text-white p-3.5 rounded-xl border border-emerald-400 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-2xl text-emerald-200">celebration</span>
                <div className="text-left text-xs md:text-sm">
                  <p className="font-bold">🎉 Selamat! Anda telah menonton video sampai selesai.</p>
                  <p className="text-emerald-100">Materi ini telah otomatis dicentang tuntas dan progress belajar Anda bertambah.</p>
                </div>
              </div>
            )}

            {/* Title & Description Container */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-xl">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 mb-1">
                  Topik: {playingVideo.topic || 'Materi Belajar'}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white mb-1.5 leading-snug">{playingVideo.title}</h2>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{playingVideo.description}</p>
              </div>

              {/* Tombol Konfirmasi Manual jika platform selain YouTube/MP4 (misal TikTok/Instagram) */}
              {playingVideo.media_platform !== 'local_video' && !playingVideo.external_url?.includes('youtube.com') && !playingVideo.external_url?.includes('youtu.be') && (
                <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                  {modules.find(m => m.id === playingVideo.id)?.completed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/30">
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>Sudah Tuntas</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => markModuleCompleted(playingVideo)}
                      className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Saya Sudah Nonton Sampai Selesai</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Peringatan Jika Mengklik Centang Sebelum Nonton Video */}
      {watchNoticeModal.show && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">play_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tonton Video Terlebih Dahulu</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Untuk mencentang materi <span className="font-semibold text-primary dark:text-sky-400">"{watchNoticeModal.module?.title}"</span>, Anda harus menonton video pembelajarannya sampai selesai terlebih dahulu.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setWatchNoticeModal({ show: false, module: null })}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={() => {
                  const modToPlay = watchNoticeModal.module;
                  setWatchNoticeModal({ show: false, module: null });
                  handleMediaClick(modToPlay);
                }}
                className="bg-[#004A74] hover:bg-[#003857] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 hover:scale-105 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>Tonton Sekarang</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Rekapitulasi Hasil Belajar Peserta (Cetak / PDF) */}
      <TopicRecapModal
        isOpen={recapModal.show}
        onClose={() => setRecapModal(prev => ({ ...prev, show: false }))}
        topicName={recapModal.topicName}
        topicMeta={recapModal.topicMeta}
        modules={recapModal.modules}
        moduleQuizzes={moduleQuizzes}
        user={user}
      />
    </div>
  );
};

export default MemberDashboard;
