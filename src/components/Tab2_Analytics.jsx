import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { QUADRANT_META, getStalenessInfo, getTopicPriorityQueue, computeWhatIfRequired, getHeatmapStyle } from '../utils/analyticsEngine.js';

const CHART_COLORS = { 'Conceptual Gap': '#f43f5e', 'Careless / Calculation': '#f97316', 'Time Management': '#a855f7', 'Misread Question': '#3b82f6' };

function PriorityQueue({ topics, topicStatsMap, entries }) {
  const queue = useMemo(() => getTopicPriorityQueue(topicStatsMap, topics), [topicStatsMap, topics]);

  if (queue.length === 0) return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 text-center text-slate-400 dark:text-slate-600 text-sm">
      Add assessments to generate priority study recommendations.
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Priority Study Queue</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">— top topics to focus on</span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {queue.map(({ topic, stats, isStale, daysAgo }, i) => {
          const qMeta = QUADRANT_META[stats.quadrant];
          const topicEntries = entries.filter(e => e.topicId === topic.id);
          const errorTagCounts = {};
          topicEntries.forEach(e => e.errorTags.forEach(t => { errorTagCounts[t] = (errorTagCounts[t] ?? 0) + 1; }));
          const topError = Object.entries(errorTagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

          return (
            <div key={topic.id} className="px-5 py-4 flex items-start gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' : i === 1 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">{topic.topicName}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
                    {qMeta.label}
                  </span>
                  {isStale && <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full">Stale {daysAgo}d ago</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  EWMA: <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.ewma?.toFixed(1) ?? '—'}%</span>
                  {' · '}
                  Weighted Avg: <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.weightedAvg?.toFixed(1) ?? '—'}%</span>
                  {' · '}
                  Velocity: <span className={`font-semibold ${(stats.velocity ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {(stats.velocity ?? 0) >= 0 ? '+' : ''}{(stats.velocity ?? 0).toFixed(1)}%
                  </span>
                </p>
                {topError && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Primary error: <span className="text-rose-600 dark:text-rose-400 font-medium">{topError}</span> ({errorTagCounts[topError]}×)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrajectoryChart({ entries, trajectoryData, topics, target }) {
  const [filterTopicId, setFilterTopicId] = useState('all');
  const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));
  const data = useMemo(() => {
    if (filterTopicId === 'all') return trajectoryData;
    return trajectoryData.filter(d => d.topicId === filterTopicId);
  }, [trajectoryData, filterTopicId]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl px-3 py-2.5 text-xs space-y-1 min-w-48">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{d?.fullName}</p>
        <p className="text-slate-500 dark:text-slate-400">{d?.date} · {d?.term}</p>
        {d?.topicId && topicMap[d.topicId] && <p className="text-sky-600 dark:text-sky-400">Topic: {topicMap[d.topicId].topicName}</p>}
        <p className="text-slate-700 dark:text-slate-300">Score: <span className="font-semibold">{d?.score}%</span></p>
        <p className="text-sky-600 dark:text-sky-400">EWMA: <span className="font-semibold">{d?.ewma}%</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Score Trajectory & EWMA Trend</h3>
        </div>
        <select
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          value={filterTopicId} onChange={e => setFilterTopicId(e.target.value)}
        >
          <option value="all">All Assessments</option>
          {topics.filter(t => !t.upcoming).map(t => <option key={t.id} value={t.id}>{t.topicName}</option>)}
        </select>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No data to display</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={target} stroke="#10b981" strokeDasharray="5 5" label={{ value: `Target ${target}%`, fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="score" stroke="#94a3b8" strokeWidth={1.5} dot={{ r: 3, fill: '#94a3b8' }} name="Score" />
              <Line type="monotone" dataKey="ewma" stroke="#0ea5e9" strokeWidth={2.5} dot={false} name="EWMA" />
              <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TopicsBarChart({ topics, topicStatsMap, target }) {
  const activetopics = topics.filter(t => !t.upcoming);
  const data = activetopics
    .map(t => ({ name: t.topicName.length > 18 ? t.topicName.slice(0, 18) + '…' : t.topicName, ewma: topicStatsMap[t.id]?.ewma ?? null, quadrant: topicStatsMap[t.id]?.quadrant ?? 'untested' }))
    .filter(d => d.ewma !== null)
    .sort((a, b) => (b.ewma ?? 0) - (a.ewma ?? 0));

  const qColors = { mastered: '#10b981', improving: '#0ea5e9', at_risk: '#f59e0b', critical_gap: '#f43f5e', untested: '#94a3b8' };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const qMeta = QUADRANT_META[d?.quadrant ?? 'untested'];
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{d?.name}</p>
        <p className="text-slate-600 dark:text-slate-400">EWMA: <span className="font-semibold">{d?.ewma?.toFixed(1)}%</span></p>
        <p className={qMeta.text}>Status: {qMeta.label}</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Topic EWMA Rankings</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sorted by mastery, coloured by quadrant</p>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No assessed topics yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={target} stroke="#10b981" strokeDasharray="5 5" />
              <Bar dataKey="ewma" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={qColors[entry.quadrant] ?? '#94a3b8'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function ErrorBreakdown({ subjectStats }) {
  const { errorPercentages, primaryLeak } = subjectStats;
  const data = Object.entries(errorPercentages).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }));

  if (data.length === 0) return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-sm text-center h-full min-h-48">
      <p>No error tags recorded yet.</p>
      <p className="text-xs mt-1">Tag assessments with error reasons to see the breakdown.</p>
    </div>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{payload[0].name}</p>
        <p className="text-slate-600 dark:text-slate-400">{payload[0].value?.toFixed(1)}% of lost marks</p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Root-Cause Error Breakdown</h3>
        {primaryLeak && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Primary leak: <span className="text-rose-600 dark:text-rose-400 font-semibold">{primaryLeak}</span>
            {' '}({errorPercentages[primaryLeak]?.toFixed(0)}% of lost marks)
          </p>
        )}
      </div>
      <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
              {data.map((entry) => <Cell key={entry.name} fill={CHART_COLORS[entry.name] ?? '#94a3b8'} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.sort((a, b) => b.value - a.value).map(({ name, value }) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{name}</span>
                <span className="font-semibold" style={{ color: CHART_COLORS[name] }}>{value.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: CHART_COLORS[name] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlindSpotsPanel({ topics, topicStatsMap }) {
  // Exclude upcoming topics from blind spot warnings
  const activetopics = topics.filter(t => !t.upcoming);
  const untested = activetopics.filter(t => topicStatsMap[t.id]?.quadrant === 'untested');
  const stale = activetopics.filter(t => {
    const stats = topicStatsMap[t.id];
    if (!stats || stats.quadrant === 'untested') return false;
    return getStalenessInfo(stats.lastAssessedDate).isStale;
  });
  const upcoming = topics.filter(t => t.upcoming);

  if (untested.length === 0 && stale.length === 0) return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 flex items-center gap-3">
      <span className="text-2xl">✓</span>
      <div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Great coverage!</p>
        <p className="text-xs text-emerald-700 dark:text-emerald-400">All active topics are tested and no staleness detected.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Syllabus Blind Spots & Decay Warnings</h3>
      </div>
      <div className="p-4 space-y-3">
        {untested.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Untested Topics</p>
            <div className="flex flex-wrap gap-2">
              {untested.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  {t.topicName}
                </span>
              ))}
            </div>
          </div>
        )}
        {stale.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-2">Memory Decay Risk (&gt;30 days)</p>
            <div className="flex flex-wrap gap-2">
              {stale.map(t => {
                const { daysAgo } = getStalenessInfo(topicStatsMap[t.id]?.lastAssessedDate);
                return (
                  <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium border border-violet-200 dark:border-violet-700">
                    <Clock className="w-3 h-3" />
                    {t.topicName} <span className="text-violet-500 dark:text-violet-500">({daysAgo}d)</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Upcoming (not yet taught)</p>
            <div className="flex flex-wrap gap-2">
              {upcoming.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3 h-3" />
                  {t.topicName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WhatIfSimulator({ subject, topics, topicStatsMap, entries, subjectStats }) {
  const [targetPct, setTargetPct] = useState(subject.targetPercentage);
  const [nextWeight, setNextWeight] = useState(2);
  const [boostTopics, setBoostTopics] = useState({});

  const { required, feasible, currentAvg } = useMemo(() =>
    computeWhatIfRequired(entries, subject.id, targetPct, nextWeight),
    [entries, subject.id, targetPct, nextWeight]
  );

  const criticalTopics = topics
    .filter(t => !t.upcoming && ['critical_gap', 'at_risk'].includes(topicStatsMap[t.id]?.quadrant))
    .slice(0, 3);

  const simulatedEWMA = useMemo(() => {
    if (!subjectStats.subjectEWMA) return null;
    let sim = subjectStats.subjectEWMA;
    Object.entries(boostTopics).forEach(([topicId, boostedScore]) => {
      if (boostedScore) {
        const diff = boostedScore - (topicStatsMap[topicId]?.ewma ?? boostedScore);
        sim += diff * 0.08;
      }
    });
    return Math.min(100, sim);
  }, [boostTopics, subjectStats.subjectEWMA, topicStatsMap]);

  const toggleBoost = (topicId, currentEWMA) => {
    setBoostTopics(prev => {
      if (prev[topicId] !== undefined) { const { [topicId]: _, ...rest } = prev; return rest; }
      return { ...prev, [topicId]: Math.min(100, (currentEWMA ?? 50) + 25) };
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Target className="w-4 h-4 text-sky-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Target Grade What-If Simulator</h3>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Subject Average</label>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{targetPct}%</span>
          </div>
          <input type="range" min="50" max="100" value={targetPct} onChange={e => setTargetPct(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-sky-100 dark:bg-sky-900/40 accent-sky-500" />
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1"><span>50%</span><span>100%</span></div>
        </div>

        <div className="flex gap-4">
          {[
            { label: 'Current Avg', value: currentAvg !== null ? `${currentAvg.toFixed(1)}%` : '—', cls: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', textCls: 'text-slate-800 dark:text-white' },
            { label: 'Target', value: `${targetPct}%`, cls: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', textCls: 'text-sky-600 dark:text-sky-400' },
            { label: 'Gap', value: currentAvg !== null ? ((currentAvg - targetPct) >= 0 ? '+' : '') + (currentAvg - targetPct).toFixed(1) + '%' : '—', cls: feasible ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', textCls: feasible ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300' },
          ].map(({ label, value, cls, textCls }) => (
            <div key={label} className={`flex-1 rounded-xl p-3 text-center border ${cls}`}>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold tabular-nums ${textCls}`}>{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Required on Next Assessment</p>
          <div className="flex gap-2 items-center mb-3">
            {[1, 2, 3].map(w => (
              <button key={w} type="button" onClick={() => setNextWeight(w)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${nextWeight === w ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
              >
                {w}× {w === 1 ? 'Quick' : w === 2 ? 'FA' : 'Major'}
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-4 text-center border ${feasible ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
            {entries.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Add assessments to simulate.</p>
            ) : (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Score needed on next {nextWeight}× assessment</p>
                <p className={`text-3xl font-black tabular-nums ${feasible ? 'text-sky-700 dark:text-sky-300' : 'text-rose-700 dark:text-rose-300'}`}>{required.toFixed(1)}%</p>
                {!feasible && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Not achievable in one FA — requires sustained improvement</p>}
              </>
            )}
          </div>
        </div>

        {criticalTopics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Simulate Topic Improvements</p>
            <div className="space-y-2">
              {criticalTopics.map(t => {
                const stats = topicStatsMap[t.id];
                const isActive = boostTopics[t.id] !== undefined;
                return (
                  <div key={t.id}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    onClick={() => toggleBoost(t.id, stats?.ewma)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.topicName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{stats?.ewma?.toFixed(0) ?? '?'}% → {isActive ? boostTopics[t.id] : (Math.min(100, (stats?.ewma ?? 50) + 25)).toFixed(0)}%</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isActive && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(boostTopics).length > 0 && (
              <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Projected Subject EWMA with improvements:</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{simulatedEWMA?.toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tab2Analytics({ subject, topics, entries, terms, topicStatsMap, subjectStats, trajectoryData }) {
  return (
    <div className="space-y-5">
      <PriorityQueue topics={topics} topicStatsMap={topicStatsMap} entries={entries} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <TrajectoryChart entries={entries} trajectoryData={trajectoryData} topics={topics} target={subject.targetPercentage} />
        <TopicsBarChart topics={topics} topicStatsMap={topicStatsMap} target={subject.targetPercentage} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ErrorBreakdown subjectStats={subjectStats} />
        <BlindSpotsPanel topics={topics} topicStatsMap={topicStatsMap} />
      </div>

      <WhatIfSimulator subject={subject} topics={topics} topicStatsMap={topicStatsMap} entries={entries} subjectStats={subjectStats} />
    </div>
  );
}
