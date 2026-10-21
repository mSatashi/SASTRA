import React from 'react';
import { Sparkles, Bell, HelpCircle, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, onOpenApiKeyModal, aiStatus }) {
  const titles = {
    dashboard: 'Pusat Kendali Asisten Guru',
    assessment: 'Interactive Assessment & Content Studio',
    grading: 'Multi-Modal Vision OCR Grader (PG + Esai)',
    tracker: 'Buku Nilai & Pelacak Perkembangan Siswa',
    reports: 'Generator Narasi Rapor Akhir Semester'
  };

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
          {titles[activeTab] || 'SASTRA'}
        </h1>
        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
          <ShieldCheck size={12} />
          Permendikdasmen No. 13/2025
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Status AI:</span>
          <span style={{ 
            color: aiStatus?.gemini_active ? '#34d399' : '#fbbf24', 
            fontWeight: '600' 
          }}>
            {aiStatus?.gemini_active ? 'Gemini 2.0 Aktif' : 'Engine Standby'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingLeft: '14px',
          borderLeft: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '0.85rem',
            color: '#fff'
          }}>
            GR
          </div>
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff' }}>Guru Pengampu</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fase D (SMP)</div>
          </div>
        </div>
      </div>
    </header>
  );
}
