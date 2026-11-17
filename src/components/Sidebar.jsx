import { useState } from 'react';
import { X, Plus, Trash2, Settings, BookOpen, ChevronDown, ChevronRight, RotateCcw, LayoutDashboard, Sun, Moon, Clock } from 'lucide-react';

const COLOR_THEMES = ['sky', 'violet', 'emerald', 'rose', 'amber', 'indigo'];

const themeClasses = {
  sky:    { dot: 'bg-sky-500',     active: 'bg-sky-900/40 border-sky-700' },
  violet: { dot: 'bg-violet-500',  active: 'bg-violet-900/40 border-violet-700' },
  emerald:{ dot: 'bg-emerald-500', active: 'bg-emerald-900/40 border-emerald-700' },
  rose:   { dot: 'bg-rose-500',    active: 'bg-rose-900/40 border-rose-700' },
  amber:  { dot: 'bg-amber-500',   active: 'bg-amber-900/40 border-amber-700' },
  indigo: { dot: 'bg-indigo-500',  active: 'bg-indigo-900/40 border-indigo-700' },
};

export default function Sidebar({
  subjects, syllabusTopics, activeSubjectId, isOpen, currentView, darkMode,
  onClose, onNavigateToDashboard, onSelectSubject,
  onAddSubject, onUpdateSubject, onDeleteSubject,
  onAddTopic, onDeleteTopic, onToggleTopicUpcoming,
  onToggleDark, onReset, onClearAll,
}) {
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectTarget, setNewSubjectTarget] = useState('85');
  const [newSubjectColor, setNewSubjectColor] = useState('sky');
  const [topicPanelSubjectId, setTopicPanelSubjectId] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicUnit, setNewTopicUnit] = useState('');
  const [editTargetId, setEditTargetId] = useState(null);
  const [editTargetValue, setEditTargetValue] = useState('');

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim(), newSubjectTarget, newSubjectColor);
    setNewSubjectName(''); setNewSubjectTarget('85'); setNewSubjectColor('sky');
    setAddSubjectOpen(false);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !topicPanelSubjectId) return;
    onAddTopic(topicPanelSubjectId, newTopicName.trim(), newTopicUnit.trim());
    setNewTopicName(''); setNewTopicUnit('');
  };

  const topicsForPanel = syllabusTopics.filter(t => t.subjectId === topicPanelSubjectId);

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-sky-500/20 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-black text-lg tracking-tight">AcadTrack</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-700 rounded-lg text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dashboard home button */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => { onNavigateToDashboard(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${currentView === 'dashboard' ? 'bg-sky-600 text-white border-sky-500' : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          All Subjects
        </button>
      </div>

      {/* Subjects list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-3 space-y-1">
        <p className="px-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">My Subjects</p>
        {subjects.map(subj => {
          const theme = themeClasses[subj.colorTheme] ?? themeClasses.sky;
          const isActive = subj.id === activeSubjectId && currentView === 'subject';
          const topicsCount = syllabusTopics.filter(t => t.subjectId === subj.id).length;
          return (
            <div key={subj.id}>
              <button
                onClick={() => { onSelectSubject(subj.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${isActive ? `bg-slate-700 border-slate-600 text-white` : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${theme.dot}`} />
                <span className="flex-1 font-medium text-sm truncate">{subj.name}</span>
                <span className="text-xs text-slate-500">{topicsCount}</span>
              </button>

              {isActive && (
                <div className="ml-3 mt-1 flex gap-1 flex-wrap">
                  <button
                    onClick={() => setTopicPanelSubjectId(topicPanelSubjectId === subj.id ? null : subj.id)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" /> Topics
                    {topicPanelSubjectId === subj.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  {editTargetId === subj.id ? (
                    <form className="flex gap-1" onSubmit={e => { e.preventDefault(); onUpdateSubject(subj.id, { targetPercentage: Number(editTargetValue) }); setEditTargetId(null); }}>
                      <input className="w-14 bg-slate-700 text-white text-xs rounded px-1.5 py-1 border border-slate-500" value={editTargetValue} onChange={e => setEditTargetValue(e.target.value)} autoFocus />
                      <button type="submit" className="text-xs text-sky-400 hover:text-sky-300 px-1">✓</button>
                      <button type="button" onClick={() => setEditTargetId(null)} className="text-xs text-slate-400 px-1">✕</button>
                    </form>
                  ) : (
                    <button onClick={() => { setEditTargetId(subj.id); setEditTargetValue(String(subj.targetPercentage)); }} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700">
                      Target: {subj.targetPercentage}%
                    </button>
                  )}
                  <button onClick={() => { if (window.confirm(`Delete "${subj.name}" and all its data?`)) onDeleteSubject(subj.id); }} className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-slate-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Topics panel */}
              {topicPanelSubjectId === subj.id && (
                <div className="ml-3 mt-2 bg-slate-800 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-300 mb-2">Syllabus Topics</p>
                  <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
                    {topicsForPanel.length === 0 && <p className="text-xs text-slate-500 italic">No topics yet</p>}
                    {topicsForPanel.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <span className={`flex-1 truncate ${t.upcoming ? 'text-slate-500' : 'text-slate-300'}`}>
                          {t.unitName ? <span className="text-slate-500">[{t.unitName}] </span> : null}
                          {t.topicName}
                        </span>
                        <button
                          title={t.upcoming ? 'Mark as active' : 'Mark as upcoming (not yet taught)'}
                          onClick={() => onToggleTopicUpcoming(t.id)}
                          className={`flex-shrink-0 p-0.5 rounded transition-colors ${t.upcoming ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          <Clock className="w-3 h-3" />
                        </button>
                        <button onClick={() => onDeleteTopic(t.id)} className="flex-shrink-0 text-slate-600 hover:text-rose-400 p-0.5 rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />= mark topic as "not yet taught"
                  </p>
                  <form onSubmit={handleAddTopic} className="mt-2 space-y-1.5">
                    <input
                      className="w-full bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 placeholder-slate-400 focus:outline-none focus:border-sky-400"
                      placeholder="Topic name *"
                      value={newTopicName}
                      onChange={e => setNewTopicName(e.target.value)}
                    />
                    <input
                      className="w-full bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 placeholder-slate-400 focus:outline-none focus:border-sky-400"
                      placeholder="Unit / chapter (optional)"
                      value={newTopicUnit}
                      onChange={e => setNewTopicUnit(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Add Topic
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add subject */}
      <div className="px-3 pb-2 border-t border-slate-700/60 pt-3">
        {addSubjectOpen ? (
          <form onSubmit={handleAddSubject} className="space-y-2 bg-slate-800 rounded-xl p-3">
            <input
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 placeholder-slate-400 focus:outline-none focus:border-sky-400"
              placeholder="Subject name"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <input type="number" min="0" max="100"
                className="w-20 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-sky-400"
                placeholder="Target%"
                value={newSubjectTarget}
                onChange={e => setNewSubjectTarget(e.target.value)}
              />
              <div className="flex gap-1.5 flex-wrap flex-1 items-center">
                {COLOR_THEMES.map(c => (
                  <button key={c} type="button" onClick={() => setNewSubjectColor(c)}
                    className={`w-5 h-5 rounded-full ${themeClasses[c].dot} ${newSubjectColor === c ? 'ring-2 ring-offset-1 ring-offset-slate-800 ring-white scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium py-1.5 rounded-lg">Add</button>
              <button type="button" onClick={() => setAddSubjectOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1.5 rounded-lg">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAddSubjectOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-slate-700/60 pt-2">
        <button onClick={onToggleDark} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors">
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={onReset} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 text-xs transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reset to IB Setup
        </button>
        <button onClick={onClearAll} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Clear All & Start Fresh
        </button>
      </div>
    </aside>
  );
}
