/** Words that carry no retrieval signal in a question about a training institute. */
const STOP_WORDS = new Set([
  'a',
  'about',
  'after',
  'all',
  'also',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'been',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'get',
  'give',
  'had',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'know',
  'like',
  'me',
  'more',
  'most',
  'my',
  'no',
  'not',
  'now',
  'of',
  'on',
  'once',
  'one',
  'only',
  'or',
  'other',
  'our',
  'out',
  'over',
  'own',
  'please',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  'take',
  'tell',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'to',
  'today',
  'too',
  'up',
  'us',
  'very',
  'want',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
  // Hinglish function words. Without them a question like "BCA course kitne saal
  // ka hai" matches only half its terms, and lexical coverage gates it out.
  'aap',
  'apna',
  'apne',
  'aur',
  'baare',
  'bare',
  'bata',
  'batao',
  'bataiye',
  'bataye',
  'bhi',
  'chahiye',
  'ha',
  'hai',
  'hain',
  'ho',
  'hoga',
  'hogi',
  'ji',
  'ka',
  'kab',
  'kahan',
  'kaisa',
  'kaise',
  'kaisi',
  'kar',
  'karna',
  'karne',
  'ke',
  'ki',
  'kitna',
  'kitne',
  'kitni',
  'ko',
  'kya',
  'liye',
  'mein',
  'mera',
  'meri',
  'mere',
  'milega',
  'milegi',
  'mujhe',
  'muje',
  'na',
  'nahi',
  'pe',
  'par',
  'sakta',
  'sakte',
  'se',
  'toh',
  'wala',
  'wali',
  'ya',
]);

/**
 * Query-side expansion.
 *
 * Users ask "will I get a job", the site says "placement"; without bridging
 * that vocabulary gap the best-matching content never surfaces. Applied only
 * to queries, so documents keep their natural wording.
 */
const SYNONYMS: Record<string, readonly string[]> = {
  job: ['placement', 'career', 'recruit', 'hiring', 'employment'],
  jobs: ['placement', 'career', 'recruit', 'hiring', 'employment'],
  placement: ['job', 'career', 'recruit', 'hiring'],
  salary: ['package', 'placement', 'career'],
  fee: ['fees', 'cost', 'price', 'payment', 'installment'],
  fees: ['fee', 'cost', 'price', 'payment', 'installment'],
  cost: ['fee', 'fees', 'price'],
  price: ['fee', 'fees', 'cost'],
  duration: ['months', 'month', 'long', 'year', 'years'],
  long: ['duration', 'months', 'year'],
  eligibility: ['eligible', 'qualification', 'requirement', 'criteria'],
  eligible: ['eligibility', 'qualification', 'requirement', 'criteria'],
  admission: ['enroll', 'enrol', 'apply', 'enquiry', 'join'],
  centre: ['center', 'branch', 'location', 'campus'],
  center: ['centre', 'branch', 'location', 'campus'],
  branch: ['centre', 'center', 'location'],
  cybersecurity: ['cyber', 'security'],
  hacking: ['ethical', 'hacking', 'security'],
  networking: ['network', 'ccna', 'routing', 'switching'],
  ai: ['artificial', 'intelligence'],
  cloud: ['aws', 'azure', 'cloud'],
  degree: ['bca', 'mca', 'graduation', 'university'],
  contact: ['phone', 'email', 'address', 'reach'],
  son: ['parent'],
  daughter: ['parent'],
  child: ['parent'],
  genuine: ['trust', 'trusted'],
};

/**
 * Hinglish content words, replaced (not supplemented) by the site's English
 * vocabulary: the Hindi word never occurs in the corpus, so keeping it as a
 * query term would only dilute lexical coverage.
 */
const HINGLISH: Record<string, readonly string[]> = {
  saal: ['year', 'duration'],
  sal: ['year', 'duration'],
  mahine: ['month', 'duration'],
  mahina: ['month', 'duration'],
  naukri: ['job', 'placement'],
  naukari: ['job', 'placement'],
  kharcha: ['fee', 'cost'],
  paisa: ['fee', 'cost'],
  padhai: ['course', 'study'],
  yogyata: ['eligibility', 'qualification'],
};

/**
 * Very light suffix stripping.
 *
 * A real stemmer (Porter) is overkill for a corpus this size and mangles the
 * domain acronyms that matter most here (AWS, CCNA, MCA), so this only removes
 * the plural and gerund endings that actually cause misses.
 */
function stem(word: string): string {
  if (word.length <= 4) return word;
  if (word.endsWith('ies') && word.length > 5) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches'))
    return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 5) return word.slice(0, -2);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map(stem);
}

/**
 * One term group per distinct word the user typed: the word itself plus its
 * synonyms or translations. A document covers the word when it contains any
 * term in the group, so expansion widens recall without diluting coverage.
 */
export function tokenizeQueryGroups(query: string): string[][] {
  const base = query
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word) && !STOP_WORDS.has(stem(word)));

  const groups = new Map<string, string[]>();

  for (const word of new Set(base)) {
    const translated = HINGLISH[word];
    const terms = translated
      ? translated.map(stem)
      : [stem(word), ...(SYNONYMS[word] ?? []).map(stem)];
    const key = translated ? word : stem(word);
    groups.set(key, [...new Set([...(groups.get(key) ?? []), ...terms])]);
  }

  return [...groups.values()];
}
