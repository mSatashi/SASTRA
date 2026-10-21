import React, { useEffect, useState } from 'react';
import { X, Key, CheckCircle, AlertCircle, Sparkles, Server, Cloud, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

const tabStyle = (active) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: `1px solid ${active ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-color)'}`,
  background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
  color: active ? 'var(--text-primary, #fff)' : 'var(--text-muted)',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
});

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated, aiStatus }) {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');

  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaVisionModel, setOllamaVisionModel] = useState('');
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaReachable, setOllamaReachable] = useState(null);
  const [checking, setChecking] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Sinkronkan form dengan status backend setiap kali modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    setMsg(null);
    setProvider(aiStatus?.provider || 'gemini');
    const o = aiStatus?.ollama || {};
    setOllamaUrl(o.base_url || DEFAULT_OLLAMA_URL);
    setOllamaModel(o.model_name || '');
    setOllamaVisionModel(o.vision_model_name && o.vision_model_name !== o.model_name ? o.vision_model_name : '');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && provider === 'ollama') refreshOllamaModels();
  }, [isOpen, provider]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  async function refreshOllamaModels() {
    setChecking(true);
    try {
      const res = await api.listOllamaModels(ollamaUrl);
      setOllamaReachable(res.reachable);
      setOllamaModels(res.models || []);
      if (!res.reachable) {
        setMsg({ type: 'error', text: `Server Ollama tidak dapat dihubungi di ${ollamaUrl}. Pastikan "ollama serve" berjalan.` });
      } else {
        setMsg(null);
        if (!ollamaModel && res.models?.length) setOllamaModel(res.models[0]);
      }
    } catch (err) {
      setOllamaReachable(false);
      setMsg({ type: 'error', text: 'Gagal memeriksa server Ollama: ' + err.message });
    } finally {
      setChecking(false);
    }
  }

  const finish = (text) => {
    setMsg({ type: 'success', text });
    if (onKeyUpdated) onKeyUpdated();
    setTimeout(() => {
      onClose();
      setMsg(null);
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (provider === 'gemini') {
        if (apiKey.trim()) await api.updateApiKey(apiKey);
        const res = await api.updateLlmConfig({ provider: 'gemini' });
        if (res.ai_active) finish('Gemini aktif sebagai model AI.');
        else setMsg({ type: 'error', text: 'Gemini belum aktif. Masukkan API Key yang valid.' });
      } else {
        const res = await api.updateLlmConfig({
          provider: 'ollama',
          ollama_base_url: ollamaUrl,
          ollama_model: ollamaModel,
          ollama_vision_model: ollamaVisionModel,
        });
        if (res.ai_active) {
          finish(`Ollama aktif dengan model ${res.model_name}.`);
        } else {
          setMsg({ type: 'error', text: res.ollama?.error || 'Ollama belum siap. Periksa server dan model.' });
          if (onKeyUpdated) onKeyUpdated();
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Gagal menyimpan konfigurasi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const modelOptions = ollamaModels.includes(ollamaModel) || !ollamaModel
    ? ollamaModels
    : [ollamaModel, ...ollamaModels];

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
        maxWidth: '520px',
        width: '100%',
        padding: '28px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
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
            {provider === 'ollama' ? <Server size={20} /> : <Key size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Pengaturan Model AI</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Aktif sekarang: {aiStatus?.ai_active
                ? `${aiStatus.provider === 'ollama' ? 'Ollama' : 'Gemini'} · ${aiStatus.model_name}`
                : 'Mode Demo'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button type="button" style={tabStyle(provider === 'gemini')} onClick={() => { setProvider('gemini'); setMsg(null); }}>
            <Cloud size={14} /> Google Gemini
          </button>
          <button type="button" style={tabStyle(provider === 'ollama')} onClick={() => { setProvider('ollama'); setMsg(null); }}>
            <Server size={14} /> Ollama (Lokal)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {provider === 'gemini' ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Masukkan <strong>Google Gemini API Key</strong> untuk inferensi cloud multi-modal (vision OCR lembar jawaban dan pembuatan modul ajar).
              </p>
              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={aiStatus?.gemini_active ? 'Kosongkan untuk memakai key yang tersimpan' : 'AIzaSy...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!aiStatus?.gemini_active}
                />
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Jalankan model secara <strong>lokal</strong> lewat Ollama — data siswa tidak keluar dari komputer sekolah. Pastikan <code>ollama serve</code> sudah berjalan.
              </p>

              <div className="form-group">
                <label className="form-label">URL Server Ollama</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={DEFAULT_OLLAMA_URL}
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    required
                  />
                  <button type="button" className="btn-secondary" onClick={refreshOllamaModels} disabled={checking} title="Cek koneksi & muat daftar model">
                    <RefreshCw size={14} className={checking ? 'spin' : ''} />
                  </button>
                </div>
                {ollamaReachable !== null && (
                  <span style={{ fontSize: '0.75rem', color: ollamaReachable ? '#34d399' : '#fb7185' }}>
                    {ollamaReachable ? `Terhubung · ${ollamaModels.length} model terpasang` : 'Tidak terhubung'}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Model Teks (Modul, Kuis, Rapor)</label>
                {modelOptions.length > 0 ? (
                  <select className="form-input" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} required>
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="gemma3:4b"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Model Vision (Koreksi Lembar Jawaban)</label>
                <select className="form-input" value={ollamaVisionModel} onChange={(e) => setOllamaVisionModel(e.target.value)}>
                  <option value="">Sama dengan model teks</option>
                  {ollamaModels.filter((m) => m !== ollamaModel).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Harus model multimodal, mis. gemma3, qwen2.5vl, llava, llama3.2-vision.
                </span>
              </div>
            </>
          )}

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
            Bila model AI belum siap, SASTRA otomatis menjalankan simulator cerdas berstandar Permendikdasmen No. 13/2025 agar seluruh alur pengujian juri dapat didemokan tanpa hambatan.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : provider === 'ollama' ? 'Gunakan Ollama' : 'Simpan & Hubungkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
