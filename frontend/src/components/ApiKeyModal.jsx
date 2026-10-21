import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated, aiStatus }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.updateApiKey(apiKey);
      setMsg({ type: 'success', text: 'Gemini API Key berhasil disimpan & diaktifkan!' });
      if (onKeyUpdated) onKeyUpdated();
      setTimeout(() => {
        onClose();
        setMsg(null);
      }, 1200);
    } catch (err) {
      setMsg({ type: 'error', text: 'Gagal memperbarui API Key: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div className="glass-panel" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '28px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Key size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Konfigurasi Google Gemini API</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Model: Gemini 2.0 Flash / Gemini 1.5 Pro
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Masukkan <strong>Google Gemini API Key</strong> Anda untuk menjalankan inferensi live multi-modal vision OCR lembar jawaban dan pembuatan modul ajar.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          {msg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: msg.type === 'success' ? '#34d399' : '#fb7185',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
            }}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{msg.text}</span>
            </div>
          )}

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: '600', marginBottom: '3px' }}>
              <Sparkles size={14} />
              <span>Mode Demo Standby Tersedia</span>
            </div>
            Bila tanpa API key, SASTRA otomatis menjalankan simulator cerdas berstandar Permendikdasmen No. 13/2025 agar seluruh alur pengujian juri dapat didemokan tanpa hambatan.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan & Hubungkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
