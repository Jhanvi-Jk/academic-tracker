export const EWMA_ALPHA = 0.45;

export function normalizeScore(marksObtained, totalMarks) {
  if (!totalMarks || totalMarks === 0) return 0;
  return (marksObtained / totalMarks) * 100;
}

function effectiveAlpha(weight) {
  return Math.min(EWMA_ALPHA * weight, 0.85);
}

export function calculateEWMA(assessments) {
  if (!assessments || assessments.length === 0) return null;
  const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
  let ewma = sorted[0].normalizedPercentage;
  for (let i = 1; i < sorted.length; i++) {
    const a = effectiveAlpha(sorted[i].weight);
    ewma = a * sorted[i].normalizedPercentage + (1 - a) * ewma;
  }
  return ewma;
}

export function calculateWeightedAvg(assessments) {
  if (!assessments || assessments.length === 0) return null;
  const totalWeight = assessments.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return null;
  return assessments.reduce((s, a) => s + a.normalizedPercentage * a.weight, 0) / totalWeight;
}

export function calculateVelocity(assessments) {
  if (!assessments || assessments.length < 2) return 0;
  const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestScore = sorted[sorted.length - 1].normalizedPercentage;

  let prevEWMA = sorted[0].normalizedPercentage;
  for (let i = 1; i < sorted.length - 1; i++) {
    const a = effectiveAlpha(sorted[i].weight);
    prevEWMA = a * sorted[i].normalizedPercentage + (1 - a) * prevEWMA;
  }
  return latestScore - prevEWMA;
}

export function getMomentumQuadrant(ewma, velocity, weightedAvg, assessments) {
  if (ewma === null || ewma === undefined) return 'untested';
  const sorted = assessments ? [...assessments].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const latestScore = sorted[0]?.normalizedPercentage ?? 0;

  if (ewma >= 80 && velocity >= -3) return 'mastered';
  if (ewma < 80 && velocity >= 5) return 'improving';
  if ((weightedAvg ?? 0) >= 75 && (velocity <= -8 || (weightedAvg - latestScore) >= 10)) return 'at_risk';
  if (ewma < 70 && velocity < 5) return 'critical_gap';
  if (ewma >= 70 && ewma < 80) return 'improving';
  return 'at_risk';
}

export function computeTopicStats(topicAssessments) {
  if (!topicAssessments || topicAssessments.length === 0) {
    return { ewma: null, weightedAvg: null, velocity: 0, quadrant: 'untested', lastAssessedDate: null, termAverages: {} };
  }

  const ewma = calculateEWMA(topicAssessments);
  const weightedAvg = calculateWeightedAvg(topicAssessments);
  const velocity = calculateVelocity(topicAssessments);
  const quadrant = getMomentumQuadrant(ewma, velocity, weightedAvg, topicAssessments);

  const sorted = [...topicAssessments].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastAssessedDate = sorted[0]?.date ?? null;

  const termBuckets = {};
  topicAssessments.forEach(a => {
    if (!termBuckets[a.term]) termBuckets[a.term] = { wSum: 0, wTotal: 0 };
    termBuckets[a.term].wSum += a.normalizedPercentage * a.weight;
    termBuckets[a.term].wTotal += a.weight;
  });
  const termAverages = {};
  Object.entries(termBuckets).forEach(([term, { wSum, wTotal }]) => {
    termAverages[term] = wSum / wTotal;
  });

  return { ewma, weightedAvg, velocity, quadrant, lastAssessedDate, termAverages };
}

export function computeSubjectStats(assessments, syllabusTopics) {
  const sortedAll = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));

  let subjectEWMA = null;
  if (sortedAll.length > 0) {
    subjectEWMA = sortedAll[0].normalizedPercentage;
    for (let i = 1; i < sortedAll.length; i++) {
      const a = effectiveAlpha(sortedAll[i].weight);
      subjectEWMA = a * sortedAll[i].normalizedPercentage + (1 - a) * subjectEWMA;
    }
  }

  const testedTopicIds = new Set(assessments.map(a => a.topicId));
  const totalTopics = syllabusTopics.length;
  const testedTopicsCount = syllabusTopics.filter(t => testedTopicIds.has(t.id)).length;

  const errorTotals = {
    'Conceptual Gap': 0,
    'Careless / Calculation': 0,
    'Time Management': 0,
    'Misread Question': 0,
  };
  let totalLostMarks = 0;

  assessments.forEach(a => {
    const lost = a.totalMarks - a.marksObtained;
    if (lost > 0 && a.errorTags && a.errorTags.length > 0) {
      const perTag = lost / a.errorTags.length;
      a.errorTags.forEach(tag => {
        if (errorTotals[tag] !== undefined) errorTotals[tag] += perTag;
      });
      totalLostMarks += lost;
    }
  });

  const errorPercentages = {};
  if (totalLostMarks > 0) {
    Object.entries(errorTotals).forEach(([k, v]) => {
      errorPercentages[k] = (v / totalLostMarks) * 100;
    });
  }

  const primaryLeak = totalLostMarks > 0
    ? Object.entries(errorPercentages).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return { subjectEWMA, testedTopicsCount, totalTopics, errorPercentages, primaryLeak, totalLostMarks };
}

export function getStalenessInfo(lastAssessedDate, threshold = 30) {
  if (!lastAssessedDate) return { isStale: false, daysAgo: null };
  const now = new Date();
  const daysAgo = Math.floor((now - new Date(lastAssessedDate)) / (1000 * 60 * 60 * 24));
  return { isStale: daysAgo > threshold, daysAgo };
}

export function getTopicPriorityQueue(topicStatsMap, syllabusTopics) {
  return syllabusTopics
    .map(topic => {
      // Skip upcoming topics and untested topics
      if (topic.upcoming) return null;
      const stats = topicStatsMap[topic.id];
      if (!stats || stats.quadrant === 'untested') return null;
      const { isStale, daysAgo } = getStalenessInfo(stats.lastAssessedDate);
      let priority = 0;
      if (stats.quadrant === 'critical_gap') priority = 100 - (stats.ewma ?? 50) + (isStale ? daysAgo * 0.5 : 0);
      else if (stats.quadrant === 'at_risk') priority = 70 + (isStale ? daysAgo * 0.3 : 0);
      else if (stats.quadrant === 'improving') priority = 30;
      else priority = 5;
      return { topic, stats, priority, isStale, daysAgo };
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

export function computeWhatIfRequired(entries, subjectId, targetPercentage, nextWeight) {
  const subjectEntries = entries.filter(e => e.subjectId === subjectId);
  const currentTotalWeight = subjectEntries.reduce((s, e) => s + e.weight, 0);
  const currentWeightedSum = subjectEntries.reduce((s, e) => s + e.normalizedPercentage * e.weight, 0);
  const currentAvg = currentTotalWeight > 0 ? currentWeightedSum / currentTotalWeight : null;

  if (currentTotalWeight === 0) {
    return { required: targetPercentage, feasible: true, currentAvg: null };
  }

  const required = (targetPercentage * (currentTotalWeight + nextWeight) - currentWeightedSum) / nextWeight;
  return { required: Math.max(0, Math.min(100, required)), feasible: required <= 100, currentAvg };
}

export function getTrajectoryData(assessments) {
  const sorted = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sorted.length === 0) return [];
  let ewma = sorted[0].normalizedPercentage;
  return sorted.map((a, idx) => {
    if (idx > 0) {
      const alpha = effectiveAlpha(a.weight);
      ewma = alpha * a.normalizedPercentage + (1 - alpha) * ewma;
    }
    return {
      date: a.date,
      name: a.assessmentName.length > 20 ? a.assessmentName.slice(0, 20) + '…' : a.assessmentName,
      fullName: a.assessmentName,
      score: Math.round(a.normalizedPercentage * 10) / 10,
      ewma: Math.round(ewma * 10) / 10,
      term: a.term,
      topicId: a.topicId,
      weight: a.weight,
    };
  });
}

export const QUADRANT_META = {
  mastered:     { label: 'Mastered',    color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
  improving:    { label: 'Improving',   color: 'sky',     bg: 'bg-sky-100 dark:bg-sky-900/40',         text: 'text-sky-800 dark:text-sky-300',           border: 'border-sky-300 dark:border-sky-700',         dot: 'bg-sky-500' },
  at_risk:      { label: 'At Risk',     color: 'amber',   bg: 'bg-amber-100 dark:bg-amber-900/40',     text: 'text-amber-800 dark:text-amber-300',       border: 'border-amber-300 dark:border-amber-700',     dot: 'bg-amber-500' },
  critical_gap: { label: 'Critical Gap',color: 'rose',    bg: 'bg-rose-100 dark:bg-rose-900/40',       text: 'text-rose-800 dark:text-rose-300',         border: 'border-rose-300 dark:border-rose-700',       dot: 'bg-rose-500' },
  untested:     { label: 'Untested',    color: 'zinc',    bg: 'bg-zinc-100 dark:bg-zinc-800',          text: 'text-zinc-500 dark:text-zinc-400',         border: 'border-zinc-200 dark:border-zinc-700',       dot: 'bg-zinc-400' },
  upcoming:     { label: 'Coming Up',   color: 'zinc',    bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-400 dark:text-slate-500',       border: 'border-slate-200 dark:border-slate-700',     dot: 'bg-slate-300 dark:bg-slate-600' },
};

// Returns the display quadrant, taking `upcoming` flag into account
export function getEffectiveQuadrant(stats, topic) {
  if (topic?.upcoming && (!stats || stats.quadrant === 'untested')) {
    return 'upcoming';
  }
  return stats?.quadrant ?? 'untested';
}

export function getHeatmapStyle(value) {
  if (value === null || value === undefined) return 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600';
  if (value >= 85) return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold';
  if (value >= 70) return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  if (value >= 55) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
  return 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 font-semibold';
}
