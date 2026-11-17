import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { QUADRANT_META, getStalenessInfo, getEffectiveQuadrant } from '../utils/analyticsEngine.js';

export default function KPIHeader({ subject, subjectStats, topicStatsMap, activeTopics }) {
  const { subjectEWMA, testedTopicsCount, totalTopics } = subjectStats;
  const ewmaDisplay = subjectEWMA !== null ? subjectEWMA.toFixed(1) : '—';
  const coverageRatio = `${testedTopicsCount} / ${totalTopics}`;
  const coveragePct = totalTopics > 0 ? (testedTopicsCount / totalTopics) * 100 : 0;

  const quadrantCounts = { mastered: 0, improving: 0, at_risk: 0, critical_gap: 0, untested: 0, upcoming: 0 };
  activeTopics.forEach(t => {
    const q = getEffectiveQuadrant(topicStatsMap[t.id], t);
    quadrantCounts[q] = (quadrantCounts[q] ?? 0) + 1;
  });

  const priorityOrder = ['critical_gap', 'at_risk', 'improving', 'mastered', 'untested'];
  const dominantQuadrant = priorityOrder.find(q => quadrantCounts[q] > 0) ?? 'untested';
  const qMeta = QUADRANT_META[dominantQuadrant];

  const staleCount = activeTopics.filter(t => {
    if (t.upcoming) return false;
    const stats = topicStatsMap[t.id];
    if (!stats || !stats.lastAssessedDate) return false;
    return getStalenessInfo(stats.lastAssessedDate).isStale;
  }).length;

  const TrendIcon = subjectEWMA === null ? Minus : (subjectEWMA >= subject.targetPercentage ? TrendingUp : TrendingDown);
  const trendColor = subjectEWMA === null ? 'text-slate-400' : (subjectEWMA >= subject.targetPercentage ? 'text-emerald-500' : 'text-rose-500');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{subject.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{subject.targetPercentage}%</span>
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${qMeta.bg} ${qMeta.text} ${qMeta.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${qMeta.dot}`} />
          {qMeta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
        {/* EWMA */}
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-1">EWMA Mastery</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold tabular-nums ${subjectEWMA !== null && subjectEWMA >= subject.targetPercentage ? 'text-emerald-600 dark:text-emerald-400' : subjectEWMA !== null && subjectEWMA < 70 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
              {ewmaDisplay}
            </span>
            {subjectEWMA !== null && <span className="text-sm text-slate-400 pb-1">%</span>}
            <TrendIcon className={`w-5 h-5 pb-0.5 ${trendColor}`} />
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${subjectEWMA !== null && subjectEWMA >= subject.targetPercentage ? 'bg-emerald-500' : subjectEWMA !== null && subjectEWMA < 70 ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, subjectEWMA ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Coverage */}
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-1">Syllabus Coverage</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-white tabular-nums">{coverageRatio}</span>
            <span className="text-sm text-slate-400 pb-1">Topics</span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${coveragePct}%` }} />
          </div>
        </div>

        {/* Quadrant breakdown */}
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-2">Topic Status</p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(quadrantCounts).filter(([q, v]) => v > 0 && q !== 'upcoming').map(([q, count]) => {
              const m = QUADRANT_META[q];
              return (
                <span key={q} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`}>
                  <span className={`w-1 h-1 rounded-full ${m.dot}`} />
                  {count} {m.label}
                </span>
              );
            })}
            {quadrantCounts.upcoming > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700">
                {quadrantCounts.upcoming} Coming Up
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider mb-2">Alerts</p>
          <div className="space-y-1.5">
            {quadrantCounts.untested > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                {quadrantCounts.untested} untested topic{quadrantCounts.untested > 1 ? 's' : ''}
              </div>
            )}
            {staleCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                {staleCount} stale (&gt;30 days)
              </div>
            )}
            {quadrantCounts.critical_gap > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                {quadrantCounts.critical_gap} critical gap{quadrantCounts.critical_gap > 1 ? 's' : ''}
              </div>
            )}
            {quadrantCounts.untested === 0 && staleCount === 0 && quadrantCounts.critical_gap === 0 && (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                All clear!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
