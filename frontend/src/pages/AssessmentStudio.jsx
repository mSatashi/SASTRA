import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  FileCheck, 
  Copy, 
  Check, 
  Download,
  Flame,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function AssessmentStudio({ onGoToGrading }) {
  const [formData, setFormData] = useState({
    subject: 'Informatika & Kecerdasan Artifisial',
    grade_level: 'Fase D (Kelas 7 SMP)',
    topic: 'Konsep Dasar Algoritma & Berpikir Komputasional',
    duration_minutes: 80,
    multiple_choice_count: 5,
    essay_count: 3,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('activities'); // 'activities', 'questions', 'lkpd'
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      title: 'Koding & AI (SMP)',
      subject: 'Informatika & Kecerdasan Artifisial',
      grade: 'Fase D (Kelas 7 SMP)',
      topic: 'Etika Penggunaan Kecerdasan Artifisial dan Dekomposisi Masalah'
    },
    {
      title: 'IPA Sains Kontekstual',
      subject: 'Ilmu Pengetahuan Alam',
      grade: 'Fase D (Kelas 8 SMP)',
      topic: 'Sistem Pencernaan & Keseimbangan Nutrisi Makanan Sehat'
    },
    {
      title: 'Literasi Kritis (SMA)',
      subject: 'Bahasa Indonesia',
      grade: 'Fase E (Kelas 10 SMA)',
      topic: 'Menganalisis Akurasi Fakta dan Opini dalam Teks Berita Digital'
    }
  ];

  const handleApplyPreset = (p) => {
    setFormData(prev => ({
      ...prev,
      subject: p.subject,
      grade_level: p.grade,
      topic: p.topic
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.generateAssessment(formData);
      setResult(data);
    } catch (err) {
      alert('Gagal menghasilkan materi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLKPD = () => {
    if (!result?.printable_lkpd_markdown) return;
    navigator.clipboard.writeText(result.printable_lkpd_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-purple">Fitur 1</span>
          <span className="badge badge-indigo">Permendikdasmen No. 13 Tahun 2025</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Interactive Assessment & Content Studio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Rancang modul ajar interaktif, pertanyaan pemantik kritis, paket kuis (PG + Esai Penalaran), dan LKPD berbasis *Deep Learning*.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: Form Parameters */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Sparkles size={18} color="#a855f7" />
            <h3 style={{ fontSize: '1.05rem' }}>Parameter Modul Ajar</h3>
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
              PILIH TEMPLATE CEPAT:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ fontWeight: '600', color: '#c084fc' }}>{p.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.topic}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Mata Pelajaran</label>
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jenjang / Fase</label>
              <input
                type="text"
                className="form-input"
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Topik Pembelajaran</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Jumlah Soal PG</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={formData.multiple_choice_count}
                  onChange={(e) => setFormData({ ...formData, multiple_choice_count: parseInt(e.target.value) || 5 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Soal Esai</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-input"
                  value={formData.essay_count}
                  onChange={(e) => setFormData({ ...formData, essay_count: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alokasi Waktu (Menit)</label>
              <input
                type="number"
                min="30"
                max="180"
                className="form-input"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 80 })}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Menyusun Modul & Kuis...' : 'Generate Modul & Kuis Interaktif'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Output Showcase */}
        <div>
          {!result && !loading && (
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
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                marginBottom: '16px'
              }}>
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Siap Menyusun Asesmen Otentik</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.88rem', marginBottom: '18px' }}>
                Klik tombol "Generate Modul & Kuis Interaktif" atau pilih salah satu preset di sebelah kiri untuk menghasilkan modul Deep Learning lengkap.
              </p>
              <span className="badge badge-indigo">Otomatisasi Modul Ajar + Kuis PG & Esai + LKPD</span>
            </div>
          )}

          {loading && (
            <div className="glass-panel" style={{
              padding: '80px 30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="agent-indicator-pulse" style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                marginBottom: '20px',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)'
              }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Agent Sedang Berpikir...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Menyelaraskan materi dengan standar <strong>Permendikdasmen No. 13 Tahun 2025</strong>, merumuskan pertanyaan pemantik kritis, dan menyusun kuis penalaran berbobot...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="glass-panel" style={{ padding: '26px' }}>
              {/* Header result */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-emerald">Berhasil Dibuat</span>
                    <span className="badge badge-purple">{result.grade_level}</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem' }}>{result.topic}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mata Pelajaran: {result.subject}
                  </div>
                </div>

                <button onClick={handleCopyLKPD} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 12px' }}>
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin!' : 'Salin LKPD'}</span>
                </button>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <button
                  onClick={() => setActiveTab('activities')}
                  style={{
                    background: activeTab === 'activities' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    color: activeTab === 'activities' ? '#818cf8' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Modul & Deep Learning
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  style={{
                    background: activeTab === 'questions' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    color: activeTab === 'questions' ? '#818cf8' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Paket Kuis ({result.questions?.length || 0} Soal)
                </button>
                <button
                  onClick={() => setActiveTab('lkpd')}
                  style={{
                    background: activeTab === 'lkpd' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    color: activeTab === 'lkpd' ? '#818cf8' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Pratinjau LKPD Siswa
                </button>
              </div>

              {/* Tab 1: Activities & Inquiry Prompts */}
              {activeTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Objectives */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#818cf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} />
                      <span>TUJUAN PEMBELAJARAN (CAPAIAN)</span>
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {result.learning_objectives?.map((obj, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Trigger Questions */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lightbulb size={16} />
                      <span>PERTANYAAN PEMANTIK KRITIS (INQUIRY-BASED)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {result.trigger_questions?.map((tq, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: '#fef3c7', fontStyle: 'italic' }}>
                          "{tq}"
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Phases Timeline */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      3 FASE PEMBELAJARAN MENDALAM:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.activities?.map((act, i) => (
                        <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#ffffff' }}>
                              {act.phase_name}
                            </span>
                            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                              {act.duration_minutes} Menit
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            {act.activity_description}
                          </p>
                          {act.teacher_prompts?.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                              💡 Pemantik Guru: {act.teacher_prompts.join(' | ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Questions List */}
              {activeTab === 'questions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {result.questions?.map((q) => (
                    <div key={q.id} style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', color: '#818cf8', fontSize: '0.9rem' }}>#{q.id}</span>
                          <span className={q.type === 'multiple_choice' ? 'badge badge-indigo' : 'badge badge-amber'} style={{ fontSize: '0.68rem' }}>
                            {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai Penalaran'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bobot: {q.points} Poin</span>
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '10px', color: '#ffffff' }}>
                        {q.question}
                      </div>

                      {q.options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '10px' }}>
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              background: opt.startsWith(q.correct_answer) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                              border: opt.startsWith(q.correct_answer) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                              fontSize: '0.82rem',
                              color: opt.startsWith(q.correct_answer) ? '#34d399' : 'var(--text-secondary)'
                            }}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.05)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: '#818cf8' }}>Kunci/Rubrik:</strong> {q.correct_answer}
                        <div style={{ marginTop: '4px' }}>
                          <strong style={{ color: 'var(--text-muted)' }}>Penjelasan Deep Learning:</strong> {q.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Printable LKPD */}
              {activeTab === 'lkpd' && (
                <div>
                  <div style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '16px'
                  }}>
                    {result.printable_lkpd_markdown}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={handleCopyLKPD} className="btn-secondary">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Tersalin' : 'Salin Teks LKPD'}</span>
                    </button>
                    {onGoToGrading && (
                      <button onClick={onGoToGrading} className="btn-primary">
                        <span>Lanjut ke Meja Koreksi (Vision Grader) &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
