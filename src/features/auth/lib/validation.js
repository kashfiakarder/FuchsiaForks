/**
 * Client-side validation for the auth forms.
 *
 * UX-layer only: it exists to give fast, kind feedback before a request is
 * ever made. The backend stays the authority on uniqueness, deliverability
 * and policy. Each rule is strict only about things that are certainly
 * wrong and permissive about everything else, so no real person is ever
 * blocked by a regex.
 */

const USERNAME_SHAPE = /^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/i;

/**
 * Deliberately not RFC 5322. We catch the handful of unambiguous mistakes
 * — no @, nothing either side of it, no dot in the domain, whitespace —
 * and let everything else through to the server.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

const countDigits = (value) => (value.match(/\d/g) ?? []).length;

export const EMPTY_LOGIN = { username: '', phone: '' };
export const EMPTY_SIGNUP = { username: '', email: '', phone: '', password: '' };

export function validateField(name, raw) {
  const value = (raw ?? '').trim();

  switch (name) {
    case 'username': {
      if (!value) return 'Pick a username so people can find you.';
      if (value.length < 3) return 'At least 3 characters.';
      if (value.length > 24) return 'Keep it under 24 characters.';
      if (!USERNAME_SHAPE.test(value))
        return 'Letters, numbers, dots and underscores — start and end with a letter or number.';
      if (value.includes('..')) return 'No double dots.';
      return undefined;
    }
    case 'email': {
      if (!value) return 'We need an email to reach you.';
      if (!EMAIL_SHAPE.test(value)) return 'That doesn’t look like a complete email address.';
      if (value.length > 254) return 'That address is too long.';
      return undefined;
    }
    case 'phone': {
      if (!value) return 'Add a phone number so we can send meetup reminders.';
      if (/[^\d\s()+.\-]/.test(value)) return 'Digits, spaces and + ( ) - . only.';
      const digits = countDigits(value);
      if (digits < 7) return 'That number looks too short.';
      if (digits > 15) return 'That number looks too long.';
      return undefined;
    }
    case 'password': {
      if (!raw) return 'Choose a password.';
      if (raw.length < 8) return 'At least 8 characters.';
      if (raw.length > 128) return 'Keep it under 128 characters.';
      if (!/[a-z]/i.test(raw)) return 'Include at least one letter.';
      if (!/\d/.test(raw)) return 'Include at least one number.';
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Signing in only needs to know the fields are present and plausible. */
export function validateLoginField(name, raw) {
  const value = (raw ?? '').trim();
  if (name === 'username') return value ? undefined : 'Enter your username.';
  if (name === 'phone') {
    if (!value) return 'Enter the phone number on your account.';
    const digits = countDigits(value);
    if (digits < 7) return 'That number looks too short.';
    return undefined;
  }
  return undefined;
}

export function validateForm(values, fields, validator = validateField) {
  const errors = {};
  for (const name of fields) {
    const message = validator(name, values[name]);
    if (message) errors[name] = message;
  }
  return errors;
}

/* ------------------------------------------------------------------ *
 *  Password strength
 * ------------------------------------------------------------------ */

const TIERS = [
  { score: 0, label: 'Blank canvas', tone: 'disabled' },
  { score: 1, label: 'Rough sketch', tone: 'error', hint: 'Add length — a short phrase beats a clever word.' },
  { score: 2, label: 'Underpainting', tone: 'warning', hint: 'Mix in a symbol or two.' },
  { score: 3, label: 'Studio ready', tone: 'success' },
  { score: 4, label: 'Masterwork', tone: 'success' },
];

const COMMON = new Set([
  'password', 'password1', 'passw0rd', '12345678', '123456789', 'qwerty123',
  'letmein1', 'iloveyou', 'admin123', 'welcome1', 'abc12345', 'football1',
]);

/**
 * A small, honest heuristic: length does most of the work (because it
 * does), variety adds a little, obvious patterns subtract. Not a zxcvbn
 * replacement — just enough signal to nudge people longer. Advisory only;
 * the field validator owns what is actually required.
 */
export function scorePassword(raw) {
  if (!raw) return TIERS[0];
  if (COMMON.has(raw.toLowerCase())) return TIERS[1];

  let points = 0;
  if (raw.length >= 8) points += 1;
  if (raw.length >= 12) points += 1;
  if (raw.length >= 16) points += 1;

  let classes = 0;
  if (/[a-z]/.test(raw)) classes += 1;
  if (/[A-Z]/.test(raw)) classes += 1;
  if (/\d/.test(raw)) classes += 1;
  if (/[^\w\s]/.test(raw)) classes += 1;
  if (classes >= 3) points += 1;
  if (classes >= 4) points += 1;

  if (/^(.)\1+$/.test(raw)) points -= 2;
  if (/^\d+$/.test(raw)) points -= 1;
  if (/(.)\1{3,}/.test(raw)) points -= 1;

  return TIERS[Math.max(1, Math.min(4, points))];
}

/* ------------------------------------------------------------------ *
 *  Formatting
 * ------------------------------------------------------------------ */

/**
 * Light-touch phone formatting. Only groups 10-digit NANP-shaped input,
 * leaves anything starting with + alone, and never reorders or drops a
 * digit — international numbers keep whatever was typed.
 */
export function formatPhone(raw) {
  if (raw.trim().startsWith('+')) return raw;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length > 10) return raw;

  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);
  if (digits.length <= 3) return area;
  if (digits.length <= 6) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${line}`;
}
