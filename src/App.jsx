import { useState, useMemo, useCallback } from 'react';
import { getSampleData } from './utils/sampleData.js';
import { normalizeScore, computeTopicStats, computeSubjectStats, getTrajectoryData } from './utils/analyticsEngine.js';
import Sidebar from './components/Sidebar.jsx';
import KPIHeader from './components/KPIHeader.jsx';
import Tab1Matrix from './components/Tab1_Matrix.jsx';
import Tab2Analytics from './components/Tab2_Analytics.jsx';
import Dashboard from './components/Dashboard.jsx';

const STORAGE_KEY = 'academicTrackerV2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getSampleData();
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [appData, setAppData] = useState(loadState);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'subject'
  const [activeTab, setActiveTab] = useState('matrix');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const saveAndUpdate = useCallback((updater) => {
    setAppData(prev => {
      const next = updater(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const { subjects, syllabusTopics, assessmentEntries, activeSubjectId, terms } = appData;

  // Compute analytics for ALL subjects (for dashboard)
  const allSubjectsAnalytics = useMemo(() => {
    return subjects.reduce((acc, subj) => {
      const subjTopics = syllabusTopics.filter(t => t.subjectId === subj.id);
      const subjEntries = assessmentEntries.filter(e => e.subjectId === subj.id);
      const topicStatsMap = {};
      subjTopics.forEach(topic => {
        topicStatsMap[topic.id] = computeTopicStats(subjEntries.filter(e => e.topicId === topic.id));
      });
      acc[subj.id] = {
        topicStatsMap,
        subjectStats: computeSubjectStats(subjEntries, subjTopics),
        trajectoryData: getTrajectoryData(subjEntries),
        topics: subjTopics,
        entries: subjEntries,
      };
      return acc;
    }, {});
  }, [subjects, syllabusTopics, assessmentEntries]);

  // Active subject derived values
  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const activeAnalytics = allSubjectsAnalytics[activeSubjectId];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const navigateToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setSidebarOpen(false);
  }, []);

  const setActiveSubject = useCallback((id) => {
    saveAndUpdate(prev => ({ ...prev, activeSubjectId: id }));
    setCurrentView('subject');
    setActiveTab('matrix');
    setSidebarOpen(false);
  }, [saveAndUpdate]);

  const addSubject = useCallback((name, targetPercentage, colorTheme) => {
    const id = genId();
    saveAndUpdate(prev => ({
      ...prev,
      subjects: [...prev.subjects, { id, name, targetPercentage: Number(targetPercentage) || 85, colorTheme }],
    }));
  }, [saveAndUpdate]);

  const updateSubject = useCallback((id, updates) => {
    saveAndUpdate(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, [saveAndUpdate]);

  const deleteSubject = useCallback((id) => {
    saveAndUpdate(prev => {
      const remaining = prev.subjects.filter(s => s.id !== id);
      return {
        ...prev,
        subjects: remaining,
        syllabusTopics: prev.syllabusTopics.filter(t => t.subjectId !== id),
        assessmentEntries: prev.assessmentEntries.filter(e => e.subjectId !== id),
        activeSubjectId: remaining[0]?.id ?? '',
      };
    });
    setCurrentView('dashboard');
  }, [saveAndUpdate]);

  const addTopic = useCallback((subjectId, topicName, unitName = '') => {
    saveAndUpdate(prev => ({
      ...prev,
      syllabusTopics: [...prev.syllabusTopics, { id: genId(), subjectId, topicName, unitName }],
    }));
  }, [saveAndUpdate]);

  const deleteTopic = useCallback((topicId) => {
    saveAndUpdate(prev => ({
      ...prev,
      syllabusTopics: prev.syllabusTopics.filter(t => t.id !== topicId),
      assessmentEntries: prev.assessmentEntries.filter(e => e.topicId !== topicId),
    }));
  }, [saveAndUpdate]);

  const addEntry = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: genId(),
      normalizedPercentage: normalizeScore(entry.marksObtained, entry.totalMarks),
      marksObtained: Number(entry.marksObtained),
      totalMarks: Number(entry.totalMarks),
      weight: Number(entry.weight),
    };
    saveAndUpdate(prev => ({ ...prev, assessmentEntries: [...prev.assessmentEntries, newEntry] }));
  }, [saveAndUpdate]);

  const updateEntry = useCallback((id, updates) => {
    saveAndUpdate(prev => ({
      ...prev,
      assessmentEntries: prev.assessmentEntries.map(e => {
        if (e.id !== id) return e;
        const merged = { ...e, ...updates, marksObtained: Number(updates.marksObtained ?? e.marksObtained), totalMarks: Number(updates.totalMarks ?? e.totalMarks), weight: Number(updates.weight ?? e.weight) };
        merged.normalizedPercentage = normalizeScore(merged.marksObtained, merged.totalMarks);
        return merged;
      }),
    }));
  }, [saveAndUpdate]);

  const deleteEntry = useCallback((id) => {
    saveAndUpdate(prev => ({ ...prev, assessmentEntries: prev.assessmentEntries.filter(e => e.id !== id) }));
  }, [saveAndUpdate]);

  const resetToSample = useCallback(() => {
    if (window.confirm('This will clear all your data and reload the demo dataset. Continue?')) {
      const sample = getSampleData();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sample)); } catch {}
      setAppData(sample);
      setCurrentView('dashboard');
    }
  }, []);

  const clearAll = useCallback(() => {
    if (window.confirm('Start completely fresh? All data will be deleted.')) {
      const id = genId();
      const blank = {
        subjects: [{ id, name: 'My Subject', targetPercentage: 85, colorTheme: 'sky' }],
        syllabusTopics: [],
        assessmentEntries: [],
        activeSubjectId: id,
        terms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(blank)); } catch {}
      setAppData(blank);
      setCurrentView('dashboard');
    }
  }, []);

  const sidebarProps = {
    subjects, syllabusTopics, activeSubjectId, isOpen: sidebarOpen,
    currentView,
    onClose: () => setSidebarOpen(false),
    onNavigateToDashboard: navigateToDashboard,
    onSelectSubject: setActiveSubject,
    onAddSubject: addSubject,
    onUpdateSubject: updateSubject,
    onDeleteSubject: deleteSubject,
    onAddTopic: addTopic,
    onDeleteTopic: deleteTopic,
    onReset: resetToSample,
    onClearAll: clearAll,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar {...sidebarProps} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-800">
            {currentView === 'dashboard' ? 'Academic Tracker' : (activeSubject?.name ?? 'Academic Tracker')}
          </span>
        </div>

        <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' ? (
            <Dashboard
              subjects={subjects}
              syllabusTopics={syllabusTopics}
              assessmentEntries={assessmentEntries}
              allSubjectsAnalytics={allSubjectsAnalytics}
              onSelectSubject={setActiveSubject}
            />
          ) : (
            <>
              {/* Back breadcrumb */}
              <button onClick={navigateToDashboard} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 group">
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Subjects
              </button>

              {!activeSubject ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                  <p className="text-lg font-medium">No subject selected</p>
                </div>
              ) : (
                <>
                  <KPIHeader
                    subject={activeSubject}
                    subjectStats={activeAnalytics?.subjectStats}
                    topicStatsMap={activeAnalytics?.topicStatsMap ?? {}}
                    activeTopics={activeAnalytics?.topics ?? []}
                  />

                  <div className="flex gap-1 mt-5 mb-4 bg-white rounded-xl border border-slate-200 p-1 w-fit">
                    {[['matrix', 'Entry & Matrix'], ['analytics', 'Analytics & Insights']].map(([key, label]) => (
                      <button key={key} onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'matrix' ? (
                    <Tab1Matrix
                      subject={activeSubject}
                      topics={activeAnalytics?.topics ?? []}
                      entries={activeAnalytics?.entries ?? []}
                      terms={terms}
                      topicStatsMap={activeAnalytics?.topicStatsMap ?? {}}
                      onAddEntry={addEntry}
                      onUpdateEntry={updateEntry}
                      onDeleteEntry={deleteEntry}
                      onAddTopic={addTopic}
                    />
                  ) : (
                    <Tab2Analytics
                      subject={activeSubject}
                      topics={activeAnalytics?.topics ?? []}
                      entries={activeAnalytics?.entries ?? []}
                      terms={terms}
                      topicStatsMap={activeAnalytics?.topicStatsMap ?? {}}
                      subjectStats={activeAnalytics?.subjectStats}
                      trajectoryData={activeAnalytics?.trajectoryData ?? []}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
