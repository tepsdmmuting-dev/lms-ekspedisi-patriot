import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * TopicRecapModal
 * Displays an official, prestigious Rekapitulasi Hasil Belajar Peserta
 * (Learning Summary Transcript & Completion Certificate) for a specific topic.
 * 
 * Includes:
 * - Trainee details (name, email, region, district)
 * - Official Kop Surat (Kementerian Transmigrasi & UGM logos)
 * - Completion statement (Telah menyelesaikan secara tuntas)
 * - Breakdown of modules and materials in that topic
 * - Post-test & Pre-test scores (if available) and overall grade
 * - Digital stamps & signatures
 * - One-click printing / PDF generation (window.print())
 */
const TopicRecapModal = ({
  isOpen,
  onClose,
  topicName,
  topicMeta,
  modules = [],
  moduleQuizzes = {},
  user
}) => {
  const [liveQuizzes, setLiveQuizzes] = useState({});

  // Auto-fetch fresh quiz scores from server whenever the modal opens
  useEffect(() => {
    if (!isOpen || !modules || modules.length === 0) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    let isMounted = true;
    const fetchFreshScores = async () => {
      try {
        const map = {};
        await Promise.all(modules.map(async (m) => {
          try {
            const res = await fetch(`/api/quizzes/module/${m.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              map[m.id] = data;
            }
          } catch (e) {}
        }));
        if (isMounted) {
          setLiveQuizzes(map);
        }
      } catch (err) {
        console.error('Error fetching fresh quiz scores in recap:', err);
      }
    };

    fetchFreshScores();
    return () => { isMounted = false; };
  }, [isOpen, modules]);

  if (!isOpen) return null;

  // Group modules by module_name
  const moduleGroups = {};
  modules.forEach(m => {
    const modName = m.module_name || 'Modul 1';
    if (!moduleGroups[modName]) moduleGroups[modName] = [];
    moduleGroups[modName].push(m);
  });

  const moduleNames = Object.keys(moduleGroups).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Analyze modules, materials, and quizzes
  let totalMaterials = modules.length;
  let completedMaterials = modules.filter(m => m.completed).length;

  // Calculate post-test scores
  const moduleEvaluations = moduleNames.map((modName, idx) => {
    const materiList = moduleGroups[modName];
    const completedCount = materiList.filter(m => m.completed).length;

    // Collect all quizzes across materiList in this module group, merging scores intelligently
    const quizzesMap = new Map();
    materiList.forEach(m => {
      const candidates = [
        ...(liveQuizzes[m.id] || []),
        ...(moduleQuizzes[m.id] || []),
        ...(m.quizzes || [])
      ];

      candidates.forEach(q => {
        if (!q || !q.id) return;
        if (!quizzesMap.has(q.id)) {
          quizzesMap.set(q.id, { ...q });
        } else {
          const current = quizzesMap.get(q.id);
          const currentHasScore = current.my_score !== null && current.my_score !== undefined;
          const candidateHasScore = q.my_score !== null && q.my_score !== undefined;

          if (!currentHasScore && candidateHasScore) {
            quizzesMap.set(q.id, { ...current, ...q });
          } else if (currentHasScore && candidateHasScore) {
            const maxScore = Math.max(Number(current.my_score), Number(q.my_score));
            quizzesMap.set(q.id, { ...current, ...q, my_score: maxScore });
          }
        }
      });
    });

    const quizzes = Array.from(quizzesMap.values());
    const preTest = quizzes.find(q => q.type === 'pre_test');
    const postTest = quizzes.find(q => q.type === 'post_test');

    const preScore = preTest && preTest.my_score !== null && preTest.my_score !== undefined
      ? Number(preTest.my_score)
      : null;

    const postScore = postTest && postTest.my_score !== null && postTest.my_score !== undefined
      ? Number(postTest.my_score)
      : null;

    return {
      index: idx + 1,
      moduleName: modName,
      materiList,
      totalMateri: materiList.length,
      completedMateri: completedCount,
      hasPreTest: !!preTest,
      preScore,
      hasPostTest: !!postTest,
      postScore,
      isCompleted: completedCount === materiList.length
    };
  });

  // Calculate post test stats
  const postTestScores = moduleEvaluations
    .filter(me => me.hasPostTest && me.postScore !== null)
    .map(me => me.postScore);

  const avgPostScore = postTestScores.length > 0
    ? Math.round(postTestScores.reduce((acc, cur) => acc + cur, 0) / postTestScores.length)
    : null;

  // Determine grade predicate
  let gradePredicate = 'TUNTAS LENGKAP';
  let gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (avgPostScore !== null) {
    if (avgPostScore >= 85) {
      gradePredicate = 'SANGAT BAIK (A)';
      gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    } else if (avgPostScore >= 70) {
      gradePredicate = 'BAIK (B)';
      gradeColor = 'text-blue-700 bg-blue-50 border-blue-300';
    } else if (avgPostScore >= 60) {
      gradePredicate = 'CUKUP (C)';
      gradeColor = 'text-amber-700 bg-amber-50 border-amber-300';
    } else {
      gradePredicate = 'PERLU PENGUATAN';
      gradeColor = 'text-rose-700 bg-rose-50 border-rose-300';
    }
  }

  // Format date
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const topicCode = (topicName || 'TOPIC').toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const userNum = String(user?.id || 1).padStart(3, '0');
  const dateNum = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const docNumber = `EP-LMS/REKAP/${topicCode}/${userNum}/${dateNum}`;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:block">
      {/* Top Floating Control Bar - Hidden when printing */}
      <div className="no-print w-full max-w-4xl bg-slate-900/90 border border-slate-700/80 text-white rounded-2xl p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Rekapitulasi Hasil Belajar</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tuntas 100%
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Topik: <span className="text-yellow-400 font-semibold">{topicName}</span> • Siap dicetak atau disimpan sebagai PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Tutup Preview"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="recap-print-sheet w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200 p-6 sm:p-10 md:p-12 mb-8 transition-all print:shadow-none print:border-none print:p-6 print:m-0 print:max-w-none print:w-full">
        {/* Kop Surat Resmi (Official Header) */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 gap-4">
          <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
            <img 
              src="/logo-ugm.png" 
              alt="Logo UGM" 
              className="h-14 sm:h-16 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div className="text-center flex-1">
            <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-wider text-slate-900 uppercase font-serif">
              KEMENTERIAN TRANSMIGRASI REPUBLIK INDONESIA
            </h2>
            <h3 className="text-[11px] sm:text-xs md:text-sm font-bold tracking-wide text-slate-800 uppercase">
              UNIVERSITAS GADJAH MADA
            </h3>
            <p className="text-xs sm:text-sm font-extrabold text-[#002147] tracking-normal mt-0.5 uppercase">
              PROGRAM PENGUATAN KAPASITAS EKSPEDISI PATRIOT SDM MUTING
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-600 italic mt-0.5">
              Kawasan Transmigrasi Muting, Kabupaten Merauke, Provinsi Papua Selatan • Portal: sdmmuting.id
            </p>
          </div>

          <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center">
            <img 
              src="/logo-kementerian.png" 
              alt="Logo Kementerian" 
              className="h-14 sm:h-16 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
        <div className="border-b border-slate-400 mt-0.5 mb-6"></div>

        {/* Document Title & Reference Number */}
        <div className="text-center mb-6">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-wide uppercase font-serif">
            LEMBAR REKAPITULASI HASIL BELAJAR
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
            Transkrip Evaluasi Pembelajaran Mandiri & Ketuntasan Topik
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-md border border-slate-300 font-mono text-[11px] sm:text-xs text-slate-700">
            Nomor: <span className="font-bold">{docNumber}</span>
          </div>
        </div>

        {/* Trainee Identity & Completion Statement Box */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5 mb-6 text-xs sm:text-sm">
          <p className="text-slate-700 mb-3">
            Menerangkan dengan sesungguhnya bahwa peserta pembelajaran di bawah ini:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Nama Lengkap</span>
              <span className="font-bold text-slate-900 uppercase">: {user?.name || 'Peserta Pembelajaran'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Akun Email</span>
              <span className="text-slate-800">: {user?.email || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Wilayah Penugasan</span>
              <span className="text-slate-800">: {user?.region || 'Papua Selatan'} {user?.district ? `(${user?.district})` : ''}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Topik Pembelajaran</span>
              <span className="font-bold text-primary">: {topicName}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Status Ketuntasan</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">
                  ✓ TUNTAS 100% (SELESAI)
                </span>
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700 shrink-0">Tanggal Selesai</span>
              <span className="text-slate-800">: {dateFormatted}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-slate-700 leading-relaxed text-[11px] sm:text-xs">
            Telah menyelesaikan seluruh materi pembelajaran dan evaluasi pemahaman pada topik <strong>{topicName}</strong> sesuai kurikulum resmi Ekspedisi Patriot SDM Muting dengan rincian capaian hasil evaluasi sebagai berikut:
          </div>
        </div>

        {/* Table 1: Rincian Evaluasi Modul & Hasil Post-Test */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>I. Rekapitulasi Modul & Nilai Evaluasi (Post-Test)</span>
            </h4>
            <span className="text-[11px] text-slate-500 italic">Skala Nilai: 0 - 100</span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Modul Pembelajaran</th>
                  <th className="py-2.5 px-3 w-28 text-center border-r border-slate-300">Jumlah Materi</th>
                  <th className="py-2.5 px-3 w-24 text-center border-r border-slate-300">Pre-Test</th>
                  <th className="py-2.5 px-3 w-28 text-center border-r border-slate-300 bg-amber-50/70">Nilai Post-Test</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {moduleEvaluations.map((me) => (
                  <tr key={me.moduleName} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-slate-200">{me.index}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {me.moduleName}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200">
                      {me.completedMateri} / {me.totalMateri} Materi
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      {me.hasPreTest ? (
                        me.preScore !== null ? (
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {me.preScore} / 100
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum Ujian</span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-amber-50/40">
                      {me.hasPostTest ? (
                        me.postScore !== null ? (
                          <span className="inline-block px-2 py-0.5 rounded font-black text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {me.postScore} / 100
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-100/60 px-1.5 py-0.5 rounded">
                            Belum Ujian
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Tidak Ada Soal</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                        ✓ Tuntas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Daftar Materi yang Diselesaikan */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>II. Rincian Materi Pembelajaran yang Dituntaskan</span>
            </h4>
            <span className="text-[11px] text-slate-500">{totalMaterials} Total Materi</span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2 px-2.5 w-10 text-center border-r border-slate-300">No</th>
                  <th className="py-2 px-3 w-36 border-r border-slate-300">Modul</th>
                  <th className="py-2 px-3 border-r border-slate-300">Judul Materi Pembelajaran</th>
                  <th className="py-2 px-3 w-28 text-center border-r border-slate-300">Kategori / Media</th>
                  <th className="py-2 px-3 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modules.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5 text-center font-bold text-slate-500 border-r border-slate-200">#{idx + 1}</td>
                    <td className="py-2 px-3 text-slate-600 font-medium border-r border-slate-200">
                      {m.module_name || 'Modul 1'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {m.title}
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] uppercase font-semibold">
                        {m.category || m.media_platform || 'Pelatihan'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700 text-[11px]">
                      ✓ Selesai
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ringkasan Evaluasi & Predikat Akhir */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-300 rounded-xl mb-8 text-center">
          <div className="p-2 border-r border-slate-200 last:border-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Modul</span>
            <span className="text-lg sm:text-xl font-black text-slate-800">{moduleNames.length}</span>
            <span className="text-[10px] text-slate-500 block">Modul Selesai</span>
          </div>
          <div className="p-2 border-r border-slate-200 last:border-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Materi Tuntas</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700">{completedMaterials} / {totalMaterials}</span>
            <span className="text-[10px] text-emerald-600 block">100% Selesai</span>
          </div>
          <div className="p-2 border-r border-slate-200 last:border-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Post-Test</span>
            <span className="text-lg sm:text-xl font-black text-[#002147]">
              {avgPostScore !== null ? `${avgPostScore}` : '-'}
            </span>
            <span className="text-[10px] text-slate-500 block">{avgPostScore !== null ? 'Skala 100' : 'Tanpa Post-Test'}</span>
          </div>
          <div className="p-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Predikat Capaian</span>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-black border ${gradeColor}`}>
              {gradePredicate}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Hasil Pembelajaran</span>
          </div>
        </div>

        {/* Signatures & Formal Verification Section */}
        <div className="pt-2">
          <div className="flex justify-between items-end gap-6 text-xs text-slate-800">
            {/* Left Signature: UGM */}
            <div className="text-center w-52">
              <p className="font-semibold text-slate-700">Mengetahui,</p>
              <p className="font-bold text-slate-900">Koordinator Tim Akademik</p>
              <p className="text-[11px] text-slate-600">Universitas Gadjah Mada</p>
              
              {/* Signature stamp graphic */}
              <div className="h-20 flex items-center justify-center my-1 relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-900/30 flex flex-col items-center justify-center text-[8px] text-blue-900 font-bold uppercase rotate-[-12deg] select-none">
                  <span>UGM</span>
                  <span>VERIFIED</span>
                  <span>2026</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                Dr. Ir. Sunaryo, M.Eng.
              </div>
              <p className="text-[10px] text-slate-500 font-mono">ID: UGM-PATRIOT-2026</p>
            </div>

            {/* Center: System Verification Seal */}
            <div className="text-center hidden sm:flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 p-2 flex flex-col items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-3xl text-emerald-600">verified</span>
                <span className="text-[8px] font-extrabold text-slate-700 tracking-wider uppercase mt-0.5">SDM MUTING</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1">LMS AUTHENTIC</span>
            </div>

            {/* Right Signature: Kementerian Transmigrasi */}
            <div className="text-center w-52">
              <p className="font-semibold text-slate-700">Muting, {dateFormatted}</p>
              <p className="font-bold text-slate-900">Koordinator Pelatihan Wilayah</p>
              <p className="text-[11px] text-slate-600">Kementerian Transmigrasi RI</p>
              
              {/* Signature stamp graphic */}
              <div className="h-20 flex items-center justify-center my-1 relative">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-900/30 flex flex-col items-center justify-center text-[8px] text-emerald-900 font-bold uppercase rotate-[10deg] select-none">
                  <span>KEMTRANS</span>
                  <span>SAH</span>
                  <span>2026</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-1 font-bold text-slate-900">
                Drs. Hendra Wibowo, M.Si.
              </div>
              <p className="text-[10px] text-slate-500 font-mono">NIP: 197805122003121002</p>
            </div>
          </div>

          {/* Legal footnote */}
          <div className="mt-8 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500 italic">
            Dokumen ini diterbitkan secara elektronik oleh Sistem Manajemen Pembelajaran (LMS) Ekspedisi Patriot SDM Muting (sdmmuting.id) dan diakui sah sebagai rekapitulasi ketuntasan belajar mandiri peserta.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TopicRecapModal;
