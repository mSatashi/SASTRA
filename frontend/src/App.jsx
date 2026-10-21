import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ApiKeyModal from './components/ApiKeyModal';
import Dashboard from './pages/Dashboard';
import AssessmentStudio from './pages/AssessmentStudio';
import VisionGrader from './pages/VisionGrader';
import StudentTracker from './pages/StudentTracker';
import ReportGenerator from './pages/ReportGenerator';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [aiStatus, setAiStatus] = useState({ ai_active: false, gemini_active: false });
  const [preselectedStudentId, setPreselectedStudentId] = useState(null);

  const loadData = async () => {
    try {
      const [sumData, stdData, stStatus] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getStudents().catch(() => []),
        api.getAiStatus().catch(() => ({ ai_active: false, gemini_active: false }))
      ]);
      if (sumData) setSummary(sumData);
      if (stdData) setStudents(stdData);
      if (stStatus) setAiStatus(stStatus);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectStudentForReport = (studentId) => {
    setPreselectedStudentId(studentId);
    setActiveTab('reports');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        aiStatus={aiStatus}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          aiStatus={aiStatus}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard 
              summary={summary} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'assessment' && (
            <AssessmentStudio 
              onGoToGrading={() => setActiveTab('grading')} 
            />
          )}

          {activeTab === 'grading' && (
            <VisionGrader 
              students={students} 
              onGradeSaved={loadData}
            />
          )}

          {activeTab === 'tracker' && (
            <StudentTracker 
              students={students} 
              onSelectStudentForReport={handleSelectStudentForReport}
            />
          )}

          {activeTab === 'reports' && (
            <ReportGenerator 
              students={students} 
              preselectedStudentId={preselectedStudentId}
            />
          )}
        </main>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={loadData}
        aiStatus={aiStatus}
      />
    </div>
  );
}
