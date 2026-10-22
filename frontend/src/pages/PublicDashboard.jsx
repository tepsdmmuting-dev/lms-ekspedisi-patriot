import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const TOPICS_LIST = [
  {
    id: 'it',
    name: 'IT',
    subtitle: 'Teknologi & Digital',
    icon: 'devices',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    keywords: ['it', 'teknologi', 'teknologi informasi', 'digital', 'coding', 'komputer', 'tech'],
    desc: 'Pelajari dasar teknologi informasi, literasi digital, pengoperasian komputer, dan pemanfaatan teknologi modern untuk kemajuan daerah.'
  },
  {
    id: 'kewirausahaan',
    name: 'Kewirausahaan',
    subtitle: 'Bisnis & Usaha Mandiri',
    icon: 'storefront',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=800&auto=format&fit=crop',
    keywords: ['kewirausahaan', 'usaha', 'bisnis', 'umkm', 'wirausaha', 'entrepreneurship'],
    desc: 'Kiat membangun usaha mandiri, mengelola potensi ekonomi lokal, strategi pemasaran, dan manajemen penjualan hasil bumi.'
  },
  {
    id: 'kesehatan',
    name: 'Kesehatan',
    subtitle: 'Raga, Medis & Sanitasi',
    icon: 'health_and_safety',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
    keywords: ['kesehatan', 'medis', 'gizi', 'sanitasi', 'hidup sehat', 'health'],
    desc: 'Panduan pola hidup sehat, pertolongan pertama pada kecelakaan, pemenuhan gizi keluarga, dan sanitasi lingkungan masyarakat.'
  },
  {
    id: 'bhineka-tunggal-ika',
    name: 'Bhineka Tunggal Ika',
    subtitle: 'Persatuan & Budaya Bangsa',
    icon: 'diversity_3',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
    keywords: ['bhineka tunggal ika', 'bhineka', 'kebangsaan', 'budaya', 'toleransi', 'persatuan', 'sosiologi'],
    desc: 'Mempererat persaudaraan kebangsaan, merawat kearifan lokal, kerukunan hidup, dan semangat persatuan dari ufuk timur nusantara.'
  },
  {
    id: 'keuangan',
    name: 'Keuangan',
    subtitle: 'Finansial & Kelola Anggaran',
    icon: 'account_balance_wallet',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop',
    keywords: ['keuangan', 'finansial', 'finance', 'anggaran', 'tabungan', 'uang'],
    desc: 'Dasar pengelolaan keuangan pribadi & rumah tangga, pencatatan kas sederhana, menabung secara terencana, dan investasi bijak.'
  },
  {
    id: 'karir-masa-depan',
    name: 'Karir Masa Depan',
    subtitle: 'Peluang Kerja & Profesi',
    icon: 'rocket_launch',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    keywords: ['karir masa depan', 'karir', 'career', 'masa depan', 'profesi', 'kerja', 'kepemimpinan', 'leadership'],
    desc: 'Pengembangan potensi diri anak negeri, kesiapan memasuki dunia kerja profesional, dan pembentukan kepemimpinan masa depan.'
  }
];

const PublicDashboard = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [hoveredModuleId, setHoveredModuleId] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(15);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [previewIframeKey, setPreviewIframeKey] = useState(0);
  const [showAllMateri, setShowAllMateri] = useState(false);
  const [showAllPengumuman, setShowAllPengumuman] = useState(false);
  const [showAllKisah, setShowAllKisah] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});

  const getEmbedUrl = (url, isPreview = false) => {
    if (!url) return '';
    
    // YouTube Standard
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (ytMatch && ytMatch[1]) {
      const extra = isPreview ? '&start=0&end=15&controls=1&rel=0' : '';
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1${extra}`;
    }
    
    // YouTube Shorts
    const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (ytShortsMatch && ytShortsMatch[1]) {
      const extra = isPreview ? '&start=0&end=15&controls=1&rel=0' : '';
      return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1${extra}`;
    }
    
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

  const getModulesForTopic = (topic) => {
    if (!topic) return [];
    return allModules.filter(m => {
      // Kecualikan Kisah Inspiratif, Dokumen Resmi, dan Jadwal agar tidak tercampur ke kotak topik belajar
      if (m.category === 'Kisah Inspiratif' || m.category === 'Dokumen Resmi' || m.category === 'Jadwal') {
        return false;
      }
      const t = (m.topic || '').toLowerCase().trim();
      const c = (m.category || '').toLowerCase().trim();
      const title = (m.title || '').toLowerCase().trim();
      return topic.keywords.some(kw => 
        t === kw || c === kw || t.includes(kw) || c.includes(kw) || title.includes(kw)
      );
    });
  };

  const countModulesForTopic = (topic) => {
    return getModulesForTopic(topic).length;
  };

  const handleTopicClick = (topicId) => {
    if (selectedTopic === topicId) {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(topicId);
      setTimeout(() => {
        document.getElementById(`topic-card-${topicId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handlePreviewClick = (mod) => {
    setPreviewTimeLeft(15);
    setPreviewEnded(false);
    setPreviewIframeKey(Date.now());
    setPreviewModal(mod);
  };

  // Auto-close kartu topik saat klik di mana saja di luar kartu
  useEffect(() => {
    if (!selectedTopic) return;
    const handleClickOutside = (e) => {
      if (previewModal) return;
      const currentCard = document.getElementById(`topic-card-${selectedTopic}`);
      if (currentCard && currentCard.contains(e.target)) {
        return;
      }
      const otherCard = e.target.closest('[id^="topic-card-"]');
      if (otherCard) {
        return;
      }
      setSelectedTopic(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedTopic, previewModal]);

  useEffect(() => {
    if (!previewModal || previewEnded) return;
    const timer = setInterval(() => {
      setPreviewTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPreviewEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [previewModal, previewEnded, previewIframeKey]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch('/api/modules');
        if (res.ok) {
          const data = await res.json();
          setAllModules(data);
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

      {/* TopNavBar - Floating Glass Pill */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 flex justify-between items-center h-14 md:h-16 px-5 md:px-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-full border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500">
        <div className="flex items-center gap-gutter">
          <div className="flex items-center gap-3 md:gap-4">
            <img alt="Logo UGM" className="h-7 w-auto drop-shadow-sm dark:brightness-0 dark:invert transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkTLwI5PyjJ_qSLp20QPfwAedU9rwm7Zrs_IpuEJ-VfpxE3cKRXpMtcrtcHd04Q7yXjIEKv5XZ_l4v4e7aNrbs2NRf4C2SBiKylN5G7A_MFMXJc7umvcwOdbV6sSwdVBqEcN90C37s43LSfNdyfYJ_a_1mP4N55M5ZOJ5L55Ahkh_6HZO51GUnB2ZOeGFKSf06SBG1hsNTUOCc_EdOLZevdjsL0ilvAN8D45-ma9EghLfi9g5nOAkFqjLsRjPsTMPqhUvVH01hQjo" />
            <img alt="Logo Kementrian" className="h-7 w-auto drop-shadow-sm transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtJOaXHmbBoEsx_kvjzbBODYsUgAfDOOCJuJ-qbYSd8p1Y18kmkfMXCz8t7s6S9tlfu7OKVOXo_KNsAKK3Sh1_Af2Bs4q1F6yRw-FTX2j8fFC8nSTt9Qm7cCQJEqlwt9bjGQm2TITwNIHBzR4-G44UCp-0_csYhQFULCodO-iM1r0apaiFarIT_o0xzQ8F-Ex5ienUggc1LrdzHFfmUdi3M2FYLwoPzHRiLfATqJiidQJ-Yy95EhaYQdZy2y1RAU32wtHD8Rfyd14" />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-2 font-label-lg font-bold text-slate-700 dark:text-white">
          <button onClick={() => scrollToSection('dashboard')} className="px-4 py-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Dashboard</button>
          <button onClick={() => scrollToSection('materi-publik')} className="px-4 py-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Materi Publik</button>
          <button onClick={() => scrollToSection('pengumuman')} className="px-4 py-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Pengumuman & Dokumen</button>
          <button onClick={() => scrollToSection('kisah-inspiratif')} className="px-4 py-2 rounded-full hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Kisah Inspiratif</button>
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
        <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-6 px-4 flex flex-col gap-2 lg:hidden z-40 transition-colors duration-500 rounded-3xl">
          <button onClick={() => scrollToSection('dashboard')} className="text-left w-full px-4 py-3 rounded-2xl font-label-lg font-bold text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Dashboard</button>
          <button onClick={() => scrollToSection('materi-publik')} className="text-left w-full px-4 py-3 rounded-2xl font-label-lg font-bold text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Materi Publik</button>
          <button onClick={() => scrollToSection('pengumuman')} className="text-left w-full px-4 py-3 rounded-2xl font-label-lg font-bold text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Pengumuman & Dokumen</button>
          <button onClick={() => scrollToSection('kisah-inspiratif')} className="text-left w-full px-4 py-3 rounded-2xl font-label-lg font-bold text-slate-800 dark:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-sm hover:backdrop-blur-md transition-all duration-300">Kisah Inspiratif</button>
          <div className="px-4 py-2">
            <hr className="border-slate-200/50 dark:border-slate-700/50" />
          </div>
          <div className="px-2">
            <button
              onClick={() => navigate('/login')}
              className="bg-primary dark:bg-yellow-500 text-white dark:text-slate-800 px-6 py-3.5 rounded-2xl font-label-lg font-bold w-full shadow-md dark:hover:bg-yellow-400 transition-colors">
              Member Login
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full z-10">

        {/* Hero Section */}
        <section id="dashboard" className="relative min-h-[calc(100vh-6rem)] scroll-mt-24 mb-24 md:mb-32 flex flex-col md:flex-row items-center gap-12">
          {/* Aksen Batik Papua Halus */}
          <div className="absolute -top-10 -left-6 md:-left-12 w-20 md:w-28 pointer-events-none select-none opacity-[0.06] dark:opacity-[0.08] -rotate-12 transition-opacity z-0" aria-hidden="true">
            <img src="/batik-papua-motif.png" alt="" className="w-full h-auto drop-shadow-sm" />
          </div>
          <div className="md:w-1/2 space-y-8 relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 shadow-sm mb-2 transition-colors duration-500">
              <span className="text-sm font-bold tracking-widest text-primary dark:text-white uppercase">Kolaborasi UGM & Kementerian Transmigrasi</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-primary dark:text-white leading-tight drop-shadow-sm transition-colors duration-500 whitespace-pre-line">
              {siteSettings.hero_title || 'Ekspedisi Patriot\nSDM Unggul'}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed transition-colors duration-500 whitespace-pre-wrap">
              {siteSettings.hero_subtitle || 'Tong bersama membangun sumber daya manusia yang tangguh dan kompeten untuk masa depan Tanah Papua dan bangsa. Program pelatihan kitorang yang memadukan keunggulan akademik deng praktik langsung di lapangan.'}
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

        {/* Section: Mau Belajar Apa Hari Ini? (6 Materi Pilihan Beranda) */}
        <section id="pilihan-topik" className="relative mb-24 md:mb-32 scroll-mt-28">
          {/* Aksen Batik Papua Halus */}
          <div className="absolute -top-8 -right-4 md:-right-8 w-16 md:w-24 pointer-events-none select-none opacity-[0.05] dark:opacity-[0.08] rotate-12 transition-opacity z-0" aria-hidden="true">
            <img src="/batik-papua-motif.png" alt="" className="w-full h-auto drop-shadow-sm" />
          </div>
          <div className="mb-14 md:mb-20 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary dark:text-white transition-colors duration-500">
              Mau Belajar Apa Hari Ini?
            </h2>
          </div>

          {/* Grid 6 Materi Pilihan (Expandable Card & List Preview) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {TOPICS_LIST.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              const matchedModules = getModulesForTopic(topic);
              const matchedCount = matchedModules.length;

              if (isSelected) {
                return (
                  <div
                    key={topic.id}
                    id={`topic-card-${topic.id}`}
                    className="relative rounded-3xl overflow-hidden transition-all duration-500 flex flex-col border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_16px_45px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.4)] -translate-y-1"
                  >
                    {/* Header: Banner Background Foto Awal Topik dengan Warna Kisah Inspiratif */}
                    <div className="relative h-28 sm:h-32 m-3 mb-2 rounded-2xl overflow-hidden flex flex-col justify-between p-4 shadow-sm group">
                      {/* Foto Awal Topik */}
                      <div
                        className="absolute inset-0 bg-cover bg-center w-full h-full transition-all duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${topic.image}')` }}
                      ></div>

                      {/* Overlay Warna Kisah Inspiratif: Biru UGM di Light Mode (#004A74), Kuning Emas Lembut di Dark Mode (#D4B856) */}
                      <div className="absolute inset-0 bg-[#004A74]/85 dark:bg-[#D4B856]/90 transition-colors duration-500 z-10 pointer-events-none"></div>

                      {/* Baris Atas: Ikon Topik & Tombol Tutup */}
                      <div className="relative z-20 flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-slate-950/20 backdrop-blur-md flex items-center justify-center text-white dark:text-slate-950 border border-white/30 dark:border-slate-950/20 shadow-sm">
                          <span className="material-symbols-outlined text-xl">{topic.icon}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTopic(null);
                          }}
                          title="Tutup"
                          aria-label="Tutup"
                          className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white dark:bg-slate-950/20 dark:hover:bg-slate-950/35 dark:text-slate-950 flex items-center justify-center transition-all border border-white/20 dark:border-slate-950/20 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base leading-none">close</span>
                        </button>
                      </div>

                      {/* Judul Topik Saja */}
                      <div className="relative z-20 text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-white dark:text-slate-950 leading-tight drop-shadow-sm">
                          {topic.name}
                        </h3>
                      </div>
                    </div>

                    {/* Body: Daftar Materi (Foto Jadi Background Blur di Bawah Judul) */}
                    <div className="p-3 pt-1 flex flex-col gap-2.5 max-h-[340px] overflow-y-auto">
                      {matchedModules.length > 0 ? (
                        matchedModules.map((mod) => (
                          <div
                            key={mod.id}
                            onClick={() => handlePreviewClick(mod)}
                            className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#004A74] dark:hover:border-[#D4B856] shadow-sm transition-all duration-300 cursor-pointer group/item"
                          >
                            {/* Background Foto Blur jika ada gambar yang di-upload */}
                            {mod.image_url ? (
                              <>
                                <div
                                  className="absolute inset-0 bg-cover bg-center w-full h-full filter blur-[5px] scale-125 opacity-40 dark:opacity-30 group-hover/item:scale-135 transition-transform duration-500"
                                  style={{ backgroundImage: `url('${mod.image_url}')` }}
                                ></div>
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 group-hover/item:bg-[#004A74]/90 dark:group-hover/item:bg-[#D4B856]/90 transition-colors duration-200 z-10 pointer-events-none"></div>
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/80 group-hover/item:bg-[#004A74]/90 dark:group-hover/item:bg-[#D4B856]/90 transition-colors duration-200 z-10 pointer-events-none"></div>
                            )}

                            {/* Konten di atas Background Blur: Judul & Tombol Play */}
                            <div className="relative z-20 px-4 py-3 flex items-center justify-between gap-3 text-slate-800 dark:text-white group-hover/item:text-white dark:group-hover/item:text-slate-950 transition-colors duration-200">
                              <div className="flex items-center gap-3 min-w-0 flex-grow text-left">
                                <div className="w-8 h-8 rounded-full bg-[#004A74]/10 dark:bg-white/10 group-hover/item:bg-white/20 dark:group-hover/item:bg-slate-950/20 text-[#004A74] dark:text-[#D4B856] group-hover/item:text-white dark:group-hover/item:text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition-colors">
                                  <span className="material-symbols-outlined text-lg filled">play_arrow</span>
                                </div>
                                <span className="text-sm sm:text-base font-bold truncate">
                                  {mod.title}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1 text-xs font-bold opacity-75 group-hover/item:opacity-100 transition-opacity">
                                <span className="text-[11px]">15s</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center">
                          <span className="material-symbols-outlined text-2xl text-slate-400 dark:text-yellow-400 mb-1">pending</span>
                          <p className="text-xs font-bold text-slate-700 dark:text-white">Materi Segera Hadir</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Kartu saat Ter-expand */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTopic(null);
                        }}
                        className="hover:text-[#004A74] dark:hover:text-[#D4B856] flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        <span>Tutup</span>
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="text-[#004A74] dark:text-[#D4B856] hover:underline flex items-center gap-1"
                      >
                        <span>Materi Penuh</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Kartu Default (Belum Ter-expand)
              return (
                <div
                  key={topic.id}
                  id={`topic-card-${topic.id}`}
                  onClick={() => handleTopicClick(topic.id)}
                  className="relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 flex flex-col group aspect-[16/11] sm:aspect-[4/3] hover:-translate-y-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,74,116,0.3)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_45px_rgba(212,184,86,0.3)] border border-white/80 hover:border-[#004A74]/40 dark:border-white/10 dark:hover:border-[#D4B856]/50 bg-white dark:bg-slate-900"
                >
                  {/* Background Photo */}
                  <div
                    className="absolute inset-0 bg-cover bg-center w-full h-full group-hover:scale-110 transition-transform duration-700 z-0"
                    style={{ backgroundImage: `url('${topic.image}')` }}
                  ></div>

                  {/* Overlay: Default Putih (Light Mode) / Gelap (Dark Mode), Saat di-hover berubah sesuai warna Kisah Inspiratif */}
                  <div className="absolute inset-0 transition-all duration-500 z-10 pointer-events-none bg-white/85 dark:bg-slate-900/85 backdrop-blur-[2px] group-hover:bg-[#004A74]/90 dark:group-hover:bg-[#D4B856]/90"></div>

                  {/* Top-Left Frosted Glass Icon Badge */}
                  <div className="absolute top-4 left-4 md:top-5 md:left-5 z-20 w-12 h-12 md:w-14 md:h-14 bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-900 transition-all duration-500 shadow-md border border-white/60 dark:border-white/10">
                    <span className="material-symbols-outlined text-[#004A74] dark:text-yellow-400 group-hover:text-[#004A74] dark:group-hover:text-[#D4B856] text-2xl md:text-3xl transition-colors duration-500">
                      {topic.icon}
                    </span>
                  </div>

                  {/* Top-Right Pill: Jumlah Materi */}
                  <div className="absolute top-4 right-4 md:top-5 md:right-5 z-20 bg-white/80 dark:bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/10 shadow-sm">
                    {matchedCount > 0 ? `${matchedCount} Materi` : 'Segera Hadir'}
                  </div>

                  {/* Bottom Content Area */}
                  <div className="relative z-20 p-5 md:p-6 mt-auto flex flex-col justify-end text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-white/80 dark:group-hover:text-slate-800 transition-colors mb-1">
                      {topic.subtitle}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-primary dark:text-white group-hover:text-white dark:group-hover:text-slate-950 leading-tight mb-2 transition-colors duration-500 drop-shadow-sm">
                      {topic.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-white/90 dark:group-hover:text-slate-900 transition-colors">
                      <span>Buka Cuplikan</span>
                      <span className="inline-flex items-center gap-0.5 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Lihat</span>
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Media Showcase Grid */}
        <section id="materi-publik" className="relative py-16 md:py-24 mb-8 md:mb-12 scroll-mt-32">
          {/* Aksen Batik Papua Halus */}
          <div className="absolute top-12 -left-4 md:-left-10 w-16 md:w-22 pointer-events-none select-none opacity-[0.05] dark:opacity-[0.07] -rotate-6 transition-opacity z-0" aria-hidden="true">
            <img src="/batik-papua-motif.png" alt="" className="w-full h-auto drop-shadow-sm" />
          </div>
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
        <section id="kisah-inspiratif" className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-center py-16 md:py-24 mb-12 scroll-mt-24">
          {/* Aksen Batik Papua Halus */}
          <div className="absolute top-10 -right-4 md:-right-8 w-16 md:w-22 pointer-events-none select-none opacity-[0.05] dark:opacity-[0.08] rotate-6 transition-opacity z-0" aria-hidden="true">
            <img src="/batik-papua-unit.png" alt="" className="w-full h-auto drop-shadow-sm" />
          </div>
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
      <footer className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl w-full py-6 md:py-8 px-margin-mobile md:px-margin-desktop relative z-10 border-t border-white/60 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] transition-colors duration-500">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-8 relative">
          
          {/* Bagian Kiri: Glassmorphism Card & Deskripsi */}
          <div className="flex flex-col gap-5 max-w-lg">
            <div className="text-slate-800 dark:text-white/80 font-bold tracking-[0.2em] text-xs uppercase">Kolaborasi Strategis</div>
            
            {/* Kotak Liquid Glass Sebenarnya */}
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-full px-5 py-3 md:px-8 md:py-3.5 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 border border-white/60 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-colors duration-500 w-fit">
              <img alt="Logo UGM" className="h-8 md:h-9 w-auto drop-shadow-sm dark:brightness-0 dark:invert transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkTLwI5PyjJ_qSLp20QPfwAedU9rwm7Zrs_IpuEJ-VfpxE3cKRXpMtcrtcHd04Q7yXjIEKv5XZ_l4v4e7aNrbs2NRf4C2SBiKylN5G7A_MFMXJc7umvcwOdbV6sSwdVBqEcN90C37s43LSfNdyfYJ_a_1mP4N55M5ZOJ5L55Ahkh_6HZO51GUnB2ZOeGFKSf06SBG1hsNTUOCc_EdOLZevdjsL0ilvAN8D45-ma9EghLfi9g5nOAkFqjLsRjPsTMPqhUvVH01hQjo" />
              <div className="w-px h-8 md:h-10 bg-slate-300 dark:bg-white/30 transition-colors duration-500"></div>
              <img alt="Logo Kementrian" className="h-8 md:h-9 w-auto drop-shadow-sm transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtJOaXHmbBoEsx_kvjzbBODYsUgAfDOOCJuJ-qbYSd8p1Y18kmkfMXCz8t7s6S9tlfu7OKVOXo_KNsAKK3Sh1_Af2Bs4q1F6yRw-FTX2j8fFC8nSTt9Qm7cCQJEqlwt9bjGQm2TITwNIHBzR4-G44UCp-0_csYhQFULCodO-iM1r0apaiFarIT_o0xzQ8F-Ex5ienUggc1LrdzHFfmUdi3M2FYLwoPzHRiLfATqJiidQJ-Yy95EhaYQdZy2y1RAU32wtHD8Rfyd14" />
            </div>

            <p className="text-slate-700 dark:text-white/80 text-sm leading-relaxed mt-2 transition-colors duration-500">
              Sinergi Universitas Gadjah Mada & Kementerian Transmigrasi RI untuk Peningkatan Kapasitas SDM.
            </p>
          </div>

          {/* Bagian Kanan: Link & Copyright */}
          <div className="flex flex-col items-start lg:items-end lg:justify-start h-full gap-8 lg:gap-0 flex-1 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 text-left lg:text-right w-full lg:w-auto border-t border-slate-200 dark:border-white/10 lg:border-none pt-8 lg:pt-0 transition-colors duration-500">
              <button onClick={() => scrollToSection('dashboard')} className="text-slate-700 hover:text-primary dark:text-white/80 dark:hover:text-white text-sm font-bold transition-colors text-left sm:text-center">Dashboard</button>
              <button onClick={() => scrollToSection('materi-publik')} className="text-slate-700 hover:text-primary dark:text-white/80 dark:hover:text-white text-sm font-bold transition-colors text-left sm:text-center">Materi Publik</button>
              <button onClick={() => scrollToSection('pengumuman')} className="text-slate-700 hover:text-primary dark:text-white/80 dark:hover:text-white text-sm font-bold transition-colors text-left sm:text-center">Pengumuman & Dokumen</button>
              <button onClick={() => scrollToSection('kisah-inspiratif')} className="text-slate-700 hover:text-primary dark:text-white/80 dark:hover:text-white text-sm font-bold transition-colors text-left sm:text-center">Kisah Inspiratif</button>
            </div>
            
            <div className="lg:absolute lg:bottom-0 lg:right-0 text-slate-500 dark:text-white/50 text-sm font-bold mt-8 lg:mt-0 w-full text-left lg:text-right transition-colors duration-500">
              © Tim Ekspedisi Patriot UGM 2026
            </div>
          </div>
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

      {previewModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 transition-all overflow-y-auto">
          <div className="w-full max-w-4xl flex flex-col gap-3 relative my-auto">
            {/* Top Preview Banner with Countdown Bar (Tema Biru UGM #004A74) */}
            <div className="bg-[#004A74] text-white rounded-2xl overflow-hidden shadow-xl border border-sky-400/30">
              <div className="px-5 py-2.5 flex items-center justify-between font-bold text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-sky-300">timer</span>
                  <span>
                    {previewEnded
                      ? '⏱️ Cuplikan Selesai (Batas 15 Detik)'
                      : `⏱️ Cuplikan Preview: Sisa ${previewTimeLeft} detik • Maksimal 15 detik`}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewModal(null)}
                  title="Tutup"
                  className="w-7 h-7 bg-white/15 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              {/* Animated Progress Bar */}
              <div className="w-full bg-black/25 h-1">
                <div
                  className="bg-sky-400 h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  style={{ width: `${(previewTimeLeft / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 aspect-video relative">
              <iframe
                key={previewIframeKey}
                src={getEmbedUrl(previewModal.external_url, true)}
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
              ></iframe>

              {/* 15-Second Limit Overlay when time is up */}
              {previewEnded && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-[#004A74]/30 text-sky-400 flex items-center justify-center mb-4 shadow-lg border border-sky-400/30">
                    <span className="material-symbols-outlined text-4xl">timer</span>
                  </div>
                  <span className="bg-[#004A74] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 shadow border border-sky-400/30">
                    Cuplikan 15 Detik Selesai
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Ingin Nonton Video Lengkap?</h3>
                  <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
                    Ini adalah batas cuplikan preview gratis (maksimal 15 detik). Masuk ke akun peserta untuk menonton video secara penuh, materi unduhan, dan latihan kuis.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setPreviewTimeLeft(15);
                        setPreviewEnded(false);
                        setPreviewIframeKey(Date.now());
                      }}
                      className="px-5 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 text-xs sm:text-sm transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      <span>Ulangi Cuplikan (15 Detik)</span>
                    </button>
                    <button
                      onClick={() => {
                        setPreviewModal(null);
                        navigate('/login');
                      }}
                      className="bg-[#004A74] hover:bg-[#003857] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all border border-sky-400/40 flex items-center gap-1.5 hover:scale-105"
                    >
                      <span>Masuk untuk Nonton Lengkap</span>
                      <span className="material-symbols-outlined text-base">login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details & Action Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
              <div className="max-w-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 dark:text-sky-300 mb-1 inline-block">
                  Topik: {previewModal.topic || previewModal.category || 'Materi Pembelajaran'}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1.5 leading-snug">{previewModal.title}</h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-2">{previewModal.description}</p>
              </div>
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                <button
                  onClick={() => setPreviewModal(null)}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs md:text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setPreviewModal(null);
                    navigate('/login');
                  }}
                  className="flex-1 md:flex-initial bg-[#004A74] hover:bg-[#003857] text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg border border-sky-400/30 flex items-center justify-center gap-1.5 hover:scale-105"
                >
                  <span>Materi Penuh</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PublicDashboard;
