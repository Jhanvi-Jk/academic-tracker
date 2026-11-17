import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Search, Clock } from 'lucide-react';
import { QUADRANT_META, getHeatmapStyle, getStalenessInfo, getEffectiveQuadrant } from '../utils/analyticsEngine.js';

const ERROR_TAGS = ['Conceptual Gap', 'Careless / Calculation', 'Time Management', 'Misread Question'];
const WEIGHTS = [{ value: 1, label: '1× Quick Check' }, { value: 2, label: '2× Standard FA' }, { value: 3, label: '3× Major Test' }];

function fmt(n) { return n !== null && n !== undefined ? n.toFixed(1) + '%' : '—'; }
function velArrow(v) {
  if (v === 0 || v === null) return { icon: '→', cls: 'text-slate-400 dark:text-slate-600' };
  if (v > 0) return { icon: '↑', cls: 'text-emerald-600 dark:text-emerald-400' };
  return { icon: '↓', cls: 'text-rose-500 dark:text-rose-400' };
}

function QuickAddForm({ subjectId, topics, terms, onAddEntry, onAddTopic }) {
  const today = new Date().toISOString().slice(0, 10);
  // Filter out upcoming topics from the add form
  const activeTopics = topics.filter(t => !t.upcoming);

  const [form, setForm] = useState({ topicId: activeTopics[0]?.id ?? '', term: terms[0], date: today, assessmentName: '', marksObtained: '', totalMarks: '', weight: 2, errorTags: [] });
  const [newTopicMode, setNewTopicMode] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTag = (tag) => {
    setForm(f => ({ ...f, errorTags: f.errorTags.includes(tag) ? f.errorTags.filter(t => t !== tag) : [...f.errorTags, tag] }));
  };

  const validate = () => {
    const e = {};
    if (!form.topicId) e.topicId = 'Select a topic';
    if (!form.assessmentName.trim()) e.assessmentName = 'Enter a name';
    if (form.marksObtained === '' || isNaN(Number(form.marksObtained))) e.marksObtained = 'Required';
    if (!form.totalMarks || isNaN(Number(form.totalMarks)) || Number(form.totalMarks) <= 0) e.totalMarks = 'Required';
    if (Number(form.marksObtained) > Number(form.totalMarks)) e.marksObtained = 'Cannot exceed total';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onAddEntry({ ...form, subjectId });
    setForm(f => ({ ...f, assessmentName: '', marksObtained: '', totalMarks: '', errorTags: [] }));
    setErrors({});
  };

  const handleAddNewTopic = () => {
    if (!newTopicName.trim()) return;
    onAddTopic(subjectId, newTopicName.trim());
    setNewTopicName(''); setNewTopicMode(false);
  };

  const inputCls = (err) => `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${err ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-600'}`;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-sky-500" /> Quick-Add Assessment
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Term */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Term</label>
          <select className={inputCls(false)} value={form.term} onChange={e => set('term', e.target.value)}>
            {terms.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Topic</label>
          {newTopicMode ? (
            <div className="flex gap-1">
              <input className={`flex-1 border border-sky-300 rounded-lg px-2 py-2 text-xs focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white`} placeholder="New topic…" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} autoFocus />
              <button type="button" onClick={handleAddNewTopic} className="p-2 bg-sky-500 text-white rounded-lg"><Check className="w-3 h-3" /></button>
              <button type="button" onClick={() => setNewTopicMode(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex gap-1">
              <select className={`flex-1 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${errors.topicId ? 'border-rose-300' : 'border-slate-200 dark:border-slate-600'}`} value={form.topicId} onChange={e => set('topicId', e.target.value)}>
                <option value="">Select…</option>
                {activeTopics.map(t => <option key={t.id} value={t.id}>{t.topicName}</option>)}
              </select>
              <button type="button" title="Add new topic" onClick={() => setNewTopicMode(true)} className="p-2 border border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-400 hover:text-sky-500 rounded-lg text-slate-400">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Assessment name */}
        <div className="col-span-2 md:col-span-1 lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Assessment Name</label>
          <input
            className={inputCls(errors.assessmentName)}
            placeholder="e.g. FA 1 – Kinematics Quiz"
            value={form.assessmentName}
            onChange={e => set('assessmentName', e.target.value)}
          />
        </div>

        {/* Marks */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Marks</label>
          <div className="flex gap-1 items-center">
            <input type="number" min="0"
              className={inputCls(errors.marksObtained)}
              placeholder="Got"
              value={form.marksObtained}
              onChange={e => set('marksObtained', e.target.value)}
            />
            <span className="text-slate-400 dark:text-slate-600 text-sm flex-shrink-0">/</span>
            <input type="number" min="1"
              className={inputCls(errors.totalMarks)}
              placeholder="Of"
              value={form.totalMarks}
              onChange={e => set('totalMarks', e.target.value)}
            />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Weight</label>
          <div className="flex gap-1">
            {WEIGHTS.map(w => (
              <button key={w.value} type="button"
                onClick={() => set('weight', w.value)}
                className={`flex-1 py-2 text-xs rounded-lg font-semibold border transition-all ${form.weight === w.value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
              >
                {w.value}×
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
          <input type="date"
            className={inputCls(false)}
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>

        {/* Error tags */}
        <div className="col-span-2 md:col-span-3 lg:col-span-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Error Tags (optional)</label>
          <div className="flex flex-wrap gap-2">
            {ERROR_TAGS.map(tag => (
              <button key={tag} type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.errorTags.includes(tag) ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{Object.values(errors)[0]}</p>
      )}

      <button type="submit" className="mt-4 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add Entry
      </button>
    </form>
  );
}

function TopicRow({ topic, stats, entries, terms }) {
  const [expanded, setExpanded] = useState(false);
  const effectiveQ = getEffectiveQuadrant(stats, topic);
  const qMeta = QUADRANT_META[effectiveQ];
  const { isStale, daysAgo } = getStalenessInfo(stats.lastAssessedDate);
  const vel = velArrow(stats.velocity ?? 0);
  const isUpcoming = topic.upcoming && effectiveQ === 'upcoming';

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${isUpcoming ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
        onClick={() => !isUpcoming && setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-2">
            {!isUpcoming && (expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
            {isUpcoming && <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />}
            <span className={isUpcoming ? 'text-slate-400 dark:text-slate-600' : ''}>{topic.topicName}</span>
            {topic.unitName && <span className="text-xs text-slate-400 dark:text-slate-600 hidden sm:inline">({topic.unitName})</span>}
            {isStale && !isUpcoming && <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded-full">Stale {daysAgo}d</span>}
          </div>
        </td>

        {terms.map(term => {
          const avg = stats.termAverages?.[term];
          return (
            <td key={term} className={`px-3 py-3 text-xs text-center ${isUpcoming ? 'text-slate-300 dark:text-slate-700' : getHeatmapStyle(avg)}`}>
              {avg !== null && avg !== undefined ? avg.toFixed(0) + '%' : <span className="text-slate-300 dark:text-slate-700">—</span>}
            </td>
          );
        })}

        <td className={`px-3 py-3 text-xs text-center font-semibold ${isUpcoming ? 'text-slate-300 dark:text-slate-700' : getHeatmapStyle(stats.weightedAvg)}`}>
          {isUpcoming ? '—' : fmt(stats.weightedAvg)}
        </td>
        <td className={`px-3 py-3 text-xs text-center font-semibold ${isUpcoming ? 'text-slate-300 dark:text-slate-700' : getHeatmapStyle(stats.ewma)}`}>
          {isUpcoming ? '—' : fmt(stats.ewma)}
        </td>
        <td className={`px-3 py-3 text-xs text-center font-bold ${isUpcoming ? 'text-slate-300 dark:text-slate-700' : vel.cls}`}>
          {isUpcoming ? '—' : `${vel.icon} ${stats.velocity !== null && stats.velocity !== 0 ? Math.abs(stats.velocity ?? 0).toFixed(1) : '—'}`}
        </td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
            <span className={`w-1 h-1 rounded-full ${qMeta.dot}`} />
            {qMeta.label}
          </span>
        </td>
      </tr>
      {expanded && entries.map(e => (
        <tr key={e.id} className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <td colSpan={terms.length + 4} className="px-8 py-2">
            <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400 items-center">
              <span className="font-medium text-slate-800 dark:text-slate-200">{e.assessmentName}</span>
              <span className="text-slate-400 dark:text-slate-500">{e.date} · {e.term}</span>
              <span className={`font-semibold px-2 py-0.5 rounded ${getHeatmapStyle(e.normalizedPercentage)}`}>
                {e.marksObtained}/{e.totalMarks} ({e.normalizedPercentage.toFixed(0)}%)
              </span>
              <span className="text-slate-400 dark:text-slate-500">{WEIGHTS.find(w => w.value === e.weight)?.label}</span>
              {e.errorTags.length > 0 && (
                <span className="text-rose-600 dark:text-rose-400">{e.errorTags.join(', ')}</span>
              )}
            </div>
          </td>
        </tr>
      ))}
      {expanded && entries.length === 0 && (
        <tr className="bg-slate-50 dark:bg-slate-800/40">
          <td colSpan={terms.length + 4} className="px-8 py-2 text-xs text-slate-400 italic">No assessments yet</td>
        </tr>
      )}
    </>
  );
}

function FALog({ entries, topics, onDelete, onUpdate }) {
  const [search, setSearch] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));
  const terms = [...new Set(entries.map(e => e.term))].sort();

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.assessmentName.toLowerCase().includes(search.toLowerCase()) || (topicMap[e.topicId]?.topicName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchTerm = !filterTerm || e.term === filterTerm;
    return matchSearch && matchTerm;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const startEdit = (entry) => { setEditId(entry.id); setEditForm({ ...entry }); };
  const saveEdit = () => { onUpdate(editId, editForm); setEditId(null); };

  const inputCls = 'border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded px-2 py-1 text-xs focus:outline-none';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="Search assessments…" value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          value={filterTerm} onChange={e => setFilterTerm(e.target.value)}
        >
          <option value="">All Terms</option>
          {terms.map(t => <option key={t}>{t}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Term</th>
              <th className="px-4 py-3 text-left">Topic</th>
              <th className="px-4 py-3 text-left">Assessment</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3 text-center">Wt</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-slate-600 text-sm italic">No entries found</td></tr>
            )}
            {filtered.map(entry => {
              const isEditing = editId === entry.id;
              const topic = topicMap[entry.topicId];
              return (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {isEditing ? <input type="date" className={`${inputCls} w-32`} value={editForm.date} onChange={e => setEditForm(f => ({...f, date: e.target.value}))} /> : entry.date}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {isEditing ? <input className={`${inputCls} w-20`} value={editForm.term} onChange={e => setEditForm(f => ({...f, term: e.target.value}))} /> : entry.term}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 font-medium">{topic?.topicName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
                    {isEditing ? <input className={`${inputCls} w-48`} value={editForm.assessmentName} onChange={e => setEditForm(f => ({...f, assessmentName: e.target.value}))} /> : entry.assessmentName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <span className="flex items-center gap-1 justify-center">
                        <input type="number" className={`${inputCls} w-14`} value={editForm.marksObtained} onChange={e => setEditForm(f => ({...f, marksObtained: e.target.value}))} />
                        <span className="text-slate-400">/</span>
                        <input type="number" className={`${inputCls} w-14`} value={editForm.totalMarks} onChange={e => setEditForm(f => ({...f, totalMarks: e.target.value}))} />
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getHeatmapStyle(entry.normalizedPercentage)}`}>
                        {entry.marksObtained}/{entry.totalMarks} ({entry.normalizedPercentage.toFixed(0)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{entry.weight}×</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.errorTags.map(tag => (
                        <span key={tag} className="text-xs bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-800">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(entry)} className="p-1.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-500 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (window.confirm('Delete this entry?')) onDelete(entry.id); }} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Tab1Matrix({ subject, topics, entries, terms, topicStatsMap, onAddEntry, onUpdateEntry, onDeleteEntry, onAddTopic }) {
  const [viewMode, setViewMode] = useState('heatmap');
  const topicEntries = (topicId) => entries.filter(e => e.topicId === topicId);

  return (
    <div className="space-y-5">
      <QuickAddForm subjectId={subject.id} topics={topics} terms={terms} onAddEntry={onAddEntry} onAddTopic={onAddTopic} />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {viewMode === 'heatmap' ? 'Topic Mastery Matrix' : 'Assessment Log'}
        </h2>
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          {[['heatmap', 'Heatmap View'], ['log', 'FA Log']].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'heatmap' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          {topics.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600">
              <p className="text-sm">No topics yet — add topics from the sidebar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">Topic</th>
                    {terms.map(t => <th key={t} className="px-3 py-3 text-center">{t}</th>)}
                    <th className="px-3 py-3 text-center">Wtd Avg</th>
                    <th className="px-3 py-3 text-center">EWMA</th>
                    <th className="px-3 py-3 text-center">Trend Δ</th>
                    <th className="px-3 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topics.map(topic => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      stats={topicStatsMap[topic.id] ?? { quadrant: 'untested', ewma: null, weightedAvg: null, velocity: 0, termAverages: {}, lastAssessedDate: null }}
                      entries={topicEntries(topic.id)}
                      terms={terms}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-500">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Heatmap key:</span>
            {[
              ['bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300', '≥85%'],
              ['bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', '70–84%'],
              ['bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', '55–69%'],
              ['bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300', '<55%'],
            ].map(([cls, label]) => (
              <span key={label} className={`px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
            ))}
          </div>
        </div>
      ) : (
        <FALog entries={entries} topics={topics} onDelete={onDeleteEntry} onUpdate={onUpdateEntry} />
      )}
    </div>
  );
}
