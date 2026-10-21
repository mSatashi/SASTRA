import React from 'react';
import { 
  Sparkles, 
  ScanLine, 
  FileText, 
  Users, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  Brain,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

export default function Dashboard({ summary, setActiveTab }) {
  const stats = [
    { label: 'Peserta Didik Terdata', value: summary?.total_students || 3, icon: Users, color: '#6366f1' },
    { label: 'Rerata Nilai Kelas', value: `${summary?.class_average_score || 84.5}%`, icon: TrendingUp, color: '#10b981' },
    { label: 'Modul & Kuis Dibuat', value: summary?.total_assessments_created || 2, icon: Sparkles, color: '#a855f7' },
    { label: 'Lembar Jawaban Terkoreksi', value: summary?.total_papers_graded || 5, icon: ScanLine, color: '#f59e0b' },
    { label: 'Narasi Rapor Siap', value: summary?.total_reports_generated || 3, icon: FileText, color: '#14b8a6' },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(20, 184, 166, 0.1) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-indigo">Permendikdasmen No. 13 Tahun 2025</span>
            <span className="badge badge-emerald">Deep Learning Approach</span>
          </div>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '12px', fontWeight: '800' }}>
            Selamat Datang di <span style={{ color: '#818cf8' }}>SASTRA</span>: Staf Pintar Asisten Guru
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginBottom: '22px' }}>
            Bebaskan waktu Anda dari rutinitas administratif yang melelahkan. Biarkan SASTRA merancang materi ajar interaktif, mengoreksi lembar jawaban (PG & esai tulisan tangan via OCR), dan menyusun narasi rapor semester yang kaya makna.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('assessment')} className="btn-primary">
              <Sparkles size={16} />
              <span>Rancang Asesmen Baru</span>
            </button>
            <button onClick={() => setActiveTab('grading')} className="btn-secondary">
              <ScanLine size={16} />
              <span>Koreksi Lembar Jawaban Siswa</span>
            </button>
            <button onClick={() => setActiveTab('reports')} className="btn-secondary">
              <FileText size={16} />
              <span>Susun Narasi Rapor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Metric Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {s.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${s.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: s.color
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3 Pillars of Deep Learning Info Box */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="#818cf8" />
          <span>Implementasi 3 Pilar Pembelajaran Mendalam (*Deep Learning*)</span>
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {/* Pilar 1 */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Lightbulb size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem' }}>1. Mindful Learning</h4>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Membuka kesadaran belajar murid melalui pertanyaan pemantik (*inquiry-based*), rasa ingin tahu, dan refleksi mandiri, bukan sekadar transfer informasi satu arah.
            </p>
            <span className="badge badge-indigo">Pertanyaan Pemantik & LKPD</span>
          </div>

          {/* Pilar 2 */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf' }}>
                <BookOpen size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem' }}>2. Meaningful Learning</h4>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Menghubungkan materi dengan kehidupan nyata siswa. Asesmen esai menuntut pemecahan masalah kontekstual (studi kasus) dan penalaran logis mendalam.
            </p>
            <span className="badge badge-emerald">Esai Analitik & OCR Vision</span>
          </div>

          {/* Pilar 3 */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <HeartHandshake size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem' }}>3. Joyful Learning</h4>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Menciptakan ruang belajar yang menyenangkan dengan kuis interaktif, umpan balik personal yang apresiatif, dan pengakuan atas keunikan potensi tiap anak.
            </p>
            <span className="badge badge-amber">Feedback Positif & Rapor Personal</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1 */}
        <div 
          onClick={() => setActiveTab('assessment')}
          className="glass-panel glass-card-interactive" 
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="badge badge-purple">Fitur Utama #1</span>
            <ArrowRight size={18} color="var(--text-muted)" />
          </div>
          <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Studio Materi & Kuis Interaktif</h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Hasilkan paket tujuan pembelajaran, pertanyaan pemantik, kuis campuran (PG + Esai), dan LKPD interaktif dalam hitungan detik.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#a855f7', fontWeight: '600' }}>
            Buka Studio Asesmen &rarr;
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => setActiveTab('grading')}
          className="glass-panel glass-card-interactive" 
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="badge badge-amber">Fitur Utama #2</span>
            <ArrowRight size={18} color="var(--text-muted)" />
          </div>
          <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Vision OCR Grader (PG + Esai)</h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Unggah foto lembar jawaban siswa. Agen membaca tulisan tangan, mengevaluasi alur logika esai, dan merumuskan umpan balik personal otomatis.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: '600' }}>
            Mulai Koreksi Lembar Jawaban &rarr;
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="glass-panel glass-card-interactive" 
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="badge badge-emerald">Fitur Utama #3</span>
            <ArrowRight size={18} color="var(--text-muted)" />
          </div>
          <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Generator Narasi Rapor Semester</h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Akumulasi nilai harian otomatis diubah menjadi deskripsi capaian kompetensi Permendikdasmen No. 13 Tahun 2025 yang otentik dan siap cetak.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: '600' }}>
            Generate Narasi Rapor &rarr;
          </div>
        </div>
      </div>
    </div>
  );
}
