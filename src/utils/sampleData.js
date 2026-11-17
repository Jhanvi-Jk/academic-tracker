import { normalizeScore } from './analyticsEngine.js';

function entry(id, subjectId, topicId, term, date, assessmentName, marksObtained, totalMarks, weight, errorTags = []) {
  return { id, subjectId, topicId, term, date, assessmentName, marksObtained, totalMarks, weight, errorTags, normalizedPercentage: normalizeScore(marksObtained, totalMarks) };
}

export function getSampleData() {
  const subjects = [
    { id: 'subj-physics', name: 'IB HL Physics', targetPercentage: 85, colorTheme: 'sky' },
    { id: 'subj-math',    name: 'HL Mathematics', targetPercentage: 90, colorTheme: 'violet' },
  ];

  const syllabusTopics = [
    // Physics
    { id: 't1', subjectId: 'subj-physics', unitName: 'Mechanics', topicName: 'Kinematics' },
    { id: 't2', subjectId: 'subj-physics', unitName: 'Mechanics', topicName: "Newton's Laws & Dynamics" },
    { id: 't3', subjectId: 'subj-physics', unitName: 'Mechanics', topicName: 'Work, Energy & Power' },
    { id: 't4', subjectId: 'subj-physics', unitName: 'Mechanics', topicName: 'Circular Motion & Gravitation' },
    { id: 't5', subjectId: 'subj-physics', unitName: 'Thermal', topicName: 'Thermal Physics' },
    { id: 't6', subjectId: 'subj-physics', unitName: 'Waves',   topicName: 'Oscillations & Waves' },
    { id: 't7', subjectId: 'subj-physics', unitName: 'Modern',  topicName: 'Nuclear Physics' },
    { id: 't8', subjectId: 'subj-physics', unitName: 'Modern',  topicName: 'Quantum & Modern Physics' },
    // Math
    { id: 'm1', subjectId: 'subj-math', unitName: 'Calculus',    topicName: 'Differentiation' },
    { id: 'm2', subjectId: 'subj-math', unitName: 'Calculus',    topicName: 'Integration' },
    { id: 'm3', subjectId: 'subj-math', unitName: 'Statistics',  topicName: 'Statistics & Probability' },
    { id: 'm4', subjectId: 'subj-math', unitName: 'Algebra',     topicName: 'Vectors & Matrices' },
  ];

  const assessmentEntries = [
    // t1 Kinematics → MASTERED (EWMA ~92%)
    entry('e1',  'subj-physics', 't1', 'Term 1', '2026-02-10', 'FA 1 – Kinematics Quiz',         42, 50, 2, ['Careless / Calculation']),
    entry('e2',  'subj-physics', 't1', 'Term 2', '2026-04-25', 'FA 2 – Projectile Motion',        44, 50, 2, []),
    entry('e3',  'subj-physics', 't1', 'Term 3', '2026-08-15', 'Major Physics Test (Mech)',        85, 90, 3, []),
    entry('e4',  'subj-physics', 't1', 'Term 4', '2026-11-05', 'FA 4 – Kinematics Review',        46, 50, 2, []),

    // t2 Newton's Laws → MASTERED (EWMA ~97%)
    entry('e5',  'subj-physics', 't2', 'Term 1', '2026-02-20', 'FA 1 – Newton\'s Laws Quiz',      48, 50, 2, []),
    entry('e6',  'subj-physics', 't2', 'Term 2', '2026-05-10', 'FA 2 – Dynamics & Forces',        44, 45, 2, []),
    entry('e7',  'subj-physics', 't2', 'Term 4', '2026-11-08', 'FA 3 – Mechanics Major Test',     88, 90, 3, []),

    // t3 Work & Energy → IMPROVING (EWMA ~73%, velocity +12.5)
    entry('e8',  'subj-physics', 't3', 'Term 2', '2026-05-15', 'FA 1 – Energy Concepts',          50, 80, 3, ['Conceptual Gap', 'Time Management']),
    entry('e9',  'subj-physics', 't3', 'Term 4', '2026-11-10', 'FA 2 – Work-Energy Theorem',      60, 80, 3, ['Conceptual Gap']),

    // t4 Circular Motion → CRITICAL GAP (EWMA ~56%)
    entry('e10', 'subj-physics', 't4', 'Term 1', '2026-02-10', 'FA 1 – Circular Motion Quiz',     25, 50, 2, ['Conceptual Gap', 'Misread Question']),
    entry('e11', 'subj-physics', 't4', 'Term 2', '2026-04-15', 'FA 2 – Gravity & Orbits',         22, 50, 2, ['Conceptual Gap']),
    entry('e12', 'subj-physics', 't4', 'Term 3', '2026-07-20', 'FA 3 – Orbital Mechanics',        30, 50, 2, ['Conceptual Gap']),
    entry('e13', 'subj-physics', 't4', 'Term 4', '2026-10-25', 'FA 4 – Circular Motion Review',   28, 50, 2, ['Conceptual Gap', 'Careless / Calculation']),

    // t5 Thermal Physics → AT RISK (high hist avg ~84%, recent sharp drop to 64%)
    entry('e14', 'subj-physics', 't5', 'Term 1', '2026-02-25', 'FA 1 – Heat & Temperature',       42, 50, 2, []),
    entry('e15', 'subj-physics', 't5', 'Term 2', '2026-05-05', 'FA 2 – Gas Laws',                 44, 50, 2, []),
    entry('e16', 'subj-physics', 't5', 'Term 3', '2026-08-20', 'Major Thermo Test',               76, 80, 3, []),
    entry('e17', 'subj-physics', 't5', 'Term 4', '2026-11-02', 'FA 4 – Thermo Review (poor)',     32, 50, 2, ['Careless / Calculation', 'Time Management']),

    // t6 Oscillations & Waves → MASTERED but STALE (last assessed 2026-10-01, 47 days ago)
    entry('e18', 'subj-physics', 't6', 'Term 2', '2026-05-20', 'FA 1 – Wave Properties',          65, 80, 3, []),
    entry('e19', 'subj-physics', 't6', 'Term 3', '2026-07-15', 'FA 2 – Oscillations Test',        68, 80, 3, []),
    entry('e20', 'subj-physics', 't6', 'Term 4', '2026-10-01', 'FA 3 – SHM Review',               51, 60, 2, []),

    // t7, t8 → UNTESTED (no entries)

    // m1 Differentiation → MASTERED
    entry('em1', 'subj-math', 'm1', 'Term 1', '2026-01-20', 'FA 1 – Derivatives',                 45, 50, 2, []),
    entry('em2', 'subj-math', 'm1', 'Term 2', '2026-03-15', 'FA 2 – Chain Rule & Applications',   48, 50, 2, []),
    entry('em3', 'subj-math', 'm1', 'Term 2', '2026-05-10', 'Major Calculus Test',                88, 90, 3, []),

    // m2 Integration → AT RISK (was strong, recent bad drop)
    entry('em4', 'subj-math', 'm2', 'Term 1', '2026-01-25', 'FA 1 – Basic Integration',           38, 50, 2, ['Conceptual Gap']),
    entry('em5', 'subj-math', 'm2', 'Term 2', '2026-03-10', 'FA 2 – Integration Techniques',      42, 50, 2, []),
    entry('em6', 'subj-math', 'm2', 'Term 2', '2026-05-05', 'Major Integration Test',             72, 80, 3, []),
    entry('em7', 'subj-math', 'm2', 'Term 4', '2026-10-20', 'FA 4 – Integration Review',         55, 80, 3, ['Conceptual Gap', 'Time Management']),

    // m3 Statistics → CRITICAL GAP
    entry('em8', 'subj-math', 'm3', 'Term 2', '2026-04-05', 'FA 1 – Probability Basics',          28, 50, 2, ['Conceptual Gap', 'Misread Question']),
    entry('em9', 'subj-math', 'm3', 'Term 3', '2026-06-20', 'FA 2 – Distributions',               24, 50, 2, ['Conceptual Gap']),
    // m4 Vectors → UNTESTED
  ];

  return {
    subjects,
    syllabusTopics,
    assessmentEntries,
    activeSubjectId: 'subj-physics',
    terms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
  };
}
