import moment from 'moment';

export function formatDate(value, fallback = 'To Be Announced') {
  if (!value) return fallback;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('D MMM YYYY') : String(value);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('D MMM YYYY, h:mm a') : String(value);
}

export function daysUntil(value) {
  if (!value) return null;
  const parsed = moment(value);
  if (!parsed.isValid()) return null;
  return parsed.startOf('day').diff(moment().startOf('day'), 'days');
}

export function deadlinePhrase(value) {
  const remaining = daysUntil(value);
  if (remaining === null) return 'To Be Announced';
  if (remaining < 0) return 'Deadline passed';
  if (remaining === 0) return 'Closes today';
  if (remaining === 1) return 'Closes tomorrow';
  if (remaining <= 30) return 'Closes in ' + remaining + ' days';
  return 'Closes ' + formatDate(value);
}

export function isPast(value) {
  const remaining = daysUntil(value);
  return remaining !== null && remaining < 0;
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return number.toLocaleString('en-IN');
}

export function formatINR(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return '₹' + number.toLocaleString('en-IN');
}

export function truncate(text, length = 160) {
  if (!text) return '';
  return text.length > length ? text.slice(0, length).trimEnd() + '…' : text;
}

export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}