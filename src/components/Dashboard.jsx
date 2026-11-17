import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ArrowRight, BookOpen, TrendingUp, TrendingDown, Minus, GraduationCap } from 'lucide-react';
import { QUADRANT_META, getStalenessInfo, getEffectiveQuadrant } from '../utils/analyticsEngine.js';

const THEME_COLORS = {
  sky:    '#0ea5e9',
  violet: '#8b5cf6',
  emerald:'#10b981',
  rose:   '#f43f5e',
  amber:  '#f59e0b',
  indigo: '#6366f1',
};

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

function SubjectCard({ subject, analytics, onSelect }) {
  const { subjectStats, topicStatsMap, topics } = analytics;
  const { subjectEWMA, testedTopicsCount, totalTopics } = subjectStats;
  const color = THEME_COLORS[subject.colorTheme] ?? THEME_COLORS.sky;
  const coveragePct = totalTopics > 0 ? (testedTopicsCount / totalTopics) * 100 : 0;

  const qCounts = { mastered: 0, improving: 0, at_risk: 0, critical_gap: 0, untested: 0, upcoming: 0 };
  topics.forEach(t => {
    const q = getEffectiveQuadrant(topicStatsMap[t.id], t);
    qCounts[q] = (qCounts[q] ?? 0) + 1;
  });

  const staleCount = topics.filter(t => {
    if (t.upcoming) return false;
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
      className="group w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Coloured top accent */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '18' }}>
              <BookOpen className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{subject.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{totalTopics} topics · target {subject.targetPercentage}%</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${qMeta.dot}`} />
            {qMeta.label}
          </span>
        </div>

        {/* EWMA big number */}
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mb-1">EWMA Mastery</p>
            <div className="flex items-end gap-1.5">
              <span className={`text-4xl font-black leading-none tabular-nums ${subjectEWMA === null ? 'text-slate-300 dark:text-slate-700' : (subjectEWMA >= subject.targetPercentage ? 'text-emerald-600 dark:text-emerald-400' : subjectEWMA < 70 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white')}`}>
                {subjectEWMA !== null ? subjectEWMA.toFixed(1) : '—'}
              </span>
              {subjectEWMA !== null && <span className="text-sm text-slate-400 pb-1">%</span>}
              <TrendIcon className={`w-5 h-5 pb-0.5 ${trendCls}`} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Coverage</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{testedTopicsCount} / {totalTopics}</p>
            <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${coveragePct}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>

        {/* Progress to target bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
            <span>Progress to {subject.targetPercentage}%</span>
            {subjectEWMA !== null && (
              <span className={`font-semibold ${ewmaVsTarget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {ewmaVsTarget >= 0 ? '+' : ''}{ewmaVsTarget?.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            {subjectEWMA !== null && (
              <>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, subjectEWMA)}%`, backgroundColor: color + 'cc' }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500/50 dark:bg-slate-400/30 rounded"
                  style={{ left: `${Math.min(100, subject.targetPercentage)}%` }} />
              </>
            )}
          </div>
        </div>

        {/* Topic status pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(qCounts).filter(([q, v]) => v > 0 && q !== 'upcoming').map(([q, count]) => {
            const m = QUADRANT_META[q];
            return (
              <span key={q} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
                <span className={`w-1 h-1 rounded-full ${m.dot}`} />
                {count} {m.label}
              </span>
            );
          })}
          {qCounts.upcoming > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700">
              {qCounts.upcoming} Coming Up
            </span>
          )}
          {staleCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-700">
              {staleCount} Stale
            </span>
          )}
        </div>

        <div className="flex items-center justify-end text-sm font-semibold gap-1 group-hover:gap-2 transition-all" style={{ color }}>
          View <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

function ProfileChart({ subjects, assessmentEntries }) {
  const chartData = useMemo(() => buildProfileChart(subjects, assessmentEntries), [subjects, assessmentEntries]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl px-4 py-3 text-xs space-y-1.5 min-w-44">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-28">{p.name}</span>
            </div>
            <span className="font-bold" style={{ color: p.color }}>{p.value?.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-slate-400 dark:text-slate-600 text-sm gap-2">
        <TrendingUp className="w-8 h-8 opacity-30" />
        <p>Add assessments to see your profile chart appear here.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
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

function GlobalStats({ subjects, allSubjectsAnalytics }) {
  const totalAssessments = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.entries.length, 0);
  const totalTopics = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.topics.length, 0);
  const testedTopics = Object.values(allSubjectsAnalytics).reduce((s, a) => s + a.subjectStats.testedTopicsCount, 0);
  const allEWMAs = subjects.map(s => allSubjectsAnalytics[s.id]?.subjectStats?.subjectEWMA).filter(e => e !== null);
  const overallEWMA = allEWMAs.length > 0 ? allEWMAs.reduce((a, b) => a + b, 0) / allEWMAs.length : null;

  const stats = [
    { label: 'Overall EWMA', value: overallEWMA !== null ? `${overallEWMA.toFixed(1)}%` : '—', sub: 'across active subjects', accent: overallEWMA !== null ? (overallEWMA >= 80 ? 'text-emerald-600 dark:text-emerald-400' : overallEWMA >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400') : 'text-slate-300 dark:text-slate-700' },
    { label: 'Subjects', value: subjects.length, sub: 'being tracked', accent: 'text-slate-800 dark:text-white' },
    { label: 'Topics Tested', value: `${testedTopics} / ${totalTopics}`, sub: 'syllabus coverage', accent: 'text-slate-800 dark:text-white' },
    { label: 'Assessments', value: totalAssessments, sub: 'entries logged', accent: 'text-slate-800 dark:text-white' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, sub, accent }) => (
        <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 px-4 py-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">{label}</p>
          <p className={`text-2xl font-black mt-1.5 tabular-nums ${accent}`}>{value}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ subjects, syllabusTopics, assessmentEntries, allSubjectsAnalytics, onSelectSubject }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-sky-500/10 pointer-events-none" />
        <div className="absolute right-10 bottom-0 w-48 h-48 rounded-full bg-violet-500/8 pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-emerald-500/8 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-sky-400" />
            <span className="text-sky-400 text-sm font-semibold tracking-wide">IB Academic Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">My Subjects</h1>
          <p className="text-slate-400 text-sm">{today}</p>
        </div>
      </div>

      {/* Global stats */}
      <GlobalStats subjects={subjects} allSubjectsAnalytics={allSubjectsAnalytics} />

      {/* Subject grid */}
      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No subjects yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Add a subject from the sidebar to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map(subj => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              analytics={allSubjectsAnalytics[subj.id] ?? {
                subjectStats: { subjectEWMA: null, testedTopicsCount: 0, totalTopics: 0, errorPercentages: {}, primaryLeak: null },
                topicStatsMap: {},
                topics: [],
                entries: [],
              }}
              onSelect={onSelectSubject}
            />
          ))}
        </div>
      )}

      {/* Profile chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Academic Performance Profile</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">EWMA mastery trend over time — all subjects</p>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-4">
          <ProfileChart subjects={subjects} assessmentEntries={assessmentEntries} />
        </div>
        {subjects.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
            {subjects.map(subj => (
              <button key={subj.id} onClick={() => onSelectSubject(subj.id)}
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white group transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: THEME_COLORS[subj.colorTheme] }} />
                <span className="group-hover:underline">{subj.name}</span>
                <span className="text-slate-400 dark:text-slate-600">
                  {allSubjectsAnalytics[subj.id]?.subjectStats?.subjectEWMA?.toFixed(0) ?? '—'}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
