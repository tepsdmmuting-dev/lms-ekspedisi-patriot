import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ChangePasswordModal from './ChangePasswordModal';
import { DEFAULT_TOPICS } from '../constants/topics';

const UserManagement = ({ currentUserRole }) => {
  const [users, setUsers] = useState([]);
  const [allTopics, setAllTopics] = useState(DEFAULT_TOPICS);
  const [showForm, setShowForm] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'trainee', region: '', district: '' });
  const [showFormPassword, setShowFormPassword] = useState(false);
  
  // Wilayah state
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [selectedProvId, setSelectedProvId] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Reset & Edit Password Modal state
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showMyPasswordModal, setShowMyPasswordModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTopics();
    fetchProvinces();

    const handleOpenAddUserModal = () => handleOpenForm();
    window.addEventListener('openAddUserModal', handleOpenAddUserModal);
    
    return () => window.removeEventListener('openAddUserModal', handleOpenAddUserModal);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        setSelectedUser(null);
        setPasswordModalUser(null);
      }
    };
    if (showForm || selectedUser || passwordModalUser) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showForm, selectedUser, passwordModalUser]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      if (res.ok) setProvinces(await res.json());
    } catch (err) { console.error('Failed to fetch provinces', err); }
  };

  useEffect(() => {
    if (selectedProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setRegencies(data))
        .catch(err => { console.error(err); setRegencies([]); });
    } else {
      setRegencies([]);
    }
  }, [selectedProvId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/modules/topics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllTopics(Array.from(new Set([...DEFAULT_TOPICS, ...data])));
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenForm = (user = null) => {
    if (user) {
      setEditUserId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        region: user.region,
        district: user.district
      });
      setShowFormPassword(false);
      // Find province ID if exists
      const prov = provinces.find(p => p.name === user.region);
      if (prov) {
        setSelectedProvId(prov.id);
      } else {
        setSelectedProvId('');
      }
    } else {
      setEditUserId(null);
      setFormData({ name: '', email: '', password: '', role: 'trainee', region: '', district: '' });
      setShowFormPassword(false);
      setSelectedProvId('');
    }
    setShowForm(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const method = editUserId ? 'PUT' : 'POST';
      const url = editUserId ? `/api/admin/users/${editUserId}` : '/api/admin/users';
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowForm(false);
        setEditUserId(null);
        setFormData({ name: '', email: '', password: '', role: 'trainee', region: '', district: '' });
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.msg || 'Gagal menyimpan user');
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenPasswordModal = (user) => {
    setPasswordModalUser(user);
    setCustomPassword('');
    setShowCustomPassword(false);
    setPasswordSuccessMsg('');
  };

  const handleResetDefaultPassword = async () => {
    if (!passwordModalUser) return;
    if (!window.confirm(`Yakin ingin mereset password untuk ${passwordModalUser.name} ke default ("password123")?`)) return;
    
    setIsSubmittingPassword(true);
    setPasswordSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/users/${passwordModalUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'password123' })
      });
      if (res.ok) {
        setPasswordSuccessMsg('Password berhasil di-reset ke "password123"!');
        if (navigator.clipboard) {
          navigator.clipboard.writeText('password123').catch(() => {});
        }
      } else {
        const err = await res.json();
        alert(err.msg || 'Gagal mereset password');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSaveCustomPassword = async (e) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!customPassword || customPassword.trim().length < 4) {
      alert('Password baru minimal 4 karakter');
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/users/${passwordModalUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: customPassword.trim() })
      });
      if (res.ok) {
        setPasswordSuccessMsg(`Password baru untuk ${passwordModalUser.name} berhasil disimpan!`);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(customPassword.trim()).catch(() => {});
        }
        setCustomPassword('');
      } else {
        const err = await res.json();
        alert(err.msg || 'Gagal mengubah password');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleGenerateRandomPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generated = `Patriot${randomDigits}!`;
    setCustomPassword(generated);
    setShowCustomPassword(true);
  };

  const openAssign = (u) => {
    setSelectedUser(u);
    // Normalisasi jika masih ada data legacy dari DB
    const normalized = (u.assigned_topics || []).map(t => {
      if (t === 'Teknologi') return 'IT';
      if (t === 'Finance') return 'Keuangan';
      return t;
    });
    setSelectedTopics(Array.from(new Set(normalized)));
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleAssignTopics = async () => {
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/topics`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: selectedTopics })
      });
      if (res.ok) {
        setSelectedUser(null);
        setSelectedTopics([]);
        fetchUsers();
      }
    } catch (err) { console.error(err); }
  };

  const handleResetProgress = async (userId) => {
    if (!window.confirm('Yakin ingin mereset seluruh progress User ini?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-progress`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) alert('Progress berhasil di-reset');
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Yakin ingin menghapus User ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.msg || 'Gagal menghapus user');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-colors duration-500">
          <form onSubmit={handleSaveUser} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl p-8 space-y-4 shadow-2xl relative w-full max-w-2xl my-auto transition-colors duration-500">
          <h3 className="font-label-lg font-bold text-primary dark:text-white mb-2 transition-colors duration-500">
            {editUserId ? 'Edit Data User' : 'Register User Baru'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Nama Lengkap</label>
              <input required type="text" placeholder="Masukkan nama lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Email</label>
              <input required type="email" placeholder="contoh@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Regional (Provinsi)</label>
              <select 
                required 
                value={selectedProvId} 
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProvId(id);
                  const provName = provinces.find(p => p.id === id)?.name || '';
                  setFormData({...formData, region: provName, district: ''});
                }} 
                className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none"
              >
                <option value="" disabled hidden>Pilih Provinsi...</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Kabupaten/Kota</label>
              <select 
                required 
                value={formData.district} 
                onChange={e => setFormData({...formData, district: e.target.value})} 
                className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none disabled:bg-surface-container-high dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                disabled={!selectedProvId}
              >
                <option value="" disabled hidden>Pilih Kabupaten/Kota...</option>
                {regencies.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Akses / Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                <option value="trainee">Trainee (Hanya bisa akses materi)</option>
                <option value="co_admin">Co-Admin (Bisa akses materi & edit dashboard)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">
                {editUserId ? 'Ubah Password (Opsional)' : 'Password Akun'}
              </label>
              <div className="relative">
                <input 
                  type={showFormPassword ? 'text' : 'password'} 
                  placeholder={editUserId ? 'Kosongkan jika tidak ingin mengubah password' : 'Kosongkan untuk default: password123'} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full px-4 py-3 pr-12 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" 
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  title={showFormPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showFormPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant dark:text-slate-400 mt-1">
                {editUserId 
                  ? '*Biarkan kosong jika tidak ingin mengubah password user.' 
                  : 'Password default jika dikosongkan: password123'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-outline-variant dark:border-slate-600 rounded-full text-on-surface-variant dark:text-slate-300 font-bold text-sm hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors">Batal</button>
            <button type="submit" className="bg-primary dark:bg-yellow-500 text-on-primary dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 dark:hover:bg-yellow-400 transition-colors shadow-sm">Simpan</button>
          </div>
          </form>
        </div>,
        document.body
      )}

      {/* Modal Kelola Password (Reset & Edit) */}
      {passwordModalUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-colors duration-500">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative w-full max-w-md my-auto transition-colors duration-500">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-yellow-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">lock_reset</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                    Kelola Password User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {passwordModalUser.name} ({passwordModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Notification message */}
            {passwordSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="material-symbols-outlined text-lg shrink-0 text-emerald-600">check_circle</span>
                <div className="flex-1">
                  <p className="font-semibold">{passwordSuccessMsg}</p>
                </div>
              </div>
            )}

            {/* Section 1: Quick Reset Default */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Reset ke Default</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Kembalikan password ke: <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-primary dark:text-blue-400">password123</code></span>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingPassword}
                onClick={handleResetDefaultPassword}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>Reset ke password123</span>
              </button>
            </div>

            {/* Section 2: Custom New Password */}
            <form onSubmit={handleSaveCustomPassword} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Atau Buat Password Baru (Kustom)
                </label>
                <div className="relative">
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    placeholder="Ketik password baru..."
                    value={customPassword}
                    onChange={e => setCustomPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 outline-none text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showCustomPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-xs text-primary dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">casino</span>
                  <span>Acak Password</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPassword || !customPassword.trim()}
                    className="px-5 py-2 bg-primary dark:bg-yellow-500 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-primary/90 dark:hover:bg-yellow-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Simpan Password</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-colors duration-500">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl p-8 space-y-4 shadow-2xl relative w-full max-w-lg my-auto transition-colors duration-500">
          <h3 className="font-label-lg font-bold text-on-secondary-container dark:text-white transition-colors">
            Assign Topik untuk <span className="text-primary dark:text-blue-400">{selectedUser.name}</span>
          </h3>
          {allTopics.length === 0 ? (
            <p className="text-sm text-on-surface-variant dark:text-slate-400 italic">Belum ada topik. Tambahkan modul dengan field "Topic" terlebih dahulu di tab Dashboard & Modul.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTopics.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-primary dark:bg-slate-700 text-on-primary dark:text-white border-primary dark:border-slate-600'
                      : 'bg-white/50 dark:bg-slate-900/50 border-outline-variant dark:border-slate-600 text-on-surface dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-700/50'
                  }`}
                >
                  {selectedTopics.includes(topic) && <span className="mr-1">✓</span>}
                  {topic}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => { setSelectedUser(null); setSelectedTopics([]); }} className="px-6 py-2.5 border border-outline dark:border-slate-600 text-on-secondary-container dark:text-slate-300 rounded-full text-sm font-bold hover:bg-secondary-container/80 dark:hover:bg-slate-700/50 transition-colors">Batal</button>
            <button onClick={handleAssignTopics} className="bg-secondary dark:bg-yellow-500 text-on-secondary dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-secondary/90 dark:hover:bg-yellow-400 transition-colors shadow-sm">Simpan Assignment</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Account Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-[#004A74]/10 via-[#004A74]/5 to-transparent dark:from-blue-900/30 dark:via-blue-900/10 dark:to-transparent border border-[#004A74]/20 dark:border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#004A74] text-white dark:bg-yellow-400 dark:text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Akun Administrator Aktif</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#004A74] text-white dark:bg-yellow-400 dark:text-slate-900 uppercase">
                {currentUserRole === 'admin' ? 'Super Admin' : 'Co-Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola keamanan kata sandi akun Admin yang sedang login saat ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMyPasswordModal(true)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-yellow-400 hover:border-primary dark:hover:border-yellow-400 text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-base text-primary dark:text-yellow-400">key</span>
          <span>Ubah Password Admin Saya</span>
        </button>
      </div>

      <ChangePasswordModal 
        isOpen={showMyPasswordModal} 
        onClose={() => setShowMyPasswordModal(false)} 
        userName="Administrator" 
      />

      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden hover:shadow-[0_10px_15px_-3px_rgba(0,33,71,0.05)] transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/40 dark:bg-slate-900/40 border-b border-white/50 dark:border-slate-700/50 backdrop-blur-lg whitespace-nowrap transition-colors duration-500">
              <tr>
                <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-300">Nama</th>
                <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-300 text-center">Role</th>
                <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-300 hidden md:table-cell">Email</th>
                <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-300 hidden md:table-cell">Topik Akses</th>
                <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-surface-container-high dark:border-slate-700/50 hover:bg-surface-container-low/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-2 sm:px-4">
                    <div className="font-medium text-primary dark:text-blue-300 whitespace-normal break-words min-w-[90px] text-sm sm:text-base cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => handleOpenForm(u)}>{u.name}</div>
                    <div className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400">{u.region} — {u.district}</div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <span className={`inline-block whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${u.role === 'co_admin' ? 'bg-[#004A74]/10 text-[#004A74] border-[#004A74]/20 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-400/30' : 'bg-[#f4c724]/20 text-[#8a6e00] border-[#f4c724]/40 dark:bg-yellow-400/20 dark:text-yellow-400 dark:border-yellow-400/30'}`}>
                      {u.role === 'co_admin' ? 'Co-Admin' : 'Trainee'}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-sm text-on-surface-variant dark:text-slate-400 hidden md:table-cell">{u.email}</td>
                  <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {u.assigned_topics.map((t, idx) => {
                        const displayTopic = t === 'Teknologi' ? 'IT' : (t === 'Finance' ? 'Keuangan' : t);
                        return (
                          <span key={idx} className="bg-[#004A74] dark:bg-[#004A74]/50 dark:border dark:border-[#004A74] text-white px-3 py-1 rounded-full text-[11px] font-medium tracking-wide shadow-sm">{displayTopic}</span>
                        );
                      })}
                      {u.assigned_topics.length === 0 && <span className="text-xs text-on-surface-variant dark:text-slate-400 italic">Belum ada topik</span>}
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                    <button onClick={() => openAssign(u)} className="text-tertiary dark:text-blue-400 hover:bg-tertiary dark:hover:bg-blue-400/20 hover:text-on-tertiary dark:hover:text-blue-300 p-1 sm:p-2 rounded-full transition-colors" title="Assign Topics">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">assignment</span>
                    </button>
                    <button onClick={() => handleOpenForm(u)} className="text-secondary dark:text-yellow-400 hover:bg-secondary-container dark:hover:bg-yellow-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Edit Data User">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleOpenPasswordModal(u)} className="text-amber-600 dark:text-yellow-400 hover:bg-amber-100 dark:hover:bg-yellow-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Ubah / Reset Password">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">lock_reset</span>
                    </button>
                    <button onClick={() => handleResetProgress(u.id)} className="text-error dark:text-red-400 hover:bg-error-container dark:hover:bg-red-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Reset Progress Materi">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">restart_alt</span>
                    </button>
                    {currentUserRole === 'admin' && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-error dark:text-red-400 hover:bg-error-container dark:hover:bg-red-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Delete User">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-on-surface-variant">Belum ada User</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
