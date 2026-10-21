import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  Award, 
  TrendingUp, 
  Heart, 
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportGenerator({ students, preselectedStudentId }) {
  const [selectedStudent, setSelectedStudent] = useState(preselectedStudentId || students?.[0]?.id || 'std_01');
  const [subject, setSubject] = useState('Informatika & Kecerdasan Artifisial');
  const [semester, setSemester] = useState('Semester 1 (Ganjil)');
  const [academicYear, setAcademicYear] = useState('2025/2026');

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedStudent(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.generateReport({
        student_id: selectedStudent,
        subject: subject,
        semester: semester,
        academic_year: academicYear
      });
      setReport(res);
    } catch (err) {
      alert('Gagal menyusun narasi rapor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNarrative = () => {
    if (!report?.narrative_achievement) return;
    navigator.clipboard.writeText(report.narrative_achievement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStudentObj = students?.find(s => s.id === selectedStudent);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-emerald">Fitur 3B</span>
          <span className="badge badge-indigo">Permendikdasmen No. 13 Tahun 2025</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Generator Narasi Rapor Akhir Semester</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Otomasi penyusunan deskripsi capaian pembelajaran yang otentik, kaya konteks, dan empatik berdasarkan riwayat nilai siswa sepanjang semester.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: Form & Student Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <FileText size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem' }}>Parameter Laporan Rapor</h3>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Pilih Peserta Didik</label>
              <select
                className="form-select"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                {students?.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nisn}) - {s.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mata Pelajaran</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="form-select"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                  <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tahun Ajaran</label>
                <input
                  type="text"
                  className="form-input"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Riwayat Nilai Siswa Ringkas */}
            {currentStudentObj && (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  DATA ASESMEN TERSEDIA ({currentStudentObj.grades?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentStudentObj.grades?.map((g, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>• {g.assessment_title.slice(0, 32)}...</span>
                      <strong style={{ color: g.score >= 85 ? '#34d399' : '#818cf8' }}>{g.score}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              disabled={loading}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Menyusun Narasi Rapor...' : 'Generate Narasi Rapor Semester'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Official Report Card Preview */}
        <div>
          {!report && !loading && (
            <div className="glass-panel" style={{
              padding: '60px 30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                marginBottom: '16px'
              }}>
                <FileText size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Format Pelaporan Permendikdasmen No. 13/2025</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.88rem', marginBottom: '16px' }}>
                Pilih siswa dan mata pelajaran di sebelah kiri untuk menghasilkan draf rapor yang memuat evaluasi per kompetensi, narasi capaian otentik, dan rekomendasi personal.
              </p>
              <span className="badge badge-emerald">Siap Cetak & Ekspor Resmi</span>
            </div>
          )}

          {loading && (
            <div className="glass-panel" style={{
              padding: '80px 30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div className="agent-indicator-pulse" style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '20px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
              }}>
                <Sparkles size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Academic Report Agent Bekerja...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Mengagregasi riwayat formatif & sumatif, mendeteksi materi yang telah dikuasai dan yang butuh remedial, lalu merangkai narasi rapor empatik...
              </p>
            </div>
          )}

          {report && !loading && (
            <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', color: '#1e293b' }}>
              {/* Top Action Bar (Print / Copy) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>
                  PRATINJAU DOKUMEN RAPOR RESMI
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCopyNarrative}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', color: '#1e293b', borderColor: '#cbd5e1' }}
                  >
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin' : 'Salin Narasi'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', background: '#0f172a' }}
                  >
                    <Printer size={14} />
                    <span>Cetak Lembar Rapor</span>
                  </button>
                </div>
              </div>

              {/* Rapor Header Identity */}
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                  LAPORAN HASIL CAPAIAN KOMPETENSI PESERTA DIDIK
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                  Standar Permendikdasmen No. 13 Tahun 2025 • Pendekatan Pembelajaran Mendalam
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div><strong>Nama Peserta Didik:</strong> {report.student_name}</div>
                <div><strong>Kelas / Fase:</strong> {report.class_name} (Fase D)</div>
                <div><strong>Mata Pelajaran:</strong> {report.subject}</div>
                <div><strong>Semester / T.A.:</strong> {report.semester} - {report.academic_year}</div>
              </div>

              {/* Nilai Akhir & Predikat */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: '#f1f5f9',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>NILAI AKHIR SEMESTER</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
                    {report.final_score}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>PREDIKAT CAPAIAN</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2563eb' }}>
                    {report.letter_grade}
                  </div>
                </div>
              </div>

              {/* Capaian Kompetensi Table */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  1. REKAP CAPAIAN TUJUAN PEMBELAJARAN (TP)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.competency_evaluations?.map((comp, idx) => (
                    <div key={idx} style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>{comp.topic}</strong>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: comp.mastery_status.includes('Sangat Baik') ? '#dcfce7' : comp.mastery_status.includes('Tercapai') ? '#e0e7ff' : '#fef3c7',
                          color: comp.mastery_status.includes('Sangat Baik') ? '#15803d' : comp.mastery_status.includes('Tercapai') ? '#4338ca' : '#b45309'
                        }}>
                          {comp.mastery_status} ({comp.average_score})
                        </span>
                      </div>
                      <div style={{ color: '#475569' }}>{comp.evidence_notes}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Narrative Achievement (Official Rapor Description) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  2. DESKRIPSI CAPAIAN KOMPETENSI (NARASI RESMI)
                </div>
                <div style={{
                  padding: '16px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  color: '#166534'
                }}>
                  {report.narrative_achievement}
                </div>
              </div>

              {/* Section 3: Recommendation & Reflection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
                    <Compass size={15} />
                    <span>Rekomendasi Tindak Lanjut Guru</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                    {report.recommendation_followup}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8', marginBottom: '6px' }}>
                    <Heart size={15} />
                    <span>Catatan Kesadaran Belajar (*Mindful*)</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#581c87', lineHeight: '1.5' }}>
                    {report.character_reflection}
                  </div>
                </div>
              </div>

              {/* Teacher Signature Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
                <div>
                  Mengetahui,<br />
                  <strong>Orang Tua / Wali Murid</strong>
                  <div style={{ height: '55px' }} />
                  (...........................................)
                </div>
                <div style={{ textAlign: 'right' }}>
                  Guru Pengampu Mata Pelajaran,<br />
                  <strong>Bpk/Ibu Guru Kelas 7A</strong>
                  <div style={{ height: '55px' }} />
                  (...........................................)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
