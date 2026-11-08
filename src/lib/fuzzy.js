/**
 * Client-side fuzzy match for names already loaded in the app.
 *
 * Exact, prefix, and substring hits score highest. Everything else is a
 * short edit distance (or a near-subsequence) against the whole string and
 * against each word, so a typo or a clipped word still ranks.
 */

/** Two edits on a short word stay above this; unrelated strings do not. */
export const MATCH_THRESHOLD = 0.55;

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length > b.length) {
    const swap = a;
    a = b;
    b = swap;
  }

  const prev = new Array(a.length + 1);
  const curr = new Array(a.length + 1);
  for (let i = 0; i <= a.length; i += 1) prev[i] = i;

  for (let j = 1; j <= b.length; j += 1) {
    curr[0] = j;
    const bj = b.charCodeAt(j - 1);
    for (let i = 1; i <= a.length; i += 1) {
      const cost = a.charCodeAt(i - 1) === bj ? 0 : 1;
      curr[i] = Math.min(curr[i - 1] + 1, prev[i] + 1, prev[i - 1] + cost);
    }
    for (let i = 0; i <= a.length; i += 1) prev[i] = curr[i];
  }
  return prev[a.length];
}

function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

/** Query characters appear in order inside the word, with only a few extras. */
function subsequenceScore(query, word) {
  if (!query || !word || query.length > word.length) return 0;
  let i = 0;
  for (let k = 0; k < word.length && i < query.length; k += 1) {
    if (word.charCodeAt(k) === query.charCodeAt(i)) i += 1;
  }
  if (i < query.length) return 0;
  const extra = word.length - query.length;
  if (extra === 0) return 1;
  if (extra <= 2) return 0.82;
  return Math.max(0, 0.7 - (extra - 2) * 0.08);
}

function scoreWord(queryWord, text, words) {
  let best = similarity(queryWord, text);
  if (text.startsWith(queryWord)) best = Math.max(best, 0.94);
  for (const word of words) {
    if (word === queryWord) return 1;
    if (word.startsWith(queryWord)) best = Math.max(best, 0.93);
    else if (word.includes(queryWord)) best = Math.max(best, 0.86);
    else best = Math.max(best, similarity(queryWord, word), subsequenceScore(queryWord, word));
  }
  return best;
}

/**
 * How well `query` matches `text`, from 0 to 1.
 * Pass raw strings; both sides are normalized here.
 */
export function scoreText(query, text) {
  const nq = normalize(query);
  const nt = normalize(text);
  if (!nq || !nt) return 0;
  if (nt === nq) return 1;
  if (nt.startsWith(nq)) return 0.96;
  if (nt.includes(nq)) return 0.88;

  const qWords = nq.split(' ');
  const tWords = nt.split(' ');
  if (qWords.length === 1) return scoreWord(qWords[0], nt, tWords);

  let sum = 0;
  let weakest = 1;
  for (const qWord of qWords) {
    const score = scoreWord(qWord, nt, tWords);
    sum += score;
    if (score < weakest) weakest = score;
  }
  if (weakest < MATCH_THRESHOLD) return weakest;
  return sum / qWords.length;
}

/** True when the query is empty, or any string scores above the threshold. */
export function matchesAny(query, texts) {
  const nq = normalize(query);
  if (!nq) return true;
  for (const text of texts) {
    if (scoreText(nq, text) >= MATCH_THRESHOLD) return true;
  }
  return false;
}

/**
 * Best matches, highest score first.
 * `getText` may return a string or a list of strings to score against.
 * Queries shorter than two characters return nothing — that is the dropdown floor.
 */
export function rankMatches(query, items, getText, { limit = 8, threshold = MATCH_THRESHOLD } = {}) {
  const nq = normalize(query);
  if (nq.length < 2) return [];

  const ranked = [];
  for (const item of items) {
    const raw = getText(item);
    const texts = Array.isArray(raw) ? raw : [raw];
    let best = 0;
    for (const text of texts) {
      const score = scoreText(nq, text);
      if (score > best) best = score;
    }
    if (best >= threshold) ranked.push({ item, score: best });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((row) => row.item);
}
