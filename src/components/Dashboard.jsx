import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { ArrowRight, BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { QUADRANT_META, getStalenessInfo } from '../utils/analyticsEngine.js';

const THEME_COLORS = {
  sky:    '#0ea5e9',
  violet: '#8b5cf6',
  emerald:'#10b981',
  rose:   '#f43f5e',
  amber:  '#f59e0b',
  indigo: '#6366f1',
};

const THEME_LIGHT = {
  sky:    'bg-sky-50 border-sky-200',
  violet: 'bg-violet-50 border-violet-200',
  emerald:'bg-emerald-50 border-emerald-200',
  rose:   'bg-rose-50 border-rose-200',
  amber:  'bg-amber-50 border-amber-200',
  indigo: 'bg-indigo-50 border-indigo-200',
};

// Build the multi-subject EWMA chart data
function buildProfileChart(subjects, assessmentEntries) {
  const subjectEWMAByDate = {};

  subjects.forEach(subj => {
    subjectEWMAByDate[subj.id] = {};
    const sorted = assessmentEntries
      .filter(e => e.subjectId === subj.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let ewma = null;
    sorted.forEach(e => {
      const alpha = Math.min(0.45 * e.weight, 0.85);
      ewma = ewma === null ? e.normalizedPercentage : alpha * e.normalizedPercentage + (1 - alpha) * ewma;
      subjectEWMAByDate[subj.id][e.date] = Math.round(ewma * 10) / 10;
    });
  });

  const allDates = [...new Set(assessmentEntries.map(e => e.date))].sort();

  return allDates.map(date => {
    const row = { date };
    subjects.forEach(subj => {
      const prior = Object.keys(subjectEWMAByDate[subj.id]).filter(d => d <= date).sort();
      if (prior.length > 0) {
        row[subj.name] = subjectEWMAByDate[subj.id][prior[prior.length - 1]];
      }
    });
    return row;
  });
}

// Individual subject card
function SubjectCard({ subject, analytics, onSelect }) {
  const { subjectStats, topicStatsMap, topics } = analytics;
  const { subjectEWMA, testedTopicsCount, totalTopics } = subjectStats;
  const color = THEME_COLORS[subject.colorTheme] ?? THEME_COLORS.sky;
  const coveragePct = totalTopics > 0 ? (testedTopicsCount / totalTopics) * 100 : 0;

  // Quadrant counts
  const qCounts = { mastered: 0, improving: 0, at_risk: 0, critical_gap: 0, untested: 0 };
  topics.forEach(t => {
    const q = topicStatsMap[t.id]?.quadrant ?? 'untested';
    qCounts[q] = (qCounts[q] ?? 0) + 1;
  });

  // Stale count
  const staleCount = topics.filter(t => {
    const stats = topicStatsMap[t.id];
    return stats?.lastAssessedDate && getStalenessInfo(stats.lastAssessedDate).isStale;
  }).length;

  const ewmaVsTarget = subjectEWMA !== null ? subjectEWMA - subject.targetPercentage : null;
  const TrendIcon = ewmaVsTarget === null ? Minus : (ewmaVsTarget >= 0 ? TrendingUp : TrendingDown);
  const trendCls = ewmaVsTarget === null ? 'text-slate-400' : (ewmaVsTarget >= 0 ? 'text-emerald-500' : 'text-rose-500');

  const priorityOrder = ['critical_gap', 'at_risk', 'improving', 'mastered', 'untested'];
  const dominantQ = priorityOrder.find(q => qCounts[q] > 0) ?? 'untested';
  const qMeta = QUADRANT_META[dominantQ];

  return (
    <button
      onClick={() => onSelect(subject.id)}
      className="group w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
    >
      {/* Coloured top bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              <BookOpen className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">{subject.name}</h3>
              <p className="text-xs text-slate-400">{totalTopics} topics · Target {subject.targetPercentage}%</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${qMeta.dot}`} />
            {qMeta.label}
          </span>
        </div>

        {/* EWMA big number */}
        <div className="flex items-end gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">EWMA Mastery</p>
            <div className="flex items-end gap-1.5">
              <span className={`text-4xl font-black leading-none ${subjectEWMA === null ? 'text-slate-300' : (subjectEWMA >= subject.targetPercentage ? 'text-emerald-600' : subjectEWMA < 70 ? 'text-rose-600' : 'text-slate-800')}`}>
                {subjectEWMA !== null ? subjectEWMA.toFixed(1) : '—'}
              </span>
              {subjectEWMA !== null && <span className="text-sm text-slate-400 pb-1">%</span>}
              <TrendIcon className={`w-5 h-5 pb-0.5 ${trendCls}`} />
            </div>
          </div>
          <div className="flex-1 ml-4">
            <p className="text-xs text-slate-400 mb-1">Syllabus Coverage</p>
            <p className="text-sm font-bold text-slate-700">{testedTopicsCount} / {totalTopics} topics</p>
            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${coveragePct}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>

        {/* Progress to target */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress to target ({subject.targetPercentage}%)</span>
            {subjectEWMA !== null && (
              <span className={ewmaVsTarget >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                {ewmaVsTarget >= 0 ? '+' : ''}{ewmaVsTarget?.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
            {subjectEWMA !== null && (
              <>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, subjectEWMA)}%`, backgroundColor: color + 'cc' }} />
                {/* Target marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500 opacity-50 rounded"
                  style={{ left: `${Math.min(100, subject.targetPercentage)}%` }} />
              </>
            )}
          </div>
        </div>

        {/* Topic status pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(qCounts).filter(([, v]) => v > 0).map(([q, count]) => {
            const m = QUADRANT_META[q];
            return (
              <span key={q} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
                <span className={`w-1 h-1 rounded-full ${m.dot}`} />
                {count} {m.label}
              </span>
            );
          })}
          {staleCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">
              {staleCount} Stale
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end text-sm font-semibold group-hover:gap-1.5 gap-1 transition-all" style={{ color }}>
          View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

// Multi-line profile chart
function ProfileChart({ subjects, assessmentEntries }) {
  const chartData = useMemo(() => buildProfileChart(subjects, assessmentEntries), [subjects, assessmentEntries]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-xs space-y-1.5 min-w-44">
        <p className="font-semibold text-slate-600 mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-slate-700">{p.name}</span>
            </div>
            <span className="font-bold" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Add assessments across your subjects to see your profile chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        {subjects.map(subj => (
          <Line
            key={subj.id}
            type="monotone"
            dataKey={subj.name}
            stroke={THEME_COLORS[subj.colorTheme] ?? '#94a3b8'}
            strokeWidth={2.5}
            dot={{ r: 3, fill: THEME_COLORS[subj.colorTheme] ?? '#94a3b8', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Overall stats bar across all subjects
function GlobalStats({ subjects, allSubjectsAnalytics }) {
  const totalAssessments = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.entries.length, 0);
  const totalTopics = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.topics.length, 0);
  const testedTopics = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.subjectStats.testedTopicsCount, 0);

  const allEWMAs = subjects.map(s => allSubjectsAnalytics[s.id]?.subjectStats?.subjectEWMA).filter(e => e !== null);
  const overallEWMA = allEWMAs.length > 0 ? allEWMAs.reduce((a, b) => a + b, 0) / allEWMAs.length : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Overall EWMA', value: overallEWMA !== null ? `${overallEWMA.toFixed(1)}%` : '—', sub: 'across all subjects' },
        { label: 'Subjects', value: subjects.length, sub: 'being tracked' },
        { label: 'Topics Tested', value: `${testedTopics} / ${totalTopics}`, sub: 'syllabus coverage' },
        { label: 'Total Assessments', value: totalAssessments, sub: 'entries logged' },
      ].map(({ label, value, sub }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ subjects, syllabusTopics, assessmentEntries, allSubjectsAnalytics, onSelectSubject }) {
  const hasData = subjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Academic Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Your full academic performance dashboard</p>
      </div>

      {/* Global stats */}
      {hasData && <GlobalStats subjects={subjects} allSubjectsAnalytics={allSubjectsAnalytics} />}

      {/* Subject cards */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">My Subjects</h2>
        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No subjects yet</p>
            <p className="text-sm mt-1">Add a subject from the sidebar to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {subjects.map(subj => (
              <SubjectCard
                key={subj.id}
                subject={subj}
                analytics={allSubjectsAnalytics[subj.id] ?? { subjectStats: { subjectEWMA: null, testedTopicsCount: 0, totalTopics: 0, errorPercentages: {}, primaryLeak: null }, topicStatsMap: {}, topics: [] }}
                onSelect={onSelectSubject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Multi-subject profile chart */}
      {assessmentEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Academic Performance Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">EWMA mastery trend over time — all subjects</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-4">
            <ProfileChart subjects={subjects} assessmentEntries={assessmentEntries} />
          </div>
          {/* Subject colour legend strip */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4">
            {subjects.map(subj => (
              <button key={subj.id} onClick={() => onSelectSubject(subj.id)}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 group">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS[subj.colorTheme] }} />
                <span className="group-hover:underline">{subj.name}</span>
                <span className="text-slate-400">
                  {allSubjectsAnalytics[subj.id]?.subjectStats?.subjectEWMA?.toFixed(0) ?? '—'}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
