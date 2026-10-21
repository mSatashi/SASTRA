import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  TrendingUp, 
  FileText, 
  Award, 
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function StudentTracker({ students, onSelectStudentForReport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const filteredStudents = students?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nisn.includes(searchTerm)
  ) || [];

  const calculateAverage = (grades) => {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.score, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-indigo">Fitur 3A</span>
          <span className="badge badge-emerald">Buku Nilai Digital</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Buku Nilai & Pelacak Perkembangan Siswa</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Pantau akumulasi nilai formatif & sumatif secara berkala, deteksi kebutuhan intervensi remedial, dan siapkan data untuk rapor semester.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>Rombel Aktif:</span>
          <span className="badge badge-indigo">Kelas 7A — Fase D (SMP)</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>T.A. 2025/2026</span>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama atau NISN siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', paddingRight: '12px' }}
          />
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700' }}>NISN & Nama Siswa</th>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700' }}>Kelas</th>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700' }}>Asesmen Diselesaikan</th>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700' }}>Rerata Nilai</th>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700' }}>Status Capaian</th>
              <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '700', textAlign: 'right' }}>Aksi Guru</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => {
              const avg = calculateAverage(s.grades);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '700', color: '#ffffff' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NISN: {s.nisn}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                    {s.class_name}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge badge-purple">
                      {s.grades?.length || 0} Tugas & Kuis
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', color: avg >= 85 ? '#34d399' : avg >= 75 ? '#818cf8' : '#fbbf24' }}>
                      {avg}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {avg >= 85 ? (
                      <span className="badge badge-emerald">Tercapai Sangat Baik</span>
                    ) : avg >= 75 ? (
                      <span className="badge badge-indigo">Tercapai</span>
                    ) : (
                      <span className="badge badge-amber">Perlu Pendampingan</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedStudentDetail(s)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      >
                        <Eye size={13} />
                        <span>Riwayat</span>
                      </button>
                      <button
                        onClick={() => onSelectStudentForReport(s.id)}
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        <FileText size={13} />
                        <span>Buat Rapor</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Student Detail Modal Drawer */}
      {selectedStudentDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: '6px' }}>Riwayat Asesmen Siswa</span>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedStudentDetail.name}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  NISN: {selectedStudentDetail.nisn} | {selectedStudentDetail.class_name}
                </div>
              </div>
              <button onClick={() => setSelectedStudentDetail(null)} className="btn-secondary" style={{ padding: '6px 10px' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedStudentDetail.grades?.map((g, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#ffffff' }}>{g.assessment_title}</span>
                    <span style={{ fontWeight: '800', color: g.score >= 85 ? '#34d399' : '#818cf8', fontSize: '0.95rem' }}>
                      {g.score} / {g.max_score}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Topik: {g.topic} • Tanggal: {g.date}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedStudentDetail(null)} className="btn-secondary">
                Tutup
              </button>
              <button
                onClick={() => {
                  const id = selectedStudentDetail.id;
                  setSelectedStudentDetail(null);
                  onSelectStudentForReport(id);
                }}
                className="btn-primary"
              >
                <FileText size={16} />
                <span>Lanjut ke Generator Rapor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
