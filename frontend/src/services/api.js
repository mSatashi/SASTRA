const API_BASE = '/api';

export const api = {
  // Data & Metrik Dashboard
  async getSummary() {
    const res = await fetch(`${API_BASE}/data/summary`);
    return res.json();
  },

  async getClasses() {
    const res = await fetch(`${API_BASE}/data/classes`);
    return res.json();
  },

  async getStudents(classId = null) {
    const url = classId ? `${API_BASE}/data/students?class_id=${classId}` : `${API_BASE}/data/students`;
    const res = await fetch(url);
    return res.json();
  },

  async getAiStatus() {
    const res = await fetch(`${API_BASE}/data/status`);
    return res.json();
  },

  async updateApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/data/update-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    return res.json();
  },

  // Fitur 1: Interactive Assessment Studio
  async generateAssessment(payload) {
    const res = await fetch(`${API_BASE}/assessment/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal menghasilkan materi asesmen');
    return res.json();
  },

  async listAssessments() {
    const res = await fetch(`${API_BASE}/assessment/list`);
    return res.json();
  },

  // Fitur 2: Vision OCR Grader
  async gradeSubmission(formData) {
    const res = await fetch(`${API_BASE}/grading/evaluate`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Gagal memproses penilaian lembar jawaban');
    return res.json();
  },

  async listGradings() {
    const res = await fetch(`${API_BASE}/grading/list`);
    return res.json();
  },

  // Fitur 3: Academic Tracker & Report Assistance
  async generateReport(payload) {
    const res = await fetch(`${API_BASE}/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal menyusun narasi rapor akhir semester');
    return res.json();
  },

  async listReports() {
    const res = await fetch(`${API_BASE}/report/list`);
    return res.json();
  }
};
