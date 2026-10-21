import React, { useState } from 'react';
import { 
  ScanLine, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Save, 
  Eye, 
  Sparkles,
  FileCheck2,
  FileText,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function VisionGrader({ students, onGradeSaved }) {
  const [selectedStudent, setSelectedStudent] = useState(students?.[0]?.id || 'std_01');
  const [assignmentTitle, setAssignmentTitle] = useState('Asesmen Formatif: Berpikir Komputasional & AI');
  const [subject, setSubject] = useState('Informatika');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSample, setIsSample] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editedScores, setEditedScores] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setIsSample(false);
      setResult(null);
      setSavedSuccess(false);
    }
  };

  const handleLoadSample = () => {
    setIsSample(true);
    setFile(null);
    setPreviewUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80');
    setResult(null);
    setSavedSuccess(false);
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const studentObj = students?.find(s => s.id === selectedStudent);
      const studentName = studentObj ? studentObj.name : 'Ahmad Fauzi';

      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('student_id', selectedStudent);
      formData.append('student_name', studentName);
      formData.append('assignment_title', assignmentTitle);
      formData.append('subject', subject);

      const res = await api.gradeSubmission(formData);
      setResult(res);

      // Inisialisasi edited scores
      const initial = {};
      res.graded_questions.forEach(q => {
        initial[q.question_number] = q.score;
      });
      setEditedScores(initial);

    } catch (err) {
      alert('Gagal mengevaluasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (qNum, val) => {
    setEditedScores(prev => ({
      ...prev,
      [qNum]: parseFloat(val) || 0
    }));
  };

  const handleSaveToGradebook = () => {
    setSavedSuccess(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    if (onGradeSaved) onGradeSaved();
  };

  const currentTotal = Object.values(editedScores).reduce((a, b) => a + b, 0);
  const maxPossible = result ? result.max_possible_score : 100;
  const currentPercentage = maxPossible > 0 ? Math.round((currentTotal / maxPossible) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-amber">Fitur 2</span>
          <span className="badge badge-indigo">Vision OCR Multi-Modal</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Multi-Modal Vision OCR Grader</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Koreksi instan lembar jawaban pilihan ganda dan esai tulisan tangan menggunakan AI Vision. Dilengkapi analisis penalaran semantik dan umpan balik personal.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column: Upload / Scanned Document */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScanLine size={18} color="#fbbf24" />
              <span>Unggah Lembar Jawaban Siswa</span>
            </h3>
            <button
              onClick={handleLoadSample}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            >
              <Sparkles size={13} color="#fbbf24" />
              <span>Gunakan Contoh Soal</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Siswa</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Mata Pelajaran</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Judul Asesmen</label>
              <input
                type="text"
                className="form-input"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Dropzone */}
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            marginBottom: '18px',
            position: 'relative'
          }}>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              style={{
                opacity: 0,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
            />
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Pratinjau Lembar Jawaban"
                  style={{
                    maxHeight: '220px',
                    width: '100%',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600' }}>
                  {isSample ? '✓ Contoh Lembar Jawaban Siap (Tulisan Tangan)' : '✓ Berkas Berhasil Dimuat'}
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud size={38} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '4px' }}>
                  Tarik & Lepas Foto Lembar Jawaban ke Sini
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Mendukung foto JPG, PNG, atau scan PDF tulisan tangan
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEvaluate}
            disabled={(!file && !isSample) || loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            <ScanLine size={16} />
            <span>{loading ? 'Agent Sedang Membaca & Mengoreksi...' : 'Mulai Evaluasi & Koreksi AI'}</span>
          </button>
        </div>

        {/* Right Column: Grading Results & Feedback */}
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
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                marginBottom: '16px'
              }}>
                <FileCheck2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Meja Koreksi Digital</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.88rem', marginBottom: '16px' }}>
                Pilih atau unggah lembar jawaban siswa di samping, lalu tekan tombol koreksi. Agen akan mengenali tulisan tangan, menghitung skor PG, dan menilai esai secara kualitatif.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-amber">Auto-Score PG</span>
                <span className="badge badge-indigo">Rubrik Esai Mendalam</span>
                <span className="badge badge-emerald">Umpan Balik Personal</span>
              </div>
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
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '20px',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)'
              }}>
                <ScanLine size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Vision OCR Agent Bekerja...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Mengekstrak tulisan tangan siswa, mencocokkan pola lembar jawaban, dan menganalisis struktur penalaran esai berdasarkan rubrik...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="glass-panel" style={{ padding: '26px' }}>
              {/* Score Summary Banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '22px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    HASIL EVALUASI SISWA: {result.student_name}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
                    Skor: {currentTotal} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {maxPossible}</span>
                    <span style={{ fontSize: '1.2rem', color: '#34d399', marginLeft: '12px' }}>
                      ({currentPercentage}%)
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                    Tingkat Akurasi OCR: {Math.round(result.ocr_confidence * 100)}%
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Human-in-the-Loop Aktif
                  </div>
                </div>
              </div>

              {/* General Summary Feedback */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: '700', color: '#818cf8', marginBottom: '4px', fontSize: '0.8rem' }}>
                  CATATAN EVALUATOR OTONOM:
                </div>
                {result.summary_feedback}
              </div>

              {/* Question Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  RINCIAN PENILAIAN PER NOMOR SOAL:
                </div>

                {result.graded_questions?.map((q) => (
                  <div key={q.question_number} style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: '#ffffff' }}>Soal #{q.question_number}</span>
                        <span className={q.question_type === 'multiple_choice' ? 'badge badge-indigo' : 'badge badge-purple'} style={{ fontSize: '0.68rem' }}>
                          {q.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai Terbuka'}
                        </span>
                        {q.is_correct === true && <span className="badge badge-emerald">Benar</span>}
                        {q.is_correct === false && <span className="badge badge-rose">Salah</span>}
                      </div>

                      {/* Editable Score Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Skor Guru:</span>
                        <input
                          type="number"
                          min="0"
                          max={q.max_score}
                          step="0.5"
                          value={editedScores[q.question_number] ?? q.score}
                          onChange={(e) => handleScoreChange(q.question_number, e.target.value)}
                          style={{
                            width: '65px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid var(--accent-primary)',
                            color: '#ffffff',
                            fontWeight: '700',
                            textAlign: 'center',
                            fontSize: '0.85rem'
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ {q.max_score}</span>
                      </div>
                    </div>

                    {/* Transcribed Answer */}
                    <div style={{ marginBottom: '8px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Jawaban Terbaca (OCR): </span>
                      <strong style={{ color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {q.extracted_student_answer}
                      </strong>
                    </div>

                    {/* Reasoning Analysis */}
                    {q.reasoning_analysis && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <strong>Analisis Penalaran:</strong> {q.reasoning_analysis}
                      </div>
                    )}

                    {/* Feedback For Student */}
                    {q.feedback_for_student && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'rgba(20, 184, 166, 0.08)',
                        borderLeft: '3px solid #14b8a6',
                        fontSize: '0.78rem',
                        color: '#ccfbf1'
                      }}>
                        <strong>Umpan Balik Siswa:</strong> "{q.feedback_for_student}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Button: Commit to Gradebook */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: savedSuccess ? '#34d399' : 'var(--text-muted)' }}>
                  {savedSuccess ? '✓ Nilai & feedback berhasil tersimpan ke Buku Nilai!' : 'Nilai dapat direvisi guru sebelum difinalisasi.'}
                </div>

                <button
                  onClick={handleSaveToGradebook}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <Save size={16} />
                  <span>Simpan ke Buku Nilai Siswa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
