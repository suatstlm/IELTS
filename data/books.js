// Section map of the two books. Page numbers are the page numbers printed IN THE BOOK;
// each book's toPdf() converts them to PDF page numbers.
// The Grammar book's front matter uses roman numerals ("vii").

(function () {
  const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

  // ---------------------------------------------------------------- GRAMMAR
  // [no, title, scope, A, B, [[point, page]...], C, D, D type, GFT, key page, recording script page]
  const G = [
    [1, 'Present tenses', 'present simple; present continuous; state verbs', 1, 2,
      [['Present simple', 2], ['Present continuous', 2], ['State verbs', 3]], 4, 6, 'Listening Section 1', 7, 223, 240],
    [2, 'Past tenses 1', 'past simple; past continuous; used to; would', 8, 9,
      [['Past simple', 9], ['Past continuous', 10], ['Used to and would', 10]], 11, 14, 'Academic Reading', 17, 224, 241],
    [3, 'Present perfect', 'present perfect simple; present perfect continuous', 18, 19,
      [['Present perfect simple', 19], ['Present perfect continuous', 20]], 22, 25, 'General Training Writing Task 1', 26, 224, 241],
    [4, 'Past tenses 2', 'past perfect simple; past perfect continuous', 27, 29,
      [['Past perfect simple', 29], ['Past perfect continuous', 30]], 31, 34, 'Academic Reading', 37, 225, 242],
    [5, 'Future 1', 'plans, intentions and predictions: present continuous; going to; will', 38, 39,
      [['Present continuous', 39], ['Will', 39], ['Going to', 39]], 41, 44, 'General Training Reading', 47, 226, 242],
    [6, 'Future 2', 'present simple; be about to; future continuous; future perfect', 48, 49,
      [['Present simple', 49], ['Be about to', 49], ['Future continuous', 49], ['Future perfect simple', 50], ['Future perfect continuous', 50]],
      51, 54, 'Academic Writing Task 2', 54, 226, 243],
    [7, 'Countable and uncountable nouns', 'countable and uncountable nouns; quantity expressions (many, much, a lot of, some, any, a few, few, no)', 55, 56,
      [['Countable and uncountable nouns', 56], ['Some and any', 56], ['Quantities', 57]], 58, 60, 'Academic Reading', 63, 227, 243],
    [8, 'Referring to nouns', 'articles; other determiners (demonstratives, possessives, inclusives: each, every, both, all etc.)', 64, 65,
      [['Articles', 65], ['Demonstratives: this, that, these, those', 66], ['Possessives', 67], ['Inclusives', 67]], 69, 71, 'Listening Section 4', 72, 227, 244],
    [9, 'Pronouns and referencing', 'personal, possessive and reflexive pronouns; avoiding repetition', 73, 74,
      [['Personal and possessive pronouns', 74], ['Reflexive pronouns', 74], ['Some special situations', 75]], 76, 79, 'Academic Writing Task 2', 79, 228, 245],
    [10, 'Adjectives and adverbs', 'describing things; adding information about manner, place, time, frequency and intensity', 80, 81,
      [['Adjectives', 81], ['Adverbs', 82]], 84, 87, 'General Training Reading', 89, 229, 246],
    [11, 'Comparing things', 'comparative and superlative adjectives and adverbs; other ways of comparing', 90, 91,
      [['Comparing adjectives', 91], ['Comparing adverbs', 92], ['Other ways of comparing', 92], ['Comparing quantities', 93]], 94, 97, 'Academic Writing Task 1', 97, 230, 246],
    [12, 'The noun phrase', 'noun + prepositional phrase; noun + participle clause; noun + to-infinitive clause', 98, 99,
      [['Noun + prepositional phrase', 99], ['Noun + past participle clause', 100], ['Noun + present participle (-ing) clause', 100], ['Noun + to-infinitive clause', 100]],
      101, 103, 'Academic Reading', 106, 230, 246],
    [13, 'Modals 1', 'ability; possibility; alternatives to modals', 107, 108,
      [['Ability', 108], ['Other uses of can', 108], ['Possibility', 109], ['Expressing possibility and opinions in written texts', 110], ['Alternatives to modals', 110]],
      111, 113, 'Listening Section 4', 113, 231, 247],
    [14, 'Modals 2', 'obligation and necessity; suggestions and advice; adverbs', 114, 115,
      [['Obligation and necessity', 115], ['No obligation', 115], ['Suggestions and advice', 116], ['Adverbs', 116], ['Formal written English', 116]],
      117, 120, 'General Training Reading', 122, 232, 248],
    [15, 'Reported speech', 'tense changes; time references; reporting questions; reporting verbs', 123, 125,
      [['Tense changes', 125], ['Reporting verbs', 126], ['Time references etc.', 127], ['Reporting questions', 127]], 128, 131, 'Listening Section 3', 132, 232, 249],
    [16, 'Verb + verb patterns', 'verb + to-infinitive; verb + -ing; verb + preposition + -ing; verb + infinitive without to', 133, 134,
      [['Verb + to-infinitive', 134], ['Verb (+ preposition) + -ing', 134], ['Verb + to-infinitive or -ing', 135], ['Verb + object + infinitive without to', 136], ['Negatives', 136]],
      137, 140, 'Academic Reading', 143, 233, 250],
    [17, 'Likelihood based on conditions 1', 'zero, first and second conditionals; other ways to introduce a condition', 144, 145,
      [['Zero conditional', 145], ['First conditional', 145], ['Second conditional', 145], ['Other words to introduce a condition', 146]],
      147, 150, 'Academic Reading', 153, 234, 251],
    [18, 'Likelihood based on conditions 2', "third conditional; mixed conditionals; wishes and regrets; should(n't) have", 154, 155,
      [['Third conditional', 155], ['Mixed conditionals', 155], ['Wishes and regrets', 156], ["Should(n't) have", 156]], 157, 160, 'Academic Reading', 163, 234, 251],
    [19, 'Prepositions', 'prepositions after verbs, adjectives and nouns; prepositional phrases', 164, 165,
      [['Verb + preposition', 165], ['Adjective + preposition', 166], ['Noun + preposition', 166], ['Prepositional phrases: by, in, at, on, of', 167]],
      168, 171, 'Listening Section 2', 172, 235, 252],
    [20, 'Relative clauses', 'relative pronouns; defining and non-defining relative clauses; prepositions', 173, 174,
      [['Relative pronouns', 174], ['Defining relative clauses', 174], ['Non-defining relative clauses', 175], ['Prepositions', 176]], 177, 180, 'Academic Reading', 183, 235, 253],
    [21, 'Ways of organising texts', 'subject choice; introductory it; ellipsis; organising information; it- and what-clauses', 184, 185,
      [['The subject', 185], ['Ellipsis: leaving words out', 185], ['Organising information in a text', 185], ['Adding emphasis or contrast in a text', 186], ['Repeating ideas in a text', 186]],
      187, 190, 'Academic Writing Task 2', 190, 236, 253],
    [22, 'The passive', 'the passive; reporting with passive verbs; have something done; need + -ing', 191, 192,
      [['The passive: form', 192], ['The passive: use', 192], ['Reporting with passive verbs', 193], ['Have something done', 193], ['Need + -ing', 193]],
      194, 197, 'Academic Writing Task 1', 197, 237, 254],
    [23, 'Linking ideas', 'conjunctions, adverbials and prepositions; linking expressions', 198, 200,
      [['Ways of linking ideas', 200], ['Linking expressions', 200]], 203, 206, 'Academic Reading', 209, 237, 254],
    [24, 'Showing your position in a text', 'pronouns; adverbs; verbs; adjectives', 210, 211,
      [['Pronouns', 211], ['Adverbs', 211], ['Verbs', 212], ['Adjectives', 212]], 213, 215, 'Academic Writing Task 2', 215, 238, 255],
    [25, 'Nominalisation in written English', 'forming nouns from other parts of speech (verbs, adjectives and linking words)', 216, 217,
      [['Nominalisation in written English', 217], ['Reasons for using nominalisation', 218]], 219, 222, 'Academic Writing Task 1', 222, 239, 255],
  ];

  // Audio recordings: the book's CD tracklist (p. 258) = the order of the SoundCloud playlist.
  // The recording number is the unit number; "b"/"c" recordings belong to D · Test practice (Listening).
  const G_AUDIO_URL = 'https://soundcloud.com/tkt112/sets/cambridge-grammar-for-ielts-diane-hopkins';
  const G_TRACK_IDS = [
    776657557, 776657551, 776657545, 776657542, 776657536, 776657530, 776657524, 776657512, 776657506, 776657497,
    776657494, 776657485, 776657473, 776657458, 776657440, 776657434, 776657431, 776657425, 776657419, 776657407,
    776657398, 776657392, 776657383, 776657377, 776657374, 776657356, 776657344, 776657335, 776657314, 776657290,
    776657281, 776657278, 776657260,
  ];
  const G_RECS = ['title', '1a', '1b', '2', '3', '3', '4', '5', '6', '7', '8a', '8b', '9', '10', '11', '12', '13a', '13b',
    '14', '15a', '15b', '15c', '16', '17', '18', '19a', '19b', '20', '21', '22', '23', '24', '25'];
  function grammarAudio(no, id) {
    const recs = G_RECS.map((r, i) => ({ r, i })).filter((x) => parseInt(x.r, 10) === no);
    return recs.map((x) => {
      const same = recs.filter((y) => y.r === x.r);
      const part = same.length > 1 ? ` (part ${same.indexOf(x) + 1})` : '';
      const test = /[bc]$/.test(x.r) && x.r !== '15b';
      return { label: 'Recording ' + x.r + part, track: x.i + 1, id: G_TRACK_IDS[x.i], sec: id + (test ? '-d' : '-a') };
    });
  }

  const grammarUnits = [
    {
      id: 'g-front', label: 'Start', title: 'Introduction & Entry test', subtitle: 'Get to know the book and check your level',
      start: 'vii', end: 'xii', key: null, script: null,
      sections: [
        { id: 'g-intro', title: 'Introduction', page: 'vii' },
        { id: 'g-entry', title: 'Entry test', page: 'ix', skill: 'Test' },
      ],
    },
  ];
  G.forEach((u, i) => {
    const [no, title, subtitle, A, B, points, C, D, dName, gft, key, script] = u;
    const next = G[i + 1];
    const id = 'g' + no;
    const sections = [
      { id: id + '-a', title: 'A · Context listening', page: A, skill: 'Listening' },
      { id: id + '-b', title: 'B · Grammar', page: B, group: true },
      ...points.map((p, k) => ({ id: `${id}-b${k + 1}`, title: `${k + 1}. ${p[0]}`, page: p[1], sub: true })),
      { id: id + '-c', title: 'C · Grammar exercises', page: C },
      { id: id + '-d', title: 'D · Test practice: ' + dName, page: D, skill: dName },
      { id: id + '-gft', title: 'Grammar focus task', page: gft },
    ];
    grammarUnits.push({
      id, no, label: 'Unit ' + no, title, subtitle,
      start: A, end: next ? next[3] - 1 : 222,
      key: { from: key, to: next ? next[10] : 239 },
      script: { from: script, to: next ? next[11] : 255 },
      audio: grammarAudio(no, id),
      sections,
    });
  });
  grammarUnits.push({
    id: 'g-back', label: 'Appendix', title: 'Appendices', subtitle: 'Irregular verbs and phrasal verbs',
    start: 256, end: 258, key: null, script: null,
    sections: [
      { id: 'g-app1', title: 'Appendix 1: Irregular verbs', page: 256 },
      { id: 'g-app2', title: 'Appendix 2: Phrasal verbs', page: 257 },
    ],
  });

  // ------------------------------------------------------------- VOCABULARY
  // [no, title, topics, start page, [[subheading, page]...], test practice page, test type, key page, recording script page]
  const V = [
    [1, 'Growing up', 'Relationships, families and early learning', 8, [['Relationships', 8], ['Families and early learning', 9]], 11, 'Listening Section 1', 132, 157],
    [2, 'Mental and physical development', 'The body, the mind', 12, [['The body', 12], ['The mind', 14]], 15, 'Speaking Part 2 · General Training Writing Task 1', 133, 158],
    [3, 'Keeping fit', 'Diet, health and exercise', 16, [['Diet', 16], ['Health and exercise', 17]], 19, 'Academic Reading', 133, 158],
    [4, 'Lifestyles', 'Life, leisure', 22, [['Life', 22], ['Leisure', 23]], 25, 'Listening Section 2', 135, 159],
    [5, 'Student life', 'Study, education, research', 26, [['Study', 26], ['Education', 27], ['Research', 28]], 29, 'General Training Reading Section 2', 136, 159],
    'Test One',
    [6, 'Effective communication', 'Language, linguistics', 32, [['Language', 32], ['Linguistics', 33]], 35, 'Academic Reading', 136, 160],
    [7, 'On the move', 'Tourism, travel', 38, [['Tourism', 38], ['Travel', 39]], 41, 'General Training Reading Section 1', 138, 160],
    [8, 'Through the ages', 'Time, history', 42, [['Time', 42], ['History', 43]], 45, 'Listening Section 4', 139, 161],
    [9, 'The natural world', 'Flora and fauna, agriculture', 46, [['Flora and fauna', 46], ['Agriculture', 47]], 49, 'Academic Reading · General Training Reading Section 3', 139, 161],
    [10, 'Reaching for the skies', 'Space, the planets', 52, [['Space', 52], ['The planets', 53]], 55, 'Listening Section 3', 141, 161],
    'Test Two',
    [11, 'Design and innovation', 'Building, engineering', 58, [['Building', 58], ['Engineering', 59]], 61, 'Academic Reading', 142, 162],
    [12, 'Information technology', 'Telecommunications, computers and technology', 64, [['Telecommunications', 64], ['Computers and technology', 65]], 67, 'Speaking Parts 1, 2, 3', 143, 162],
    [13, 'The modern world', 'Globalisation, changing attitudes and trends', 68, [['Globalisation', 68], ['Changing attitudes and trends', 69]], 71, 'Academic Writing Task 1 (describing a chart)', 144, 163],
    [14, 'Urbanisation', 'Problems and solutions, big city life', 72, [['Problems and solutions', 72], ['Big city life', 73]], 75, 'Academic Reading · General Training Reading Section 3', 145, 163],
    [15, 'The green revolution', 'The environment, climate change and pollution', 78, [['The environment', 78], ['Climate change and pollution', 78]], 81, 'Academic Writing Task 1 (describing a process)', 146, 163],
    'Test Three',
    [16, 'The energy crisis', 'Natural resources, alternative fuels', 84, [['Natural resources', 84], ['Alternative fuels', 85]], 87, 'Academic Reading', 147, 164],
    [17, 'Talking business', 'Employment, management and marketing', 90, [['Employment', 90], ['Management and marketing', 91]], 93, 'General Training Writing Task 1 · Academic Writing Task 2', 148, 164],
    [18, 'The law', 'Crime, punishment', 94, [['Crime', 94], ['Punishment', 95]], 97, 'General Training Writing Task 2', 149, 164],
    [19, 'The media', 'The news, fame', 98, [['The news', 98], ['Fame', 99]], 101, 'Academic Writing Task 2', 150, 165],
    [20, 'The arts', 'Art appreciation, the performing arts', 102, [['Art appreciation', 102], ['The performing arts', 103]], 105, 'Academic Reading', 151, 165],
    'Test Four',
    [21, 'Language building 1', 'Using a dictionary, word families', 110, [['Using a dictionary', 110], ['Word families', 113]], null, null, 152, 166],
    [22, 'Language building 2', 'Learning vocabulary, collocation', 114, [['Learning vocabulary', 114], ['Collocation', 116]], null, null, 153, 166],
    [23, 'Academic Writing Task 1', 'Data, graphs and tables, diagrams and processes', 118, [['Data, graphs and tables', 118], ['Describing a diagram or a process', 121]], null, null, 154, null],
    [24, 'Academic Writing Task 2', 'Linking words, opinion words, register', 122,
      [['Getting started', 122], ['Linking words', 122], ['Opinion words', 124], ['Finishing off and register', 124]], null, null, 154, null],
    [25, 'General Training Writing Tasks 1 and 2', 'Vocabulary for Writing Tasks 1 and 2', 126,
      [['Writing Task 1', 126], ['Writing Task 2', 127], ['Linking words', 128], ['Opinion words', 129], ['Finishing off and register', 129]], null, null, 155, null],
    'Test Five',
  ];
  const TESTS = {
    'Test One': { units: '1–5', start: 30, key: 136 },
    'Test Two': { units: '6–10', start: 56, key: 142 },
    'Test Three': { units: '11–15', start: 82, key: 147 },
    'Test Four': { units: '16–20', start: 108, key: 152 },
    'Test Five': { units: '21–25', start: 130, key: 156 },
  };

  const vocabUnits = [
    {
      id: 'v-front', label: 'Start', title: 'Introduction', subtitle: 'Map of the book, introduction and IELTS summary',
      start: 2, end: 7, key: null, script: null,
      sections: [
        { id: 'v-map', title: 'Map of the book', page: 2 },
        { id: 'v-intro', title: 'Introduction', page: 4 },
        { id: 'v-summary', title: 'IELTS Test summary', page: 6 },
      ],
    },
  ];
  // The start of the next entry is used as the end of each key / recording-script range.
  const keyStarts = V.map(e => (typeof e === 'string' ? TESTS[e].key : e[7]));
  const nextStart = (i) => {
    const n = V[i + 1];
    if (!n) return 132;
    return typeof n === 'string' ? TESTS[n].start : n[3];
  };
  V.forEach((e, i) => {
    const keyTo = keyStarts[i + 1] || 156;
    if (typeof e === 'string') {
      const t = TESTS[e];
      const id = 'v-' + e.toLowerCase().replace(' ', '');
      vocabUnits.push({
        id, label: 'Test', title: e, subtitle: `Review test for Units ${t.units}`, isTest: true,
        start: t.start, end: nextStart(i) - 1,
        key: { from: t.key, to: keyTo }, script: null,
        sections: [{ id: id + '-t', title: e + ` (Units ${t.units})`, page: t.start, skill: 'Test' }],
      });
      return;
    }
    const [no, title, topics, start, subs, tp, tpName, key, script] = e;
    const id = 'v' + no;
    const sections = subs.map((s, k) => ({ id: `${id}-s${k + 1}`, title: s[0], page: s[1] }));
    if (tp) sections.push({ id: id + '-tp', title: 'Test practice: ' + tpName, page: tp, skill: tpName });
    // Start of the next recording script
    let scriptTo = null;
    if (script) {
      for (let j = i + 1; j < V.length; j++) if (typeof V[j] !== 'string' && V[j][8]) { scriptTo = V[j][8]; break; }
      scriptTo = scriptTo || 166;
    }
    vocabUnits.push({
      id, no, label: 'Unit ' + no, title, subtitle: topics, ref: no >= 21,
      start, end: nextStart(i) - 1,
      key: { from: key, to: keyTo },
      script: script ? { from: script, to: scriptTo } : null,
      sections,
    });
  });
  vocabUnits.push({
    id: 'v-back', label: 'Appendix', title: 'Wordlist', subtitle: 'List of the words in the book',
    start: 167, end: 172, key: null, script: null,
    sections: [{ id: 'v-wordlist', title: 'Wordlist', page: 167 }],
  });

  window.BOOKS = [
    {
      id: 'grammar',
      title: 'Grammar for IELTS',
      authors: 'Diana Hopkins & Pauline Cullen',
      short: 'Grammar',
      imgDir: 'pages/grammar',
      pdf: 'Grammar for IELTS (with answers, Hopkins & Cullen).pdf',
      pdfPages: 272,
      audioSource: G_AUDIO_URL,
      // Book page -> PDF page. Pages 55 and 56 are swapped in the scan.
      toPdf(p) {
        if (typeof p === 'string') return ROMAN[p] + 1;
        if (p === 55) return 69;
        if (p === 56) return 68;
        return p + 13;
      },
      extras: [
        { title: 'Key', from: 223, to: 239 },
        { title: 'Recording scripts', from: 240, to: 255 },
        { title: 'Contents', from: 'iv', to: 'vi' },
      ],
      units: grammarUnits,
    },
    {
      id: 'vocabulary',
      title: 'Vocabulary for IELTS',
      authors: 'Pauline Cullen',
      short: 'Vocabulary',
      imgDir: 'pages/vocabulary',
      pdf: 'Vocabulary for IELTS (Pauline Cullen).pdf',
      pdfPages: 178,
      toPdf(p) { return p + 3; },
      extras: [
        { title: 'Answer key', from: 132, to: 156 },
        { title: 'Recording scripts', from: 157, to: 166 },
        { title: 'Contents', from: 1, to: 1 },
      ],
      units: vocabUnits,
    },
  ];
})();
