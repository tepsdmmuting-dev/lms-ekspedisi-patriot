import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const PublicDashboard = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [showAllMateri, setShowAllMateri] = useState(false);
  const [showAllPengumuman, setShowAllPengumuman] = useState(false);
  const [showAllKisah, setShowAllKisah] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube Standard
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    
    // YouTube Shorts
    const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (ytShortsMatch && ytShortsMatch[1]) return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1`;
    
    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/.*?\/video\/(\d+)/);
    if (tiktokMatch && tiktokMatch[1]) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;

    // Instagram (Post, Reel, TV)
    const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    if (igMatch && igMatch[1]) return `https://www.instagram.com/p/${igMatch[1]}/embed/`;

    // Spotify (Track, Playlist, Episode, Album)
    const spotifyMatch = url.match(/open\.spotify\.com\/(track|playlist|episode|album)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;

    // Google Drive PDF/Docs
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

    return url;
  };

  const isEmbeddable = (url) => {
    if (!url) return false;
    return !!(
      url.match(/(?:youtu\.be\/|youtube\.com\/)/) ||
      url.match(/tiktok\.com\/.*?\/video\/\d+/) ||
      url.match(/instagram\.com\/(?:p|reel|tv)\//) ||
      url.match(/open\.spotify\.com\/(track|playlist|episode|album)\//) ||
      url.match(/drive\.google\.com\/file\/d\//)
    );
  };

  const handleMediaClick = (mod) => {
    if (isEmbeddable(mod.external_url)) {
      setPlayingVideo(mod);
    } else {
      window.open(mod.external_url, '_blank');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch('/api/modules');
        if (res.ok) {
          const data = await res.json();
          setModules(data.filter(m => m.visibility === 'public'));
        }
      } catch (err) {
        console.error("Failed to fetch public modules", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) setSiteSettings(await res.json());
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    fetchModules();
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  const getMediaIcon = (platform) => {
    switch (platform) {
      case 'youtube': return 'smart_display';
      case 'tiktok': return 'movie';
      case 'instagram': return 'video_library';
      case 'gdrive_pdf': return 'picture_as_pdf';
      default: return 'play_circle';
    }
  };

  const materiPublik = modules.filter(m => m.category === 'Materi Publik' || m.category === 'Pelatihan');
  const kisahInspiratif = modules.filter(m => m.category === 'Kisah Inspiratif');
  const pengumuman = modules.filter(m => m.category === 'Jadwal' || m.category === 'Dokumen Resmi');

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-800 transition-colors duration-500 font-body-md text-on-surface dark:text-slate-300 min-h-screen flex flex-col relative overflow-hidden z-0">

      {/* Global Glassmorphism Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Light Mode Orbs */}
        <div className="dark:hidden absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(0,74,116,0.15) 0%, rgba(0,74,116,0) 100%)' }}></div>
        <div className="dark:hidden absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(244,199,36,0.15) 0%, rgba(244,199,36,0) 100%)' }}></div>
        <div className="dark:hidden absolute top-[30%] left-[50%] w-[50%] h-[50%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0) 100%)' }}></div>
        {/* Dark Mode Orbs */}
        <div className="hidden dark:block absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0) 100%)' }}></div>
        <div className="hidden dark:block absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}></div>
        <div className="hidden dark:block absolute top-[30%] left-[50%] w-[50%] h-[50%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(250,204,21,0.05) 0%, rgba(250,204,21,0) 100%)' }}></div>
      </div>

      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-white/60 dark:border-white/10 shadow-sm transition-colors duration-500">
        <div className="flex items-center gap-gutter">
          <div className="flex items-center gap-4">
            <img alt="Logo UGM" className="h-8 w-auto drop-shadow-sm dark:brightness-0 dark:invert transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkTLwI5PyjJ_qSLp20QPfwAedU9rwm7Zrs_IpuEJ-VfpxE3cKRXpMtcrtcHd04Q7yXjIEKv5XZ_l4v4e7aNrbs2NRf4C2SBiKylN5G7A_MFMXJc7umvcwOdbV6sSwdVBqEcN90C37s43LSfNdyfYJ_a_1mP4N55M5ZOJ5L55Ahkh_6HZO51GUnB2ZOeGFKSf06SBG1hsNTUOCc_EdOLZevdjsL0ilvAN8D45-ma9EghLfi9g5nOAkFqjLsRjPsTMPqhUvVH01hQjo" />
            <img alt="Logo Kementrian" className="h-8 w-auto drop-shadow-sm transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtJOaXHmbBoEsx_kvjzbBODYsUgAfDOOCJuJ-qbYSd8p1Y18kmkfMXCz8t7s6S9tlfu7OKVOXo_KNsAKK3Sh1_Af2Bs4q1F6yRw-FTX2j8fFC8nSTt9Qm7cCQJEqlwt9bjGQm2TITwNIHBzR4-G44UCp-0_csYhQFULCodO-iM1r0apaiFarIT_o0xzQ8F-Ex5ienUggc1LrdzHFfmUdi3M2FYLwoPzHRiLfATqJiidQJ-Yy95EhaYQdZy2y1RAU32wtHD8Rfyd14" />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 font-label-lg font-bold text-slate-700 dark:text-white">
          <button onClick={() => scrollToSection('materi-publik')} className="hover:text-primary dark:hover:text-slate-300 transition-colors">Materi Publik</button>
          <button onClick={() => scrollToSection('pengumuman')} className="hover:text-primary dark:hover:text-slate-300 transition-colors">Pengumuman & Dokumen</button>
          <button onClick={() => scrollToSection('kisah-inspiratif')} className="hover:text-primary dark:hover:text-slate-300 transition-colors">Kisah Inspiratif</button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => navigate('/login')}
            className="bg-primary/90 dark:bg-yellow-500 backdrop-blur-md text-white dark:text-slate-800 px-6 py-2 rounded-full font-label-lg font-bold hover:bg-primary dark:hover:bg-yellow-400 hover:shadow-lg transition-all hidden md:block border border-white/20 dark:border-yellow-500/50">
            Member Login
          </button>
          <div className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className="material-symbols-outlined text-primary dark:text-white cursor-pointer select-none text-3xl transition-colors duration-500">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </div>
        </div>

      </nav>

      {/* Mobile Dropdown Menu (Moved outside nav to fix nested backdrop-blur bug) */}
      {isMenuOpen && (
        <div className="fixed top-16 left-0 w-full bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-white/60 dark:border-white/10 shadow-xl py-6 px-6 flex flex-col gap-6 lg:hidden z-40 transition-colors duration-500 rounded-b-3xl">
          <button onClick={() => scrollToSection('materi-publik')} className="text-left font-label-lg font-bold text-slate-800 dark:text-white hover:text-primary dark:hover:text-slate-300">Materi Publik</button>
          <button onClick={() => scrollToSection('pengumuman')} className="text-left font-label-lg font-bold text-slate-800 dark:text-white hover:text-primary dark:hover:text-slate-300">Pengumuman & Dokumen</button>
          <button onClick={() => scrollToSection('kisah-inspiratif')} className="text-left font-label-lg font-bold text-slate-800 dark:text-white hover:text-primary dark:hover:text-slate-300">Kisah Inspiratif</button>
          <hr className="border-slate-200/50 dark:border-slate-700/50" />
          <button
            onClick={() => navigate('/login')}
            className="bg-primary dark:bg-yellow-500 text-white dark:text-slate-800 px-6 py-3 rounded-2xl font-label-lg font-bold w-full shadow-md dark:hover:bg-yellow-400 transition-colors">
            Member Login
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full z-10">

        {/* Hero Section */}
        <section className="mb-24 md:mb-32 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-8 relative">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 shadow-sm mb-2 transition-colors duration-500">
              <span className="text-sm font-bold tracking-widest text-primary dark:text-white uppercase">Kolaborasi UGM & Kementerian Transmigrasi</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-primary dark:text-white leading-tight drop-shadow-sm transition-colors duration-500 whitespace-pre-line">
              {siteSettings.hero_title || 'Ekspedisi Patriot\nSDM Unggul'}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed transition-colors duration-500 whitespace-pre-wrap">
              {siteSettings.hero_subtitle || 'Membangun sumber daya manusia yang tangguh dan kompeten untuk masa depan bangsa. Program pelatihan yang memadukan keunggulan akademik dengan praktik lapangan.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-primary text-white dark:bg-yellow-500 dark:text-slate-800 px-8 py-4 rounded-2xl font-label-lg text-lg font-bold hover:shadow-[0_10px_30px_rgba(0,74,116,0.3)] dark:hover:shadow-[0_10px_30px_rgba(250,204,21,0.3)] hover:-translate-y-1 dark:hover:bg-yellow-400 transition-all duration-300">
                Mulai Belajar
              </button>
              <button className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-transparent text-primary dark:text-white px-8 py-4 rounded-2xl font-label-lg text-lg font-bold hover:bg-white/80 dark:hover:bg-white/20 hover:shadow-lg transition-all duration-300">
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

          <div className="md:w-1/2 w-full mt-12 md:mt-0 relative h-[450px] lg:h-[550px] rounded-[2rem] overflow-hidden group transition-colors duration-500 [mask-image:linear-gradient(to_bottom,transparent_0%,black_70%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_70%)] md:[mask-image:linear-gradient(to_right,transparent_0%,black_70%)] md:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_70%)]">
            <div className="absolute inset-0 bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-all duration-700 dark:brightness-[0.6]" style={{ backgroundImage: `url('${siteSettings.hero_image_url || 'https://res.cloudinary.com/jneu85aj/image/upload/v1783995884/_2926_Hampir-40-Ribu-Anak-di-Papua-Selatan-Tak-Sekolah--Gubernur-Apolo--Ancaman-Serius-bagi-Masa-Depan.png-2_i7rorg.jpg'}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-20"></div>
          </div>
        </section>

        {/* Media Showcase Grid */}
        <section id="materi-publik" className="relative py-16 md:py-24 mb-8 md:mb-12 scroll-mt-32">
          {/* Full-width soft gradient background */}
          <div className="absolute -top-16 md:-top-24 -bottom-16 md:-bottom-24 w-[100vw] left-1/2 -translate-x-1/2 flex flex-col -z-10 pointer-events-none">
            <div className="h-24 md:h-32 bg-gradient-to-b from-[#FBBF24]/0 dark:from-slate-700/0 to-[#FBBF24]/[0.15] dark:to-slate-700/60 transition-colors duration-500"></div>
            <div className="flex-grow bg-[#FBBF24]/[0.15] dark:bg-slate-700/60 transition-colors duration-500"></div>
            <div className="h-24 md:h-32 bg-gradient-to-t from-[#FBBF24]/0 dark:from-slate-700/0 to-[#FBBF24]/[0.15] dark:to-slate-700/60 transition-colors duration-500"></div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary dark:text-white mb-3 transition-colors duration-500">Materi Publik</h2>
              <p className="text-lg text-primary/80 dark:text-slate-400 transition-colors duration-500">Akses materi pembelajaran terbuka dari para ahli.</p>
            </div>
            {materiPublik.length > 3 && (
              <button
                onClick={() => setShowAllMateri(!showAllMateri)}
                className="flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 px-5 py-2.5 rounded-full text-primary dark:text-white font-bold hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all cursor-pointer">
                {showAllMateri ? 'Lebih Sedikit' : 'Lihat Semua'} <span className="material-symbols-outlined text-sm">{showAllMateri ? 'arrow_upward' : 'arrow_forward'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(showAllMateri ? materiPublik : materiPublik.slice(0, 3)).map(mod => (
              <div key={mod.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)] transition-all duration-500 flex flex-col group cursor-pointer" onClick={() => handleMediaClick(mod)}>
                <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {mod.image_url && (
                    <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-700 z-0" style={{ backgroundImage: `url('${mod.image_url}')` }}></div>
                  )}
                  {mod.image_source && (
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white/80 z-20 pointer-events-none shadow-sm">
                      Sumber: {mod.image_source}
                    </div>
                  )}
                  <span className={`material-symbols-outlined text-6xl z-10 opacity-50 drop-shadow-md ${mod.media_platform === 'gdrive_pdf' ? 'text-red-500' : (mod.image_url ? 'text-white' : 'text-slate-400 dark:text-white')}`}>
                    {getMediaIcon(mod.media_platform)}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm z-20">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <span className="material-symbols-outlined text-primary filled text-3xl">open_in_new</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <span className="bg-secondary/10 text-secondary dark:bg-yellow-400/20 dark:text-yellow-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{mod.media_platform.replace('_', ' ')}</span>
                  </div>
                  <h3 title={mod.title} className="text-lg md:text-xl font-bold text-primary dark:text-white mb-2 md:mb-3 line-clamp-2 leading-snug group-hover:text-[#003857] dark:group-hover:text-blue-400 transition-colors">{mod.title}</h3>
                  <p title={mod.description} className="text-sm md:text-base text-slate-500 dark:text-slate-400 line-clamp-3 mt-auto leading-relaxed">{mod.description}</p>
                </div>
              </div>
            ))}
            {materiPublik.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-white dark:border-white/10 transition-colors duration-500">Belum ada materi publik yang tersedia.</div>
            )}
          </div>
        </section>

        {/* Pengumuman & Dokumen Section */}
        {pengumuman.length > 0 && (
          <section id="pengumuman" className="relative py-16 md:py-24 mb-8 md:mb-12 scroll-mt-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary dark:text-white mb-3 transition-colors duration-500">Pengumuman & Dokumen</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 transition-colors duration-500">Jadwal kegiatan dan dokumen resmi.</p>
              </div>
              {pengumuman.length > 3 && (
                <button
                  onClick={() => setShowAllPengumuman(!showAllPengumuman)}
                  className="flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 px-5 py-2.5 rounded-full text-primary dark:text-white font-bold hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all cursor-pointer">
                  {showAllPengumuman ? 'Lebih Sedikit' : 'Lihat Semua'} <span className="material-symbols-outlined text-sm">{showAllPengumuman ? 'arrow_upward' : 'arrow_forward'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(showAllPengumuman ? pengumuman : pengumuman.slice(0, 3)).map(mod => (
                <div key={mod.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)] transition-all duration-500 flex flex-col group cursor-pointer" onClick={() => handleMediaClick(mod)}>
                  <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-500">
                    {mod.image_url && (
                      <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-700 z-0" style={{ backgroundImage: `url('${mod.image_url}')` }}></div>
                    )}
                    {mod.image_source && (
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white/80 z-20 pointer-events-none shadow-sm">
                        Sumber: {mod.image_source}
                      </div>
                    )}
                    <span className={`material-symbols-outlined text-5xl z-10 opacity-50 drop-shadow-md ${mod.media_platform === 'gdrive_pdf' ? 'text-red-500' : (mod.image_url ? 'text-white' : 'text-slate-400 dark:text-white')}`}>
                      {getMediaIcon(mod.media_platform)}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm z-20">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <span className="material-symbols-outlined text-primary filled text-2xl">open_in_new</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <span className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">{mod.category}</span>
                    </div>
                    <h3 title={mod.title} className="text-lg md:text-xl font-bold text-primary dark:text-white mb-2 md:mb-3 line-clamp-2 leading-snug group-hover:text-[#003857] dark:group-hover:text-blue-400 transition-colors">{mod.title}</h3>
                    <p title={mod.description} className="text-sm md:text-base text-slate-500 dark:text-slate-400 line-clamp-3 mt-auto leading-relaxed">{mod.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Kisah Inspiratif Section */}
        <section id="kisah-inspiratif" className="relative py-16 md:py-24 mb-12 scroll-mt-32">
          {/* Full-width soft gradient background */}
          <div className="absolute -top-16 md:-top-24 -bottom-16 md:-bottom-24 w-[100vw] left-1/2 -translate-x-1/2 flex flex-col -z-10 pointer-events-none">
            <div className="h-24 md:h-32 bg-gradient-to-b from-[#FBBF24]/0 dark:from-slate-700/0 to-[#FBBF24]/[0.15] dark:to-slate-700/60 transition-colors duration-500"></div>
            <div className="flex-grow bg-[#FBBF24]/[0.15] dark:bg-slate-700/60 transition-colors duration-500"></div>
            <div className="h-24 md:h-32 bg-gradient-to-t from-[#FBBF24]/0 dark:from-slate-700/0 to-[#FBBF24]/[0.15] dark:to-slate-700/60 transition-colors duration-500"></div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary dark:text-white mb-3 transition-colors duration-500">Kisah Inspiratif</h2>
              <p className="text-lg text-primary/80 dark:text-slate-400 transition-colors duration-500">Inspirasi dari warga, untuk warga.</p>
            </div>
            {kisahInspiratif.length > 4 && (
              <button
                onClick={() => setShowAllKisah(!showAllKisah)}
                className="flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 px-5 py-2.5 rounded-full text-primary dark:text-white font-bold hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all cursor-pointer">
                {showAllKisah ? 'Lebih Sedikit' : 'Lihat Semua'} <span className="material-symbols-outlined text-sm">{showAllKisah ? 'arrow_upward' : 'arrow_forward'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {(showAllKisah ? kisahInspiratif : kisahInspiratif.slice(0, 4)).map(mod => (
              <div key={mod.id} className="relative bg-white dark:bg-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45)] dark:shadow-[0_10px_40px_rgba(255,255,255,0.03)] dark:hover:shadow-[0_20px_60px_rgba(255,255,255,0.08)] rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-500 flex flex-col group cursor-pointer aspect-[4/3] md:aspect-square" onClick={() => handleMediaClick(mod)}>
                <div className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-110 transition-transform duration-700 z-0" style={{ backgroundImage: `url('${mod.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop'}')` }}></div>
                {mod.image_source && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white/80 z-20 pointer-events-none shadow-sm">
                    Sumber: {mod.image_source}
                  </div>
                )}
                
                {/* Light Wash Overlay (Not Blur) -> Turns Blue (Light Mode) or Soft Yellow (Dark Mode) on Hover */}
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 dark:backdrop-blur-[2px] group-hover:bg-[#004A74]/90 dark:group-hover:bg-[#D4B856]/90 transition-all duration-500 z-10 pointer-events-none"></div>
                
                {/* Top-left Play Button (Frosted Glass) */}
                <div className="absolute top-4 left-4 md:top-5 md:left-5 z-40 w-12 h-12 md:w-14 md:h-14 bg-white/40 dark:bg-white/20 backdrop-blur-xl backdrop-saturate-150 rounded-2xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white transition-all duration-500 shadow-xl dark:shadow-none pointer-events-auto">
                  <span className="material-symbols-outlined text-[#004A74] dark:text-yellow-400 group-hover:text-[#004A74] dark:group-hover:text-slate-900 text-2xl md:text-3xl filled transition-colors duration-500">play_arrow</span>
                </div>

                <div className="relative z-30 p-5 md:p-6 flex flex-col h-full justify-end">
                  <h3 title={mod.title} className="text-lg md:text-xl font-bold text-[#004A74] dark:text-yellow-400 group-hover:text-white dark:group-hover:text-slate-900 mb-2 md:mb-3 line-clamp-2 leading-snug transition-colors duration-500">{mod.title}</h3>
                  <p title={mod.description} className="text-sm md:text-base text-slate-700 dark:text-slate-300 group-hover:text-white/90 dark:group-hover:text-slate-800 line-clamp-2 h-[42px] md:h-12 leading-normal transition-colors duration-500">{mod.description}</p>
                </div>
              </div>
            ))}
            {kisahInspiratif.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-white dark:border-white/10 transition-colors duration-500">Belum ada kisah inspiratif yang tersedia.</div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#004A74] dark:bg-slate-900/40 dark:backdrop-blur-xl w-full py-16 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-10 relative z-10 border-t border-[#004A74] dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-500">
        <div className="text-2xl font-bold text-white mb-2 md:mb-0 drop-shadow-sm tracking-tight">
          Ekspedisi Patriot
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <a className="text-white/80 text-sm font-bold hover:text-white transition-colors" href="#">Kontak Kami</a>
          <a className="text-white/80 text-sm font-bold hover:text-white transition-colors" href="#">Syarat &amp; Ketentuan</a>
          <a className="text-white/80 text-sm font-bold hover:text-white transition-colors" href="#">Kebijakan Privasi</a>
        </div>
        <div className="text-white/50 text-sm font-bold mt-4 md:mt-0 text-center md:text-right">
          © 2026 Ekspedisi Patriot x UGM
        </div>
      </footer>

      {playingVideo && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 transition-all overflow-y-auto">
          <div className="w-full max-w-4xl flex flex-col gap-4 relative my-auto">
            {/* Close Button */}
            <div className="flex justify-end">
              <button onClick={() => setPlayingVideo(null)} className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-red-500 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg border border-white/20 hover:border-red-500 hover:scale-110 mb-2 md:mb-0 md:absolute md:-top-16 md:-right-2">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Video Player */}
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 aspect-video relative">
              <iframe
                src={getEmbedUrl(playingVideo.external_url)}
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
              ></iframe>
            </div>

            {/* Title & Description Container */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl text-left">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-snug">{playingVideo.title}</h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-wrap">{playingVideo.description}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PublicDashboard;
