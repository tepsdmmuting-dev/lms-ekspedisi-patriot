import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import UserManagement from '../components/UserManagement';
import QuizBuilder from '../components/QuizBuilder';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import CloudinaryUpload from '../components/CloudinaryUpload';
import SiteSettings from '../components/SiteSettings';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { TOPICS_LIST } from '../constants/topics';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalActiveLinks: 0, retentionRate: 0, regions: [] });
  const DEFAULT_TOPICS = [
    'IT',
    'Kewirausahaan',
    'Kesehatan',
    'Bhineka Tunggal Ika',
    'Keuangan',
    'Karir Masa Depan'
  ];
  const [modules, setModules] = useState([]);
  const [allTopics, setAllTopics] = useState(DEFAULT_TOPICS);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizModule, setQuizModule] = useState(null);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('curriculum'); // 'curriculum' or 'table'
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', media_platform: 'youtube', external_url: '', category: 'Pelatihan', topic: 'IT', module_name: 'Modul 1', order_index: 1, visibility: 'restricted', image_url: '', image_source: ''
  });

  // Local Video & PDF Upload & Storage state (Offline Support)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [localVideosList, setLocalVideosList] = useState([]);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [localDocsList, setLocalDocsList] = useState([]);

  // Tahap 2: Flashdisk Export & Import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingGrades, setIsExportingGrades] = useState(false);

  // Rename module group state
  const [renameModal, setRenameModal] = useState({ show: false, topic: '', oldName: '', newName: '' });
  const [isRenaming, setIsRenaming] = useState(false);

  // Admin Change Password Modal
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);

  const handleSaveRenameModule = async () => {
    if (!renameModal.newName || !renameModal.newName.trim()) return;
    try {
      setIsRenaming(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/modules/rename-group', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: renameModal.topic,
          oldModuleName: renameModal.oldName,
          newModuleName: renameModal.newName.trim()
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || 'Gagal mengubah judul modul');
      }
      setRenameModal({ show: false, topic: '', oldName: '', newName: '' });
      fetchModules();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengubah judul modul');
    } finally {
      setIsRenaming(false);
    }
  };

  const fetchLocalVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocalVideosList(data);
      }
    } catch (err) {
      console.error('Failed to fetch local videos', err);
    }
  };

  const fetchLocalDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocalDocsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch local documents', err);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    const uploadData = new FormData();
    uploadData.append('video', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          media_platform: 'local_video',
          external_url: data.url,
          title: prev.title ? prev.title : file.name.replace(/\.[^/.]+$/, "")
        }));
        fetchLocalVideos();
      } else {
        alert(data.msg || 'Gagal mengunggah video');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan saat mengunggah video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    const uploadData = new FormData();
    uploadData.append('pdf', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          media_platform: 'local_pdf',
          external_url: data.url,
          title: prev.title ? prev.title : file.name.replace(/\.[^/.]+$/, "")
        }));
        fetchLocalDocs();
      } else {
        alert(data.msg || 'Gagal mengunggah dokumen PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan saat mengunggah dokumen PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleExportCurriculum = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/curriculum/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengekspor kurikulum.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lms_patriot_curriculum_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengekspor kurikulum.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportCurriculum = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Apakah Anda yakin ingin mengimpor kurikulum dari file "${file.name}"? Data modul dan kuis di server lokal akan disinkronkan.`)) {
      e.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (pErr) {
        throw new Error('File tidak berformat JSON yang valid.');
      }

      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/curriculum/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.msg}\nBerhasil memproses ${data.importedModulesCount} modul dan ${data.importedQuizzesCount} kuis.`);
        fetchModules();
      } else {
        alert(data.msg || 'Gagal mengimpor kurikulum.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal memproses file kurikulum.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleExportGrades = async () => {
    try {
      setIsExportingGrades(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/grades/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const text = await res.text();
      let data = [];
      try {
        data = JSON.parse(text);
      } catch (pErr) {}

      if (!res.ok) {
        throw new Error(data?.msg || 'Gagal mengekspor data nilai siswa dari server.');
      }

      if (Array.isArray(data) && data.length === 0) {
        alert('ℹ️ Belum ada catatan nilai siswa yang mengerjakan kuis di database saat ini.');
        return;
      }

      const blob = new Blob([text], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap_nilai_siswa_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert(`✅ Berhasil mengekspor ${data.length} catatan pengerjaan kuis siswa.`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengekspor rekap nilai siswa.');
    } finally {
      setIsExportingGrades(false);
    }
  };

  const getUrlPlaceholder = (platform) => {
    switch (platform) {
      case 'youtube':
        return 'https://www.youtube.com/watch?v=... atau https://youtu.be/...';
      case 'tiktok':
        return 'https://www.tiktok.com/@username/video/...';
      case 'instagram':
        return 'https://www.instagram.com/reel/... atau https://www.instagram.com/p/...';
      case 'gdrive_pdf':
        return 'https://drive.google.com/file/d/.../view';
      default:
        return 'https://...';
    }
  };

  const getUrlLabel = (platform) => {
    switch (platform) {
      case 'youtube':
        return 'URL Video YouTube';
      case 'tiktok':
        return 'URL Video TikTok';
      case 'instagram':
        return 'URL Post / Reel Instagram';
      case 'gdrive_pdf':
        return 'URL Dokumen Google Drive (PDF)';
      default:
        return 'URL Materi (Link Video / Dokumen)';
    }
  };

  // Drag-and-drop & Reordering state for curriculum items
  const [draggedItem, setDraggedItem] = useState(null); // { modName, index }
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleReorderItems = async (modName, newItems) => {
    const updates = newItems.map((item, idx) => ({
      id: item.id,
      item_type: item.itemType,
      is_quiz: item.itemType === 'quiz',
      order_index: idx + 1,
      module_name: modName
    }));

    // Optimistic local update
    setModules(prev => prev.map(m => {
      const up = updates.find(u => !u.is_quiz && u.id === m.id);
      let updatedQuizzes = m.quizzes;
      if (m.quizzes && m.quizzes.length > 0) {
        updatedQuizzes = m.quizzes.map(q => {
          const qu = updates.find(u => u.is_quiz && u.id === q.id);
          return qu ? { ...q, order_index: qu.order_index } : q;
        });
      }
      return {
        ...m,
        order_index: up ? up.order_index : m.order_index,
        quizzes: updatedQuizzes
      };
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/modules/batch-organize', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        fetchModules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moveItem = (modName, items, index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    handleReorderItems(modName, reordered);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/modules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/modules/topics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllTopics(Array.from(new Set([...DEFAULT_TOPICS, ...data])));
        }
      } catch (err) { console.error(err); }
    };
    fetchModules();
    fetchTopics();
    fetchLocalVideos();
    fetchLocalDocs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editId ? `/api/modules/${editId}` : '/api/modules';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(editId ? "Module updated successfully!" : "Module added successfully!");
        setShowForm(false);
        // Refresh modules, stats, and topics
        const token = localStorage.getItem('token');
        const resStats = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resStats.ok) setStats(await resStats.json());
        const resMods = await fetch('/api/modules', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resMods.ok) setModules(await resMods.json());
        const resTopics = await fetch('/api/modules/topics', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resTopics.ok) setAllTopics(await resTopics.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setModules(modules.filter(m => m.id !== id));
        const resStats = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resStats.ok) setStats(await resStats.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVisibility = async (mod) => {
    const newVisibility = mod.visibility === 'public' ? 'restricted' : 'public';
    try {
      const token = localStorage.getItem('token');
      const payload = { ...mod, visibility: newVisibility };
      
      const res = await fetch(`/api/modules/${mod.id}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModules(modules.map(m => m.id === mod.id ? { ...m, visibility: newVisibility } : m));
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to update visibility");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating visibility");
    }
  };

  const openFormForAdd = (presetTopic = '', presetModule = '') => {
    setEditId(null);
    const targetTopic = presetTopic || (selectedTopicFilter !== 'ALL' && selectedTopicFilter !== '__none__' ? selectedTopicFilter : 'IT');
    const targetModule = presetModule || 'Modul 1';
    
    // Auto calculate next order index in this module
    const inModule = modules.filter(m => (m.topic || '') === targetTopic && (m.module_name || 'Modul 1') === targetModule);
    const nextOrder = inModule.length > 0 ? Math.max(...inModule.map(m => parseInt(m.order_index) || 1)) + 1 : 1;

    setFormData({
      title: '',
      description: '',
      media_platform: 'youtube',
      external_url: '',
      category: 'Pelatihan',
      topic: targetTopic,
      module_name: targetModule,
      order_index: nextOrder,
      visibility: 'restricted',
      image_url: '',
      image_source: ''
    });
    fetchLocalVideos();
    fetchLocalDocs();
    setShowForm(true);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
      }
    };
    if (showForm) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showForm]);

  const openFormForEdit = (mod) => {
    setEditId(mod.id);
    setFormData({
      title: mod.title,
      description: mod.description || '',
      media_platform: mod.media_platform,
      external_url: mod.external_url,
      category: mod.category || 'Pelatihan',
      topic: mod.topic || '',
      module_name: mod.module_name || 'Modul 1',
      order_index: mod.order_index || 1,
      visibility: mod.visibility,
      image_url: mod.image_url || '',
      image_source: mod.image_source || ''
    });
    fetchLocalVideos();
    fetchLocalDocs();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-800 text-slate-800 dark:text-slate-300 transition-colors duration-500 font-body-md min-h-screen relative overflow-x-hidden z-0">
      
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

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/60 shadow-sm z-40 flex items-center justify-between px-4 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm font-bold text-primary dark:text-white">Admin Panel</span>
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
            <p className="font-body-md text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mt-1 transition-colors duration-500">Admin Dashboard</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-on-surface-variant dark:text-slate-400 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5">
          <li>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'dashboard' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>space_dashboard</span> Dashboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('manage_modules'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'manage_modules' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'manage_modules' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>view_kanban</span> Manajemen Modul
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'users' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'users' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>groups</span> Manajemen User
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'settings' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'settings' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>palette</span> Pengaturan Tampilan
            </button>
          </li>
        </ul>
        <div className="p-4 border-t border-outline-variant/30 dark:border-slate-700/50 flex flex-col gap-2">
          <div className="hidden lg:flex justify-end px-2 mb-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-2 mb-2">
             <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-[#004A74] shadow-sm flex items-center justify-center text-white font-bold text-lg">
               {user?.name?.charAt(0) || 'A'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-primary dark:text-white truncate transition-colors duration-500">{user?.name || 'Administrator'}</p>
               <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate transition-colors duration-500">Admin Panel</p>
             </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowAdminPasswordModal(true)} 
            className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 bg-slate-100 hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:hover:text-yellow-400 border border-slate-200 dark:border-slate-700 rounded-xl w-full text-left transition-colors cursor-pointer text-xs font-semibold shadow-2xs"
            title="Ubah kata sandi akun Administrator"
          >
            <span className="material-symbols-outlined text-[18px] text-primary dark:text-yellow-400">key</span>
            <span>Ubah Password Admin</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-4 text-error dark:text-red-400 px-4 py-3 hover:bg-error-container/50 dark:hover:bg-red-900/30 transition-all font-label-lg text-label-lg font-medium rounded-xl w-full text-left">
            <span className="material-symbols-outlined text-[22px]">logout</span> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen pt-24 md:pt-24 lg:pt-margin-desktop relative z-10">
        <div className="max-w-container-max mx-auto">
          <header className="mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="font-headline-xl text-headline-xl text-primary dark:text-white mb-2 transition-colors duration-500">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'manage_modules' && 'Manajemen Modul'}
                {activeTab === 'users' && 'Manajemen User'}
                {activeTab === 'settings' && 'Pengaturan Tampilan'}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 transition-colors duration-500">
                {activeTab === 'dashboard' && 'Ringkasan metrik dan performa LMS Ekspedisi Patriot.'}
                {activeTab === 'manage_modules' && 'Kelola materi publik, tautan eksternal, dan visibilitas.'}
                {activeTab === 'users' && 'Kelola Trainee, Co-Admin, dan penugasan topik belajar.'}
                {activeTab === 'settings' && 'Kelola tampilan halaman utama seperti Hero Image dan teks.'}
              </p>
            </div>
            {activeTab === 'manage_modules' && (
              <button 
                onClick={openFormForAdd}
                className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full font-bold hover-lift transition-all flex items-center justify-center gap-2 shadow-sm w-[200px]">
                <span className="material-symbols-outlined">add</span> New Link
              </button>
            )}
            {activeTab === 'users' && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openAddUserModal'))}
                className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full font-bold hover-lift transition-all flex items-center justify-center gap-2 shadow-sm w-[200px]">
                <span className="material-symbols-outlined">person_add</span> Tambah User
              </button>
            )}
          </header>

          {quizModule && (
            <QuizBuilder 
              module={quizModule.module || quizModule} 
              initialType={quizModule.initialType || null}
              onClose={() => { setQuizModule(null); fetchModules(); }} 
            />
          )}

          {showForm && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-colors duration-500">
              <section className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl p-8 shadow-2xl relative w-full max-w-2xl my-auto transition-colors duration-500">
                <h2 className="font-headline-md text-primary dark:text-white mb-6 transition-colors duration-500">{editId ? 'Edit Module' : 'Add New Module'}</h2>
                <form onSubmit={handleAddModule} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Title</label>
                            <input required type="text" placeholder="Masukkan judul materi" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Topic / Mata Pelajaran (6 Topik Utama LMS)</label>
                            <div className="flex gap-2">
                              <select
                                value={allTopics.includes(formData.topic) ? formData.topic : (formData.topic ? '__custom__' : '')}
                                onChange={e => {
                                  if (e.target.value === '__custom__') return;
                                  setFormData({...formData, topic: e.target.value});
                                }}
                                className="flex-1 px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                              >
                                <option value="">-- Tanpa Topik / Umum (Kosongkan) --</option>
                                <optgroup label="6 Materi Pilihan Beranda">
                                  {DEFAULT_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                </optgroup>
                                {allTopics.filter(t => !DEFAULT_TOPICS.includes(t)).length > 0 && (
                                  <optgroup label="Topik Lainnya">
                                    {allTopics.filter(t => !DEFAULT_TOPICS.includes(t)).map(t => (
                                      <option key={t} value={t}>{t}</option>
                                    ))}
                                  </optgroup>
                                )}
                                <option value="__custom__">+ Tambah Topik Baru...</option>
                              </select>
                            </div>
                            {formData.category === 'Kisah Inspiratif' && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                💡 Info: Kisah Inspiratif memiliki seksi tersendiri di beranda. Pilih "-- Tanpa Topik --" agar tidak masuk ke 6 kotak materi belajar.
                              </p>
                            )}
                            <input
                              type="text"
                              value={formData.topic}
                              onChange={e => setFormData({...formData, topic: e.target.value})}
                              className="w-full mt-3 px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"
                              placeholder="Ketik nama topik baru atau biarkan kosong"
                            />
                        </div>
                    </div>

                    {/* Pengaturan Modul & Urutan Materi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary/5 dark:bg-slate-900/40 border border-primary/20 dark:border-slate-700 p-4 rounded-xl">
                        <div>
                            <label className="block text-label-sm font-bold text-primary dark:text-blue-400 mb-1">
                              Nama & Judul Modul <span className="text-secondary dark:text-yellow-400 font-bold">*</span>
                            </label>
                            {(() => {
                              const existingModulesInTopic = Array.from(new Set(
                                modules
                                  .filter(m => (m.topic || '').toLowerCase() === (formData.topic || '').toLowerCase())
                                  .map(m => m.module_name || 'Modul 1')
                              )).filter(Boolean);

                              return (
                                <div className="space-y-2">
                                  <select
                                    value={existingModulesInTopic.includes(formData.module_name) ? formData.module_name : '__custom__'}
                                    onChange={e => {
                                      if (e.target.value !== '__custom__') {
                                        setFormData({ ...formData, module_name: e.target.value });
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 shadow-sm text-slate-800 dark:text-slate-200 rounded-lg text-xs outline-none"
                                  >
                                    <optgroup label="Pilih dari Modul yang Sudah Ada">
                                      {existingModulesInTopic.length > 0 ? (
                                        existingModulesInTopic.map(modName => (
                                          <option key={modName} value={modName}>{modName}</option>
                                        ))
                                      ) : (
                                        <option value="Modul 1">Modul 1</option>
                                      )}
                                    </optgroup>
                                    <option value="__custom__">+ Ketik Nama & Judul Modul Baru...</option>
                                  </select>
                                  <input
                                    type="text"
                                    required
                                    value={formData.module_name}
                                    onChange={e => setFormData({ ...formData, module_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Contoh: Modul 1: Karir Bidang IT & Digital"
                                  />
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Bisa diberi judul lengkap, misal: <strong>Modul 1: Dasar IT & Digital</strong>
                                  </p>
                                </div>
                              );
                            })()}
                        </div>
                        <div>
                            <label className="block text-label-sm font-bold text-primary dark:text-blue-400 mb-1">
                              Urutan Materi dalam Modul
                            </label>
                            <input 
                              type="number" 
                              min="1" 
                              value={formData.order_index} 
                              onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })} 
                              className="w-full px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-primary" 
                              placeholder="1, 2, 3..." 
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                              💡 Menentukan urutan materi di dashboard user (Urutan 1, 2, dst).
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Category (Layout)</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                                <option value="Materi Publik">Materi Publik</option>
                                <option value="Kisah Inspiratif">Kisah Inspiratif</option>
                                <option value="Pelatihan">Pelatihan (Modul)</option>
                                <option value="Jadwal">Jadwal</option>
                                <option value="Dokumen Resmi">Dokumen Resmi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Media Platform</label>
                            <select 
                              value={formData.media_platform} 
                              onChange={e => setFormData({...formData, media_platform: e.target.value})} 
                              className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none font-semibold"
                            >
                                <option value="youtube">YouTube (Online)</option>
                                <option value="local_video">📁 Video Lokal MP4 (Offline)</option>
                                <option value="local_pdf">📄 Dokumen PDF Lokal (Offline)</option>
                                <option value="gdrive_pdf">Google Drive (PDF)</option>
                                <option value="tiktok">TikTok</option>
                                <option value="instagram">Instagram</option>
                            </select>
                        </div>
                    </div>

                    {/* Media Source: Dynamic based on Media Platform */}
                    <div>
                      {formData.media_platform === 'local_video' ? (
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">video_file</span>
                              <span>File Video MP4 Lokal (Server Offline)</span>
                            </label>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                              Mode Offline
                            </span>
                          </div>

                          {/* Quick Picker from existing files in uploads/videos */}
                          {localVideosList.length > 0 && (
                            <div>
                              <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
                                Pilih dari file video yang sudah ada di server:
                              </label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={formData.external_url}
                                  onChange={e => {
                                    if (e.target.value) {
                                      const chosen = localVideosList.find(v => v.url === e.target.value);
                                      setFormData({
                                        ...formData,
                                        external_url: e.target.value,
                                        title: formData.title || (chosen ? chosen.filename.replace(/\.[^/.]+$/, "") : '')
                                      });
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs outline-none"
                                >
                                  <option value="">-- Pilih video di folder uploads/videos --</option>
                                  {localVideosList.map(v => (
                                    <option key={v.filename} value={v.url}>
                                      {v.filename} ({(v.size / (1024 * 1024)).toFixed(1)} MB)
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={fetchLocalVideos}
                                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                                  title="Segarkan daftar video"
                                >
                                  <span className="material-symbols-outlined text-sm">refresh</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Upload new video file */}
                          <div>
                            <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
                              Atau unggah file MP4 baru dari laptop/flashdisk:
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                required
                                value={formData.external_url}
                                onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono outline-none"
                                placeholder="/uploads/videos/nama_video.mp4"
                              />
                              <label className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                                isUploadingVideo
                                  ? 'bg-slate-400 text-white cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}>
                                <span className="material-symbols-outlined text-base">
                                  {isUploadingVideo ? 'hourglass_top' : 'upload_file'}
                                </span>
                                <span>{isUploadingVideo ? 'Mengunggah...' : 'Pilih File MP4'}</span>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/m4v,video/mkv"
                                  disabled={isUploadingVideo}
                                  onChange={handleVideoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Local Video Preview */}
                          {formData.external_url && (
                            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Pratinjau Video Lokal:
                              </p>
                              <div className="w-full max-h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                                <video
                                  key={formData.external_url}
                                  src={formData.external_url}
                                  controls
                                  className="max-h-48 w-auto object-contain"
                                >
                                  Format video tidak didukung browser.
                                </video>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : formData.media_platform === 'local_pdf' ? (
                        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                              <span>File Dokumen PDF Lokal (Server Offline)</span>
                            </label>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
                              Mode Offline
                            </span>
                          </div>

                          {/* Quick Picker from existing files in uploads/documents */}
                          {localDocsList.length > 0 && (
                            <div>
                              <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
                                Pilih dari dokumen PDF yang sudah ada di server:
                              </label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={formData.external_url}
                                  onChange={e => {
                                    if (e.target.value) {
                                      const chosen = localDocsList.find(d => d.url === e.target.value);
                                      setFormData({
                                        ...formData,
                                        external_url: e.target.value,
                                        title: formData.title || (chosen ? chosen.filename.replace(/\.[^/.]+$/, "") : '')
                                      });
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs outline-none"
                                >
                                  <option value="">-- Pilih dokumen di folder uploads/documents --</option>
                                  {localDocsList.map(d => (
                                    <option key={d.filename} value={d.url}>
                                      {d.filename} ({(d.size / (1024 * 1024)).toFixed(1)} MB)
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={fetchLocalDocs}
                                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                                  title="Segarkan daftar dokumen"
                                >
                                  <span className="material-symbols-outlined text-sm">refresh</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Upload new PDF document */}
                          <div>
                            <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
                              Atau unggah file PDF baru dari laptop/flashdisk:
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                required
                                value={formData.external_url}
                                onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-mono outline-none"
                                placeholder="/uploads/documents/nama_dokumen.pdf"
                              />
                              <label className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                                isUploadingPdf
                                  ? 'bg-slate-400 text-white cursor-not-allowed'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}>
                                <span className="material-symbols-outlined text-base">
                                  {isUploadingPdf ? 'hourglass_top' : 'upload_file'}
                                </span>
                                <span>{isUploadingPdf ? 'Mengunggah...' : 'Pilih File PDF'}</span>
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  disabled={isUploadingPdf}
                                  onChange={handlePdfUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Local PDF Link & Preview Button */}
                          {formData.external_url && (
                            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 truncate max-w-sm">
                                <span className="material-symbols-outlined text-base">description</span>
                                <span className="truncate">{formData.external_url}</span>
                              </div>
                              <a
                                href={formData.external_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                <span>Buka PDF di Tab Baru</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">
                            {getUrlLabel(formData.media_platform)}
                          </label>
                          <input
                            required
                            type="text"
                            value={formData.external_url}
                            onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                            className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder={getUrlPlaceholder(formData.media_platform)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Cover Image URL (Optional)</label>
                            <div className="flex gap-2 w-full">
                              <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="flex-1 w-full min-w-0 px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" placeholder="https://..." />
                              <div className="shrink-0">
                                <CloudinaryUpload onUploadSuccess={(url) => setFormData({...formData, image_url: url})} buttonText="Unggah" />
                              </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Visibility</label>
                            <select value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                                <option value="public">Public</option>
                                <option value="restricted">Restricted (Trainees only)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Description</label>
                        <textarea rows={3} placeholder="Tuliskan deskripsi singkat..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant/50 dark:border-slate-700/50">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-outline-variant dark:border-slate-600 rounded-full text-on-surface-variant dark:text-slate-300 font-bold hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors">Batal</button>
                      <button type="submit" className="bg-primary dark:bg-yellow-500 text-on-primary dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-primary/90 dark:hover:bg-yellow-400 transition-colors shadow-sm">
                        {editId ? 'Update Module' : 'Save Module'}
                      </button>
                    </div>
                </form>
              </section>
            </div>,
            document.body
          )}

          <ChangePasswordModal 
            isOpen={showAdminPasswordModal} 
            onClose={() => setShowAdminPasswordModal(false)} 
            userName={user?.email ? `${user.name || 'Administrator'} (${user.email})` : 'Administrator'} 
          />

          {renameModal.show && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-yellow-400">edit_note</span>
                    <span>Ubah Nama & Judul Modul</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRenameModal({ show: false, topic: '', oldName: '', newName: '' })}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>Topik: <span className="font-bold text-primary dark:text-yellow-400">{renameModal.topic || 'Umum'}</span></div>
                  <div>Nama Saat Ini: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{renameModal.oldName}</span></div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama & Judul Modul Baru: <span className="text-secondary dark:text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={renameModal.newName}
                    onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRenameModule(); }}
                    placeholder="Contoh: Modul 1: Karir Bidang IT & Digital"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary dark:focus:ring-yellow-400 shadow-inner"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Perubahan judul ini otomatis diterapkan ke seluruh materi & kuis yang ada di dalam modul ini.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setRenameModal({ show: false, topic: '', oldName: '', newName: '' })}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isRenaming || !renameModal.newName.trim()}
                    onClick={handleSaveRenameModule}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isRenaming ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">save</span>
                        <span>Simpan Judul Baru</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          <ChangePasswordModal 
            isOpen={showAdminPasswordModal} 
            onClose={() => setShowAdminPasswordModal(false)} 
            userName={user?.email ? `${user.name || 'Administrator'} (${user.email})` : 'Administrator'} 
          />

          {activeTab === 'users' && (
            <UserManagement currentUserRole={user.role} />
          )}

          {activeTab === 'settings' && (
            <SiteSettings />
          )}

          {activeTab === 'dashboard' && (
          <div className="space-y-12">
            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Total Active Links */}
              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-6 hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all flex flex-col justify-between duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#004A74]/10 dark:bg-[#004A74]/30 flex items-center justify-center text-[#004A74] dark:text-blue-400 shadow-sm transition-colors duration-500">
                    <span className="material-symbols-outlined">link</span>
                  </div>
                  <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Total Active Links</p>
                </div>
                <h3 className="text-5xl font-extrabold text-primary dark:text-white tracking-tight transition-colors duration-500">{stats.totalActiveLinks}</h3>
              </div>

              {/* Trainee Retention Rate */}
              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-6 hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all flex flex-col justify-between duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 shadow-sm transition-colors duration-500">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Trainee Retention Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-extrabold text-secondary dark:text-yellow-400 tracking-tight transition-colors duration-500">{stats.retentionRate}</h3>
                  <span className="text-2xl font-bold text-secondary/70 dark:text-yellow-400/70 transition-colors duration-500">%</span>
                </div>
              </div>
            </section>

            {/* Regional Distribution */}
            <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all duration-500">
              <div className="flex flex-col md:flex-row min-h-[300px]">
                {/* Left Side (Content) */}
                <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm transition-colors duration-500">
                      <span className="material-symbols-outlined">map</span>
                    </div>
                    <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Regional Trainee Distribution</p>
                  </div>
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-5xl font-extrabold text-slate-900 dark:text-white transition-colors duration-500">{stats.regions.length}</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-300 transition-colors duration-500">Provinces</span>
                  </div>
                  
                  <ul className="space-y-4 max-w-md">
                    {stats.regions.map((r, i) => {
                      const colors = ['bg-slate-900', 'bg-yellow-400', 'bg-slate-400', 'bg-blue-500', 'bg-green-500'];
                      const dotColor = colors[i % colors.length];
                      return (
                        <li key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                            <span className="text-base text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{r.name}</span>
                          </div>
                          <span className="text-base font-bold text-slate-900 dark:text-white transition-colors">{r.count}</span>
                        </li>
                      );
                    })}
                    {stats.regions.length === 0 && <li className="text-slate-500">No data available</li>}
                  </ul>
                </div>

                {/* Right Side (Abstract Graphic) */}
                <div className="hidden md:block w-1/3 lg:w-2/5 bg-[#004A74]">
                </div>
              </div>
            </section>
          </div>
          )}

          {activeTab === 'manage_modules' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Manajemen Modul */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-yellow-400">school</span>
                  Manajemen Modul & Kurikulum LMS
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Atur hierarki materi pembelajaran: <b>6 Topik Utama ➔ Modul 1, Modul 2, dst. ➔ Materi & Kuis</b> untuk dashboard user.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Switcher Tampilan */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('curriculum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'curriculum'
                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-yellow-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">account_tree</span>
                    <span>Kurikulum LMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-yellow-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">table_chart</span>
                    <span>Tabel Ringkas</span>
                  </button>
                </div>

                <button 
                  onClick={() => openFormForAdd(selectedTopicFilter !== 'ALL' && selectedTopicFilter !== '__none__' ? selectedTopicFilter : 'IT', 'Modul 1')}
                  className="bg-primary dark:bg-yellow-400 text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:opacity-90 shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Tambah Materi</span>
                </button>
              </div>
            </div>

            {/* Toolbar Sinkronisasi Flashdisk & Mode Offline (Tahap 2) */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 border border-blue-200/80 dark:border-blue-900/50 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">usb</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Sinkronisasi Offline & Flashdisk (Tahap 2)
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Server Lokal
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ekspor kurikulum & materi ke file JSON di flashdisk untuk disalin ke komputer server sekolah tanpa internet.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCurriculum}
                  disabled={isExporting}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Unduh paket kurikulum JSON untuk dipindahkan ke flashdisk"
                >
                  <span className="material-symbols-outlined text-base text-blue-500">file_download</span>
                  <span>{isExporting ? 'Mengekspor...' : 'Ekspor Kurikulum'}</span>
                </button>

                <label className={`px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="material-symbols-outlined text-base text-emerald-500">file_upload</span>
                  <span>{isImporting ? 'Mengimpor...' : 'Impor dari Flashdisk'}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    disabled={isImporting}
                    onChange={handleImportCurriculum}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleExportGrades}
                  disabled={isExportingGrades}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 hover:text-amber-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Unduh rekap nilai siswa dari server lokal ke flashdisk"
                >
                  <span className="material-symbols-outlined text-base text-amber-500">assessment</span>
                  <span>{isExportingGrades ? 'Mengekspor...' : 'Ekspor Nilai Siswa'}</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs Berdasarkan Topik */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedTopicFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedTopicFilter === 'ALL'
                    ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Semua Topik</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{modules.length}</span>
              </button>

              {DEFAULT_TOPICS.map(topicName => {
                const count = modules.filter(m => (m.topic || '').toLowerCase() === topicName.toLowerCase()).length;
                return (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => setSelectedTopicFilter(topicName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedTopicFilter === topicName
                        ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{topicName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTopicFilter === topicName ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              {allTopics.filter(t => !DEFAULT_TOPICS.includes(t)).map(topicName => {
                const count = modules.filter(m => (m.topic || '').toLowerCase() === topicName.toLowerCase()).length;
                return (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => setSelectedTopicFilter(topicName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedTopicFilter === topicName
                        ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{topicName}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700">{count}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedTopicFilter('__none__')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedTopicFilter === '__none__'
                    ? 'bg-primary dark:bg-blue-600 text-white shadow-md'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Tanpa Topik / Umum</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700">
                  {modules.filter(m => !m.topic).length}
                </span>
              </button>
            </div>

            {/* TAMPILAN 1: KURIKULUM LMS (HIERARKI TOPIK -> MODUL -> MATERI) */}
            {viewMode === 'curriculum' && (
              <div className="space-y-8">
                {(() => {
                  // Determine topics to display based on filter
                  let topicsToRender = [];
                  if (selectedTopicFilter === 'ALL') {
                    // Show all 6 default topics plus any custom topics that have modules
                    topicsToRender = [...DEFAULT_TOPICS];
                    allTopics.forEach(t => {
                      if (!topicsToRender.includes(t)) topicsToRender.push(t);
                    });
                    if (modules.some(m => !m.topic)) topicsToRender.push('Tanpa Topik');
                  } else if (selectedTopicFilter === '__none__') {
                    topicsToRender = ['Tanpa Topik'];
                  } else {
                    topicsToRender = [selectedTopicFilter];
                  }

                  return topicsToRender.map(currentTopic => {
                    const isNoTopic = currentTopic === 'Tanpa Topik';
                    const topicModules = modules.filter(m => 
                      isNoTopic ? (!m.topic) : ((m.topic || '').toLowerCase() === currentTopic.toLowerCase())
                    );

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
                      // Natural sort for "Modul 1", "Modul 2", etc.
                      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                    });

                    // Find topic metadata icon if matching TOPICS_LIST
                    const topicMeta = TOPICS_LIST.find(t => t.name.toLowerCase() === currentTopic.toLowerCase());

                    return (
                      <div key={currentTopic} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                        {/* Topic Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400 flex items-center justify-center">
                              <span className="material-symbols-outlined text-2xl">{topicMeta?.icon || 'folder'}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentTopic}</h3>
                                {topicMeta?.subtitle && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({topicMeta.subtitle})</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {moduleNames.length} Modul Pembelajaran • {topicModules.length} Total Materi
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nextModNum = moduleNames.length + 1;
                              const defaultName = `Modul ${nextModNum}: `;
                              const enteredName = prompt(
                                `Tambah Modul Baru pada Topik "${currentTopic}":\nMasukkan Nama & Judul Modul (Contoh: Modul ${nextModNum}: Dasar & Pengenalan):`,
                                defaultName
                              );
                              if (enteredName !== null) {
                                const finalName = enteredName.trim() || `Modul ${nextModNum}`;
                                openFormForAdd(isNoTopic ? '' : currentTopic, finalName);
                              }
                            }}
                            className="text-xs font-bold text-primary dark:text-yellow-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                          >
                            <span className="material-symbols-outlined text-base">create_new_folder</span>
                            <span>+ Tambah Modul Baru</span>
                          </button>
                        </div>

                        {/* Modules Cards under this Topic */}
                        {moduleNames.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">auto_stories</span>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum ada modul di topik {currentTopic}</p>
                            <p className="text-xs text-slate-400 mt-1 mb-4">Tambahkan materi pertama untuk membentuk modul di topik ini.</p>
                            <button
                              type="button"
                              onClick={() => {
                                const entered = prompt(
                                  `Buat Modul Pertama pada Topik "${currentTopic}":\nMasukkan Nama & Judul Modul (Contoh: Modul 1: Dasar & Pengenalan):`,
                                  'Modul 1: '
                                );
                                if (entered !== null) {
                                  openFormForAdd(isNoTopic ? '' : currentTopic, entered.trim() || 'Modul 1');
                                }
                              }}
                              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 cursor-pointer"
                            >
                              + Buat Modul 1
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {moduleNames.map((modName, modIdx) => {
                              const materiList = moduleGroups[modName];
                              const repModule = materiList.find(m => m.has_pre_test || m.has_post_test) || materiList[0];

                              // Collect all quizzes across materiList in this module group, deduplicated by id
                              const allModQuizzesMap = new Map();
                              materiList.forEach(m => {
                                (m.quizzes || []).forEach(q => {
                                  if (!allModQuizzesMap.has(q.id)) {
                                    allModQuizzesMap.set(q.id, { ...q, parentModule: m });
                                  }
                                });
                              });
                              const modQuizzes = Array.from(allModQuizzesMap.values());
                              const preTestQuiz = modQuizzes.find(q => q.type === 'pre_test');
                              const postTestQuiz = modQuizzes.find(q => q.type === 'post_test');

                              // Combined items: Pre-Test, Lessons (Materi), and Post-Test all in one list
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
                                  title: q.title || (q.type === 'pre_test' ? `Pre-Test Modul: ${modName}` : `Post-Test Modul: ${modName}`)
                                }))
                              ].sort((a, b) => a.order_index - b.order_index);

                              return (
                                <div key={modName} className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-5 transition-all hover:border-primary/40 space-y-4">
                                  {/* Module Header Bar */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/50 gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="w-6 h-6 rounded-md bg-secondary/20 dark:bg-yellow-400/20 text-secondary dark:text-yellow-400 text-xs font-bold flex items-center justify-center">
                                        {modIdx + 1}
                                      </span>
                                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                                        {modName}
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() => setRenameModal({
                                          show: true,
                                          topic: isNoTopic ? '' : currentTopic,
                                          oldName: modName,
                                          newName: modName
                                        })}
                                        className="px-2 py-0.5 rounded-lg text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-yellow-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                                        title="Ubah / Tambah Judul Modul (misal: Modul 1: Karir & Branding IT)"
                                      >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        <span className="text-[11px] font-medium">Ubah Judul</span>
                                      </button>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {combinedItems.length} Komponen ({materiList.length} Materi{preTestQuiz ? ' • 1 Pre-Test' : ''}{postTestQuiz ? ' • 1 Post-Test' : ''})
                                      </span>
                                    </div>

                                    {/* Action buttons: Add Pre-Test / Post-Test / Materi */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {!preTestQuiz && (
                                        <button
                                          type="button"
                                          onClick={() => setQuizModule({ module: repModule, initialType: 'pre_test' })}
                                          className="px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200/80 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-sm">add_circle</span>
                                          <span>+ Pre-Test</span>
                                        </button>
                                      )}

                                      {!postTestQuiz && (
                                        <button
                                          type="button"
                                          onClick={() => setQuizModule({ module: repModule, initialType: 'post_test' })}
                                          className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/40 hover:bg-blue-200/80 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-sm">add_circle</span>
                                          <span>+ Post-Test</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => openFormForAdd(isNoTopic ? '' : currentTopic, modName)}
                                        className="px-2.5 py-1 text-xs font-bold text-primary dark:text-yellow-400 bg-primary/10 dark:bg-yellow-400/10 hover:bg-primary/20 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        <span>+ Materi</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Helpful Hint banner */}
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-white/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/40 px-3 py-2 rounded-lg">
                                    <span className="material-symbols-outlined text-sm text-primary dark:text-yellow-400 shrink-0">drag_indicator</span>
                                    <span>
                                      <strong>Atur Urutan Bebas:</strong> Geser ikon <span className="font-semibold">⠿</span> atau gunakan panah <span className="font-semibold">▲ / ▼</span> untuk mengatur posisi Pre-Test, Post-Test, maupun Materi.
                                    </span>
                                  </div>

                                  {/* Reorderable Items List */}
                                  <div className="space-y-2">
                                    {combinedItems.map((item, idx) => {
                                      const isDragOver = dragOverIndex === idx && draggedItem && draggedItem.modName === modName;

                                      if (item.itemType === 'quiz') {
                                        const isPreTest = item.quizType === 'pre_test';
                                        return (
                                          <div
                                            key={`quiz-${item.id}`}
                                            draggable
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData('text/plain', '');
                                              setDraggedItem({ modName, index: idx });
                                            }}
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              if (dragOverIndex !== idx) setDragOverIndex(idx);
                                            }}
                                            onDragEnd={() => {
                                              setDraggedItem(null);
                                              setDragOverIndex(null);
                                            }}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              if (!draggedItem || draggedItem.modName !== modName || draggedItem.index === idx) {
                                                setDraggedItem(null);
                                                setDragOverIndex(null);
                                                return;
                                              }
                                              const reordered = [...combinedItems];
                                              const [moved] = reordered.splice(draggedItem.index, 1);
                                              reordered.splice(idx, 0, moved);
                                              setDraggedItem(null);
                                              setDragOverIndex(null);
                                              handleReorderItems(modName, reordered);
                                            }}
                                            className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                                              isDragOver ? 'ring-2 ring-primary dark:ring-yellow-400 scale-[1.01]' : ''
                                            } ${
                                              isPreTest
                                                ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-100'
                                                : 'bg-blue-500/10 border-blue-300 dark:border-blue-700/60 text-slate-800 dark:text-slate-100'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                              {/* Drag Handle & Up/Down Arrows */}
                                              <div className="flex items-center gap-1 shrink-0">
                                                <div 
                                                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 flex items-center justify-center rounded" 
                                                  title="Geser untuk ubah urutan"
                                                >
                                                  <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                  <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => moveItem(modName, combinedItems, idx, -1)}
                                                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer"
                                                    title="Geser ke Atas"
                                                  >
                                                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    disabled={idx === combinedItems.length - 1}
                                                    onClick={() => moveItem(modName, combinedItems, idx, 1)}
                                                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer"
                                                    title="Geser ke Bawah"
                                                  >
                                                    <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Urutan Badge */}
                                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                #{idx + 1}
                                              </div>

                                              {/* Icon */}
                                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                                isPreTest ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                              }`}>
                                                <span className="material-symbols-outlined text-xl">
                                                  {isPreTest ? 'assignment_turned_in' : 'task_alt'}
                                                </span>
                                              </div>

                                              {/* Info */}
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    isPreTest 
                                                      ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200' 
                                                      : 'bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200'
                                                  }`}>
                                                    {isPreTest ? 'PRE-TEST' : 'POST-TEST (EVALUASI AKHIR)'}
                                                  </span>
                                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    Aktif ✓
                                                  </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                                                  {item.title}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                  {isPreTest 
                                                    ? 'Evaluasi awal kemampuan siswa sebelum materi lanjutan' 
                                                    : 'Evaluasi akhir capaian pemahaman siswa pada modul ini'}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Right Action: Edit Quiz */}
                                            <div className="flex items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/40 dark:border-slate-700/40">
                                              <button
                                                type="button"
                                                onClick={() => setQuizModule({ module: item.data.parentModule || repModule, initialType: item.quizType })}
                                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                                  isPreTest
                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                                }`}
                                              >
                                                <span className="material-symbols-outlined text-sm">edit_note</span>
                                                <span>Kelola Soal {isPreTest ? 'Pre-Test' : 'Post-Test'}</span>
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      }

                                      // Lesson (Materi) item
                                      const mod = item.data;
                                      return (
                                        <div
                                          key={`materi-${mod.id}`}
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', '');
                                            setDraggedItem({ modName, index: idx });
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            if (dragOverIndex !== idx) setDragOverIndex(idx);
                                          }}
                                          onDragEnd={() => {
                                            setDraggedItem(null);
                                            setDragOverIndex(null);
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            if (!draggedItem || draggedItem.modName !== modName || draggedItem.index === idx) {
                                              setDraggedItem(null);
                                              setDragOverIndex(null);
                                              return;
                                            }
                                            const reordered = [...combinedItems];
                                            const [moved] = reordered.splice(draggedItem.index, 1);
                                            reordered.splice(idx, 0, moved);
                                            setDraggedItem(null);
                                            setDragOverIndex(null);
                                            handleReorderItems(modName, reordered);
                                          }}
                                          className={`bg-white dark:bg-slate-900/80 border rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-sm transition-all ${
                                            isDragOver ? 'ring-2 ring-primary dark:ring-yellow-400 scale-[1.01]' : 'border-slate-200/80 dark:border-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Drag Handle & Up/Down Arrows */}
                                            <div className="flex items-center gap-1 shrink-0">
                                              <div 
                                                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 flex items-center justify-center rounded" 
                                                title="Geser untuk ubah urutan"
                                              >
                                                <span className="material-symbols-outlined text-lg">drag_indicator</span>
                                              </div>
                                              <div className="flex flex-col gap-0.5">
                                                <button
                                                  type="button"
                                                  disabled={idx === 0}
                                                  onClick={() => moveItem(modName, combinedItems, idx, -1)}
                                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer"
                                                  title="Geser ke Atas"
                                                >
                                                  <span className="material-symbols-outlined text-xs">arrow_upward</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  disabled={idx === combinedItems.length - 1}
                                                  onClick={() => moveItem(modName, combinedItems, idx, 1)}
                                                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer"
                                                  title="Geser ke Bawah"
                                                >
                                                  <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                                </button>
                                              </div>
                                            </div>

                                            {/* Urutan Badge */}
                                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                              #{idx + 1}
                                            </div>

                                            {/* Platform Icon */}
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                              <span className={`material-symbols-outlined text-lg ${
                                                mod.media_platform === 'local_video' ? 'text-emerald-500' :
                                                mod.media_platform === 'local_pdf' ? 'text-rose-500' :
                                                mod.media_platform === 'youtube' ? 'text-red-500' :
                                                mod.media_platform === 'gdrive_pdf' ? 'text-rose-600' :
                                                mod.media_platform === 'tiktok' ? 'text-slate-900 dark:text-white' : 'text-purple-500'
                                              }`}>
                                                {mod.media_platform === 'local_video' ? 'video_file' :
                                                 mod.media_platform === 'local_pdf' ? 'picture_as_pdf' :
                                                 mod.media_platform === 'youtube' ? 'smart_display' :
                                                 mod.media_platform === 'gdrive_pdf' ? 'picture_as_pdf' :
                                                 mod.media_platform === 'tiktok' ? 'movie' : 'video_library'}
                                              </span>
                                            </div>

                                            {/* Title & Info */}
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span 
                                                  className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600" 
                                                  onClick={() => openFormForEdit(mod)}
                                                >
                                                  {mod.title}
                                                </span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                  mod.media_platform === 'local_video'
                                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                                                    : mod.media_platform === 'local_pdf'
                                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                  {mod.media_platform === 'local_video' ? 'MP4 Lokal' : mod.media_platform === 'local_pdf' ? 'PDF Lokal (Offline)' : mod.category}
                                                </span>
                                              </div>
                                              <p className="text-[11px] text-slate-400 truncate max-w-md">{mod.external_url}</p>
                                            </div>
                                          </div>

                                          {/* Right Badges & Controls */}
                                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                            {/* Visibility Toggle */}
                                            <button
                                              type="button"
                                              onClick={() => handleToggleVisibility(mod)}
                                              className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                                              title="Klik untuk ubah visibilitas"
                                            >
                                              <span className={`w-2 h-2 rounded-full ${mod.visibility === 'public' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                              <span className="text-slate-600 dark:text-slate-300">
                                                {mod.visibility === 'public' ? 'Publik' : 'LMS Member'}
                                              </span>
                                            </button>

                                            {/* Edit & Delete */}
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => openFormForEdit(mod)}
                                                className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                title="Edit Materi"
                                              >
                                                <span className="material-symbols-outlined text-base">edit</span>
                                              </button>
                                              {user.role === 'admin' && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteModule(mod.id)}
                                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                  title="Hapus Materi"
                                                >
                                                  <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* TAMPILAN 2: TABEL RINGKAS */}
            {viewMode === 'table' && (
              <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden hover:shadow-[0_10px_15px_-3px_rgba(0,33,71,0.05)] transition-all duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/40 dark:bg-slate-900/40 border-b border-white/50 dark:border-slate-700/50 backdrop-blur-lg whitespace-nowrap transition-colors duration-500">
                      <tr>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400">Judul & Tautan</th>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 hidden md:table-cell">Topik</th>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 hidden md:table-cell">Modul</th>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-center hidden md:table-cell">Urutan</th>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-center">Visibilitas</th>
                        <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules
                        .filter(m => {
                          if (selectedTopicFilter === 'ALL') return true;
                          if (selectedTopicFilter === '__none__') return !m.topic;
                          return (m.topic || '').toLowerCase() === selectedTopicFilter.toLowerCase();
                        })
                        .map(mod => (
                        <tr key={mod.id} className="border-b border-surface-container-high dark:border-slate-700/50 hover:bg-surface-container-low/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-2 sm:px-4">
                            <div className="font-medium text-primary dark:text-white mb-1 whitespace-normal break-words min-w-[100px] text-sm sm:text-base cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => openFormForEdit(mod)}>{mod.title}</div>
                            <div className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400 max-w-[120px] md:max-w-[200px] truncate hidden md:block" title={mod.external_url}>{mod.external_url}</div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-sm text-on-surface-variant dark:text-slate-300 hidden md:table-cell">{mod.topic || '-'}</td>
                          <td className="py-3 px-2 sm:px-4 text-sm font-semibold text-primary dark:text-blue-400 hidden md:table-cell">{mod.module_name || 'Modul 1'}</td>
                          <td className="py-3 px-2 sm:px-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 hidden md:table-cell">#{mod.order_index || 1}</td>
                          <td className="py-3 px-2 sm:px-4">
                            <div 
                              className="flex items-center justify-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleToggleVisibility(mod)}
                            >
                              <div className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${mod.visibility === 'public' ? 'bg-[#0F172A] dark:bg-blue-500' : 'bg-outline-variant/30 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-300 ${mod.visibility === 'public' ? 'left-[18px]' : 'left-[4px]'}`}></div>
                              </div>
                              <span className="text-xs font-medium text-on-surface-variant dark:text-slate-300 select-none whitespace-nowrap hidden md:inline">
                                {mod.visibility === 'public' ? 'Public Dashboard' : 'LMS Dashboard'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-right align-middle">
                            <div className="flex justify-end gap-1 whitespace-nowrap">
                            <button onClick={() => setQuizModule(mod)} className="relative text-tertiary dark:text-blue-400 hover:bg-tertiary dark:hover:bg-blue-400/20 hover:text-on-tertiary p-1 sm:p-2 rounded-full transition-colors" title="Manage Quizzes">
                              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">fact_check</span>
                              {(mod.has_pre_test || mod.has_post_test) && (
                                <span className="absolute top-[2px] right-[2px] w-2 h-2 bg-green-500 rounded-full ring-[1.5px] ring-white dark:ring-slate-800"></span>
                              )}
                            </button>
                            <button onClick={() => openFormForEdit(mod)} className="text-secondary dark:text-yellow-400 hover:bg-secondary-container dark:hover:bg-yellow-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Edit">
                              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">edit</span>
                            </button>
                            {user.role === 'admin' && (
                              <button onClick={() => handleDeleteModule(mod.id)} className="text-error dark:text-red-400 hover:bg-error-container dark:hover:bg-red-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Delete">
                                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {modules.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-on-surface-variant dark:text-slate-400">Belum ada Modul</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
