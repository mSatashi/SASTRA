import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  ScanLine, 
  Users, 
  FileText, 
  Key, 
  Cpu, 
  BookOpenCheck 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenApiKeyModal, aiStatus }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'assessment', label: '1. Studio Asesmen & Kuis', icon: Sparkles, badge: 'Deep Learning' },
    { id: 'grading', label: '2. Vision OCR Grader', icon: ScanLine, badge: 'PG + Esai' },
    { id: 'tracker', label: '3. Buku Nilai & Tracker', icon: Users },
    { id: 'reports', label: '4. Narasi Rapor Semester', icon: FileText, badge: 'Permendikdasmen' },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
        }}>
          🎓
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              SASTRA
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              AI AGENT
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
            Asisten Staf Guru Mandiri
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '8px 12px', fontWeight: '700' }}>
          Menu Asisten
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05))' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition)',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
              }}
            >
              <Icon size={18} color={isActive ? '#818cf8' : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className={isActive ? 'badge badge-indigo' : 'badge'} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Standar Regulasi Badge */}
      <div style={{
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(20, 184, 166, 0.08)',
        border: '1px solid rgba(20, 184, 166, 0.2)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#2dd4bf', marginBottom: '4px' }}>
          <BookOpenCheck size={14} />
          <span>Regulasi Resmi</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Diselaraskan dengan <strong>Permendikdasmen No. 13 Tahun 2025</strong> (Deep Learning).
        </div>
      </div>

      {/* Agent Engine Status Box */}
      <div style={{
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(17, 24, 39, 0.9)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: aiStatus?.ai_active ? '#10b981' : '#f59e0b',
              boxShadow: aiStatus?.ai_active ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
            }} className="agent-indicator-pulse" />
            <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>
              {(aiStatus?.ai_active ? (aiStatus?.provider === 'ollama' ? `Ollama · ${aiStatus?.model_name}` : 'Gemini Live') : 'Demo Engine Aktif')}
            </span>
          </div>
          <Cpu size={14} color="var(--text-muted)" />
        </div>

        <button 
          onClick={onOpenApiKeyModal}
          className="btn-secondary"
          style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px' }}
        >
          <Key size={13} />
          <span>Pengaturan Model AI</span>
        </button>
      </div>
    </aside>
  );
}
