export function getSampleData() {
  const subjects = [
    { id: 's-phys', name: 'IB Physics HL', targetPercentage: 85, colorTheme: 'sky' },
    { id: 's-math', name: 'Math AA HL', targetPercentage: 85, colorTheme: 'violet' },
    { id: 's-eng',  name: 'English Lang & Lit SL', targetPercentage: 80, colorTheme: 'emerald' },
    { id: 's-fr',   name: 'French Ab Initio', targetPercentage: 75, colorTheme: 'rose' },
    { id: 's-cs',   name: 'Computer Science SL', targetPercentage: 80, colorTheme: 'amber' },
    { id: 's-econ', name: 'Economics HL', targetPercentage: 85, colorTheme: 'indigo' },
  ];

  const syllabusTopics = [
    // ── IB Physics HL ───────────────────────────────────────────────────────
    // Core Topics
    { id: 'ph-1',  subjectId: 's-phys', unitName: 'Core', topicName: 'T1 – Measurements & Uncertainties', upcoming: false },
    { id: 'ph-2',  subjectId: 's-phys', unitName: 'Core', topicName: 'T2 – Mechanics', upcoming: false },
    { id: 'ph-3',  subjectId: 's-phys', unitName: 'Core', topicName: 'T3 – Thermal Physics', upcoming: false },
    { id: 'ph-4',  subjectId: 's-phys', unitName: 'Core', topicName: 'T4 – Waves', upcoming: false },
    { id: 'ph-5',  subjectId: 's-phys', unitName: 'Core', topicName: 'T5 – Electricity & Magnetism', upcoming: false },
    { id: 'ph-6',  subjectId: 's-phys', unitName: 'Core', topicName: 'T6 – Circular Motion & Gravitation', upcoming: false },
    { id: 'ph-7',  subjectId: 's-phys', unitName: 'Core', topicName: 'T7 – Atomic, Nuclear & Particle Physics', upcoming: true },
    { id: 'ph-8',  subjectId: 's-phys', unitName: 'Core', topicName: 'T8 – Energy Production', upcoming: true },
    // Additional Higher Level
    { id: 'ph-9',  subjectId: 's-phys', unitName: 'Additional HL', topicName: 'T9 – Wave Phenomena', upcoming: true },
    { id: 'ph-10', subjectId: 's-phys', unitName: 'Additional HL', topicName: 'T10 – Fields', upcoming: true },
    { id: 'ph-11', subjectId: 's-phys', unitName: 'Additional HL', topicName: 'T11 – Electromagnetic Induction', upcoming: true },
    { id: 'ph-12', subjectId: 's-phys', unitName: 'Additional HL', topicName: 'T12 – Quantum & Nuclear Physics', upcoming: true },
    // Papers
    { id: 'ph-p1', subjectId: 's-phys', unitName: 'Papers', topicName: 'Paper 1 – MCQ (1h)', upcoming: false },
    { id: 'ph-p2', subjectId: 's-phys', unitName: 'Papers', topicName: 'Paper 2 – Short & Extended (2h15)', upcoming: false },
    { id: 'ph-p3', subjectId: 's-phys', unitName: 'Papers', topicName: 'Paper 3 – Option & Data (1h15)', upcoming: true },
    { id: 'ph-ia', subjectId: 's-phys', unitName: 'Papers', topicName: 'Internal Assessment (IA)', upcoming: false },

    // ── Math AA HL ───────────────────────────────────────────────────────────
    { id: 'ma-1',  subjectId: 's-math', unitName: 'Topics', topicName: 'T1 – Number & Algebra', upcoming: false },
    { id: 'ma-2',  subjectId: 's-math', unitName: 'Topics', topicName: 'T2 – Functions', upcoming: false },
    { id: 'ma-3',  subjectId: 's-math', unitName: 'Topics', topicName: 'T3 – Geometry & Trigonometry', upcoming: false },
    { id: 'ma-4',  subjectId: 's-math', unitName: 'Topics', topicName: 'T4 – Statistics & Probability', upcoming: false },
    { id: 'ma-5',  subjectId: 's-math', unitName: 'Topics', topicName: 'T5 – Calculus', upcoming: false },
    { id: 'ma-p1', subjectId: 's-math', unitName: 'Papers', topicName: 'Paper 1 – No Calculator (2h)', upcoming: false },
    { id: 'ma-p2', subjectId: 's-math', unitName: 'Papers', topicName: 'Paper 2 – Calculator (2h)', upcoming: false },
    { id: 'ma-p3', subjectId: 's-math', unitName: 'Papers', topicName: 'Paper 3 – Investigation (1h)', upcoming: true },
    { id: 'ma-ia', subjectId: 's-math', unitName: 'Papers', topicName: 'Internal Assessment (IA – Exploration)', upcoming: false },

    // ── English Lang & Lit SL ───────────────────────────────────────────────
    // Assessment components (tracked instead of content topics)
    { id: 'en-p1', subjectId: 's-eng', unitName: 'Assessment', topicName: 'Paper 1 – Guided Literary Analysis (1h15)', upcoming: false },
    { id: 'en-p2', subjectId: 's-eng', unitName: 'Assessment', topicName: 'Paper 2 – Comparative Essay (1h45)', upcoming: false },
    { id: 'en-io', subjectId: 's-eng', unitName: 'Assessment', topicName: 'Individual Oral (IO – 15 min)', upcoming: false },
    { id: 'en-lp', subjectId: 's-eng', unitName: 'Assessment', topicName: 'Learner Portfolio', upcoming: false },
    // Skills
    { id: 'en-s1', subjectId: 's-eng', unitName: 'Skills', topicName: 'Textual Analysis (non-literary)', upcoming: false },
    { id: 'en-s2', subjectId: 's-eng', unitName: 'Skills', topicName: 'Literary Commentary', upcoming: false },
    { id: 'en-s3', subjectId: 's-eng', unitName: 'Skills', topicName: 'Comparative Essay Writing', upcoming: false },

    // ── French Ab Initio ────────────────────────────────────────────────────
    { id: 'fr-p1', subjectId: 's-fr', unitName: 'Papers', topicName: 'Paper 1 – Reading & Writing (1h30)', upcoming: false },
    { id: 'fr-p2', subjectId: 's-fr', unitName: 'Papers', topicName: 'Paper 2 – Listening (45 min)', upcoming: false },
    { id: 'fr-io', subjectId: 's-fr', unitName: 'Papers', topicName: 'Individual Oral – Speaking', upcoming: false },
    // IB Prescribed Themes
    { id: 'fr-t1', subjectId: 's-fr', unitName: 'Themes', topicName: 'Identités (Identities)', upcoming: false },
    { id: 'fr-t2', subjectId: 's-fr', unitName: 'Themes', topicName: 'Expériences (Experiences)', upcoming: false },
    { id: 'fr-t3', subjectId: 's-fr', unitName: 'Themes', topicName: 'Ingéniosité Humaine (Human Ingenuity)', upcoming: false },
    { id: 'fr-t4', subjectId: 's-fr', unitName: 'Themes', topicName: 'Organisation Sociale (Social Organisation)', upcoming: true },
    { id: 'fr-t5', subjectId: 's-fr', unitName: 'Themes', topicName: 'Partager la Planète (Sharing the Planet)', upcoming: true },

    // ── Computer Science SL ─────────────────────────────────────────────────
    { id: 'cs-1',  subjectId: 's-cs', unitName: 'Core Topics', topicName: 'T1 – System Fundamentals', upcoming: false },
    { id: 'cs-2',  subjectId: 's-cs', unitName: 'Core Topics', topicName: 'T2 – Computer Organisation', upcoming: false },
    { id: 'cs-3',  subjectId: 's-cs', unitName: 'Core Topics', topicName: 'T3 – Networks', upcoming: false },
    { id: 'cs-4',  subjectId: 's-cs', unitName: 'Core Topics', topicName: 'T4 – Computational Thinking & Algorithms', upcoming: false },
    { id: 'cs-d',  subjectId: 's-cs', unitName: 'Option', topicName: 'Option D – Object-Oriented Programming', upcoming: false },
    { id: 'cs-p1', subjectId: 's-cs', unitName: 'Papers', topicName: 'Paper 1 – Theory (1h30)', upcoming: false },
    { id: 'cs-p2', subjectId: 's-cs', unitName: 'Papers', topicName: 'Paper 2 – OOP & Case Study (1h)', upcoming: true },
    { id: 'cs-ia', subjectId: 's-cs', unitName: 'Papers', topicName: 'Internal Assessment (IA – Solution)', upcoming: false },

    // ── Economics HL ────────────────────────────────────────────────────────
    { id: 'ec-1',  subjectId: 's-econ', unitName: 'Content', topicName: 'Section 1 – Microeconomics', upcoming: false },
    { id: 'ec-2',  subjectId: 's-econ', unitName: 'Content', topicName: 'Section 2 – Macroeconomics', upcoming: false },
    { id: 'ec-3',  subjectId: 's-econ', unitName: 'Content', topicName: 'Section 3 – International Economics', upcoming: true },
    { id: 'ec-4',  subjectId: 's-econ', unitName: 'Content', topicName: 'Section 4 – Development Economics', upcoming: true },
    { id: 'ec-p1', subjectId: 's-econ', unitName: 'Papers', topicName: 'Paper 1 – Extended Response (1h30+)', upcoming: false },
    { id: 'ec-p2', subjectId: 's-econ', unitName: 'Papers', topicName: 'Paper 2 – Data Response (1h45)', upcoming: false },
    { id: 'ec-p3', subjectId: 's-econ', unitName: 'Papers', topicName: 'Paper 3 – Policy Paper HL (1h45)', upcoming: true },
    { id: 'ec-ia', subjectId: 's-econ', unitName: 'Papers', topicName: 'Internal Assessment (3 Commentaries)', upcoming: false },
  ];

  return {
    subjects,
    syllabusTopics,
    assessmentEntries: [],
    activeSubjectId: 's-phys',
    terms: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
  };
}
