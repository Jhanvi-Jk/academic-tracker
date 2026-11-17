import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { QUADRANT_META, getStalenessInfo, getTopicPriorityQueue, computeWhatIfRequired, getHeatmapStyle } from '../utils/analyticsEngine.js';

const CHART_COLORS = { 'Conceptual Gap': '#f43f5e', 'Careless / Calculation': '#f97316', 'Time Management': '#a855f7', 'Misread Question': '#3b82f6' };

// ── Priority Queue ────────────────────────────────────────────────────────────
function PriorityQueue({ topics, topicStatsMap, entries }) {
  const queue = useMemo(() => getTopicPriorityQueue(topicStatsMap, topics), [topicStatsMap, topics]);

  if (queue.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 text-sm">
      Add assessments to generate priority recommendations.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800">Priority Study Queue</h3>
        <span className="text-xs text-slate-400 ml-1">— Top topics to study next</span>
      </div>
      <div className="divide-y divide-slate-100">
        {queue.map(({ topic, stats, isStale, daysAgo }, i) => {
          const qMeta = QUADRANT_META[stats.quadrant];
          const topicEntries = entries.filter(e => e.topicId === topic.id);
          const errorTagCounts = {};
          topicEntries.forEach(e => e.errorTags.forEach(t => { errorTagCounts[t] = (errorTagCounts[t] ?? 0) + 1; }));
          const topError = Object.entries(errorTagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

          return (
            <div key={topic.id} className="px-5 py-4 flex items-start gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-rose-100 text-rose-700' : i === 1 ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{topic.topicName}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
                    {qMeta.label}
                  </span>
                  {isStale && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Stale {daysAgo}d ago</span>}
                </div>
                <p className="text-xs text-slate-600">
                  EWMA: <span className="font-semibold">{stats.ewma?.toFixed(1) ?? '—'}%</span>
                  {' · '}
                  Weighted Avg: <span className="font-semibold">{stats.weightedAvg?.toFixed(1) ?? '—'}%</span>
                  {' · '}
                  Velocity: <span className={`font-semibold ${(stats.velocity ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(stats.velocity ?? 0) >= 0 ? '+' : ''}{(stats.velocity ?? 0).toFixed(1)}%
                  </span>
                </p>
                {topError && (
                  <p className="text-xs text-slate-500 mt-1">
                    Primary error: <span className="text-rose-600 font-medium">{topError}</span> ({errorTagCounts[topError]} occurrence{errorTagCounts[topError] > 1 ? 's' : ''})
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

// ── Trajectory Chart ──────────────────────────────────────────────────────────
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
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2.5 text-xs space-y-1 min-w-48">
        <p className="font-semibold text-slate-800">{d?.fullName}</p>
        <p className="text-slate-500">{d?.date} · {d?.term}</p>
        {d?.topicId && topicMap[d.topicId] && <p className="text-sky-700">Topic: {topicMap[d.topicId].topicName}</p>}
        <p>Score: <span className="font-semibold">{d?.score}%</span></p>
        <p>EWMA: <span className="font-semibold text-sky-600">{d?.ewma}%</span></p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-800">Score Trajectory & EWMA Trend</h3>
        </div>
        <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none" value={filterTopicId} onChange={e => setFilterTopicId(e.target.value)}>
          <option value="all">All Assessments</option>
          {topics.map(t => <option key={t.id} value={t.id}>{t.topicName}</option>)}
        </select>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data to display</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
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

// ── Topics Bar Chart ──────────────────────────────────────────────────────────
function TopicsBarChart({ topics, topicStatsMap, target }) {
  const data = topics
    .map(t => ({ name: t.topicName.length > 18 ? t.topicName.slice(0, 18) + '…' : t.topicName, ewma: topicStatsMap[t.id]?.ewma ?? null, quadrant: topicStatsMap[t.id]?.quadrant ?? 'untested' }))
    .filter(d => d.ewma !== null)
    .sort((a, b) => (b.ewma ?? 0) - (a.ewma ?? 0));

  const qColors = { mastered: '#10b981', improving: '#0ea5e9', at_risk: '#f59e0b', critical_gap: '#f43f5e', untested: '#94a3b8' };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const qMeta = QUADRANT_META[d?.quadrant ?? 'untested'];
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold mb-1">{d?.name}</p>
        <p>EWMA: <span className="font-semibold">{d?.ewma?.toFixed(1)}%</span></p>
        <p className={qMeta.text}>Status: {qMeta.label}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Topic EWMA Rankings</h3>
        <p className="text-xs text-slate-400 mt-0.5">Sorted by mastery, coloured by quadrant</p>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No assessed topics yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
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

// ── Error Breakdown ───────────────────────────────────────────────────────────
function ErrorBreakdown({ subjectStats }) {
  const { errorPercentages, primaryLeak, totalLostMarks } = subjectStats;
  const data = Object.entries(errorPercentages).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }));

  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-slate-400 text-sm text-center h-full min-h-48">
      <p>No error tags recorded yet.</p>
      <p className="text-xs mt-1">Tag assessments with error reasons to see the breakdown.</p>
    </div>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold">{payload[0].name}</p>
        <p>{payload[0].value?.toFixed(1)}% of lost marks</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Root-Cause Error Breakdown</h3>
        {primaryLeak && (
          <p className="text-xs text-slate-500 mt-0.5">
            Primary leak: <span className="text-rose-600 font-semibold">{primaryLeak}</span>
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
                <span className="text-slate-700 font-medium">{name}</span>
                <span className="font-semibold" style={{ color: CHART_COLORS[name] }}>{value.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: CHART_COLORS[name] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Blind Spots Panel ─────────────────────────────────────────────────────────
function BlindSpotsPanel({ topics, topicStatsMap }) {
  const untested = topics.filter(t => topicStatsMap[t.id]?.quadrant === 'untested');
  const stale = topics.filter(t => {
    const stats = topicStatsMap[t.id];
    if (!stats || stats.quadrant === 'untested') return false;
    return getStalenessInfo(stats.lastAssessedDate).isStale;
  });

  if (untested.length === 0 && stale.length === 0) return (
    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 flex items-center gap-3">
      <span className="text-2xl">✓</span>
      <div>
        <p className="font-semibold text-emerald-800 text-sm">Great coverage!</p>
        <p className="text-xs text-emerald-700">All topics are tested and no staleness detected.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800">Syllabus Blind Spots & Decay Warnings</h3>
      </div>
      <div className="p-4 space-y-3">
        {untested.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Untested Topics</p>
            <div className="flex flex-wrap gap-2">
              {untested.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-full text-xs font-medium border border-zinc-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  {t.topicName}
                </span>
              ))}
            </div>
          </div>
        )}
        {stale.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2">Memory Decay Risk (&gt;30 days)</p>
            <div className="flex flex-wrap gap-2">
              {stale.map(t => {
                const { daysAgo } = getStalenessInfo(topicStatsMap[t.id]?.lastAssessedDate);
                return (
                  <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium border border-violet-200">
                    <Clock className="w-3 h-3" />
                    {t.topicName} <span className="text-violet-500">({daysAgo}d)</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── What-If Simulator ─────────────────────────────────────────────────────────
function WhatIfSimulator({ subject, topics, topicStatsMap, entries, subjectStats }) {
  const [targetPct, setTargetPct] = useState(subject.targetPercentage);
  const [nextWeight, setNextWeight] = useState(2);
  const [boostTopics, setBoostTopics] = useState({});

  const { required, feasible, currentAvg } = useMemo(() =>
    computeWhatIfRequired(entries, subject.id, targetPct, nextWeight),
    [entries, subject.id, targetPct, nextWeight]
  );

  const criticalTopics = topics
    .filter(t => ['critical_gap', 'at_risk'].includes(topicStatsMap[t.id]?.quadrant))
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
      if (prev[topicId] !== undefined) {
        const { [topicId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [topicId]: Math.min(100, (currentEWMA ?? 50) + 25) };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Target className="w-4 h-4 text-sky-500" />
        <h3 className="text-sm font-semibold text-slate-800">Target Grade What-If Simulator</h3>
      </div>
      <div className="p-5 space-y-5">
        {/* Target slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600">Target Subject Average</label>
            <span className="text-sm font-bold text-sky-600">{targetPct}%</span>
          </div>
          <input type="range" min="50" max="100" value={targetPct} onChange={e => setTargetPct(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-sky-100 accent-sky-500" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>50%</span><span>100%</span></div>
        </div>

        {/* Current vs target */}
        <div className="flex gap-4">
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Current Avg</p>
            <p className="text-xl font-bold text-slate-800">{currentAvg?.toFixed(1) ?? '—'}%</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Target</p>
            <p className="text-xl font-bold text-sky-600">{targetPct}%</p>
          </div>
          <div className={`flex-1 rounded-xl p-3 text-center border ${feasible ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <p className="text-xs text-slate-500 mb-1">Gap</p>
            <p className={`text-xl font-bold ${feasible ? 'text-emerald-700' : 'text-rose-700'}`}>
              {currentAvg !== null ? ((currentAvg - targetPct) >= 0 ? '+' : '') + (currentAvg - targetPct).toFixed(1) + '%' : '—'}
            </p>
          </div>
        </div>

        {/* Next FA required */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Required on Next Assessment</p>
          <div className="flex gap-2 items-center mb-3">
            {[1, 2, 3].map(w => (
              <button key={w} type="button" onClick={() => setNextWeight(w)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${nextWeight === w ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
              >
                {w}× {w === 1 ? 'Quick' : w === 2 ? 'FA' : 'Major'}
              </button>
            ))}
          </div>
          <div className={`rounded-xl p-4 text-center border ${feasible ? 'bg-sky-50 border-sky-200' : 'bg-rose-50 border-rose-200'}`}>
            {entries.length === 0 ? (
              <p className="text-sm text-slate-500">Add assessments to simulate.</p>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-1">Score needed on next {nextWeight}× assessment</p>
                <p className={`text-3xl font-black ${feasible ? 'text-sky-700' : 'text-rose-700'}`}>{required.toFixed(1)}%</p>
                {!feasible && <p className="text-xs text-rose-600 mt-1">Not achievable in one FA — requires sustained improvement</p>}
              </>
            )}
          </div>
        </div>

        {/* Topic boost toggles */}
        {criticalTopics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Simulate Topic Improvements</p>
            <div className="space-y-2">
              {criticalTopics.map(t => {
                const stats = topicStatsMap[t.id];
                const isActive = boostTopics[t.id] !== undefined;
                return (
                  <div key={t.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    onClick={() => toggleBoost(t.id, stats?.ewma)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{t.topicName}</p>
                      <p className="text-xs text-slate-500">{stats?.ewma?.toFixed(0) ?? '?'}% → {isActive ? boostTopics[t.id] : (Math.min(100, (stats?.ewma ?? 50) + 25)).toFixed(0)}%</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                      {isActive && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(boostTopics).length > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-700">Projected Subject EWMA with improvements:</p>
                <p className="text-2xl font-black text-emerald-700">{simulatedEWMA?.toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Tab2 ─────────────────────────────────────────────────────────────────
export default function Tab2Analytics({ subject, topics, entries, terms, topicStatsMap, subjectStats, trajectoryData }) {
  return (
    <div className="space-y-5">
      {/* Priority Queue */}
      <PriorityQueue topics={topics} topicStatsMap={topicStatsMap} entries={entries} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <TrajectoryChart entries={entries} trajectoryData={trajectoryData} topics={topics} target={subject.targetPercentage} />
        <TopicsBarChart topics={topics} topicStatsMap={topicStatsMap} target={subject.targetPercentage} />
      </div>

      {/* Error + Blind Spots row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ErrorBreakdown subjectStats={subjectStats} />
        <BlindSpotsPanel topics={topics} topicStatsMap={topicStatsMap} />
      </div>

      {/* What-If Simulator */}
      <WhatIfSimulator subject={subject} topics={topics} topicStatsMap={topicStatsMap} entries={entries} subjectStats={subjectStats} />
    </div>
  );
}
