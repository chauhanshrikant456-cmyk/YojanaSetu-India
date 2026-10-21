export const PROFILE_FIELDS = [
  { key: 'annualFamilyIncome', label: 'Annual family income (INR)', type: 'number' },
  { key: 'marksPercentage', label: 'Marks percentage', type: 'number' },
  { key: 'state', label: 'State', type: 'string' },
  { key: 'domicileState', label: 'Domicile state', type: 'string' },
  { key: 'educationLevel', label: 'Education level', type: 'enum' },
  { key: 'category', label: 'Category', type: 'enum' },
  { key: 'gender', label: 'Gender', type: 'enum' },
  { key: 'course', label: 'Course', type: 'string' },
  { key: 'currentStudyYear', label: 'Current study year', type: 'number' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'disabilityStatus', label: 'Disability status', type: 'boolean' },
  { key: 'entranceExamScore', label: 'Entrance exam score', type: 'number' },
  { key: 'passingYear', label: 'Year of passing', type: 'number' }
];

export const OPERATORS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'between', 'in', 'not_in', 'exists', 'regex'];

export const OPERATOR_LABELS = {
  eq: 'is equal to',
  ne: 'is not equal to',
  lt: 'is less than',
  lte: 'is less than or equal to',
  gt: 'is greater than',
  gte: 'is greater than or equal to',
  between: 'is between',
  in: 'is one of',
  not_in: 'is not one of',
  exists: 'is provided',
  regex: 'matches pattern'
};

export function isMissing(value) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'number' && Number.isNaN(value)) return true;
  return false;
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === undefined || value === null || value === '') return null;
  const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeRegex(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0 || pattern.length > 120) return null;
  if (/\*\*|\+\+|\{\d{3,}/.test(pattern)) return null;
  try {
    return new RegExp(pattern, 'i');
  } catch (err) {
    return null;
  }
}

function describeValue(rule) {
  if (rule.operator === 'exists') return 'provided';
  if (rule.operator === 'between') return rule.value + ' and ' + rule.value2;
  return String(rule.value ?? '');
}

function display(value) {
  if (isMissing(value)) return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function evaluateRule(profile, rule) {
  const raw = profile ? profile[rule.field] : undefined;
  const base = {
    rule_id: rule.id,
    title: rule.title,
    field: rule.field,
    operator: rule.operator,
    group: rule.group || 'AND',
    mandatory: rule.mandatory !== false,
    explanation: rule.explanation || null,
    expected: describeValue(rule),
    actual: display(raw)
  };

  if (rule.operator === 'exists') {
    // "is provided" can only be confirmed or left unknown — missing data is never a pass or a hard fail.
    return { ...base, outcome: isMissing(raw) ? 'missing' : 'pass' };
  }
  if (isMissing(raw)) {
    return { ...base, outcome: 'missing' };
  }

  const left = normalize(raw);
  const right = normalize(rule.value);

  switch (rule.operator) {
    case 'eq':
      return { ...base, outcome: left === right ? 'pass' : 'fail' };
    case 'ne':
      return { ...base, outcome: left !== right ? 'pass' : 'fail' };
    case 'in': {
      const list = String(rule.value ?? '').split(',').map((item) => normalize(item)).filter(Boolean);
      return { ...base, outcome: list.includes(left) ? 'pass' : 'fail' };
    }
    case 'not_in': {
      const list = String(rule.value ?? '').split(',').map((item) => normalize(item)).filter(Boolean);
      return { ...base, outcome: list.includes(left) ? 'fail' : 'pass' };
    }
    case 'regex': {
      const pattern = safeRegex(rule.value);
      if (!pattern) return { ...base, outcome: 'fail', explanation: (rule.explanation || '') + ' (pattern not valid or too complex)' };
      return { ...base, outcome: pattern.test(String(raw)) ? 'pass' : 'fail' };
    }
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      const a = toNumber(raw);
      const b = toNumber(rule.value);
      if (a === null || b === null) return { ...base, outcome: 'fail', explanation: (rule.explanation || '') + ' (values could not be compared numerically)' };
      const ok = rule.operator === 'lt' ? a < b : rule.operator === 'lte' ? a <= b : rule.operator === 'gt' ? a > b : a >= b;
      return { ...base, outcome: ok ? 'pass' : 'fail' };
    }
    case 'between': {
      const a = toNumber(raw);
      const low = toNumber(rule.value);
      const high = toNumber(rule.value2);
      if (a === null || low === null || high === null) return { ...base, outcome: 'fail', explanation: (rule.explanation || '') + ' (range values incomplete)' };
      const min = Math.min(low, high);
      const max = Math.max(low, high);
      return { ...base, outcome: a >= min && a <= max ? 'pass' : 'fail' };
    }
    default:
      return { ...base, outcome: 'fail', explanation: 'Unsupported operator' };
  }
}

export function evaluateRules(profile, rules) {
  const active = (rules || []).filter((rule) => rule.is_active !== false);
  if (active.length === 0) {
    return {
      status: 'needs_info',
      summary: 'No eligibility rules have been published for this opportunity yet, so a verdict cannot be given.',
      counts: { total: 0, pass: 0, fail: 0, missing: 0 },
      evaluations: []
    };
  }

  const evaluations = active.map((rule) => evaluateRule(profile, rule));
  const mandatoryAnd = evaluations.filter((e) => e.group !== 'OR' && e.mandatory);
  const optionalAnd = evaluations.filter((e) => e.group !== 'OR' && !e.mandatory);
  const orRules = evaluations.filter((e) => e.group === 'OR');

  const mandatoryFailed = mandatoryAnd.filter((e) => e.outcome === 'fail');
  const mandatoryMissing = mandatoryAnd.filter((e) => e.outcome === 'missing');
  const orPassed = orRules.some((e) => e.outcome === 'pass');
  const orMissing = orRules.some((e) => e.outcome === 'missing');

  let status = 'eligible';
  let summary = 'All published eligibility conditions are satisfied on the information you provided.';

  if (mandatoryFailed.length > 0) {
    status = 'ineligible';
    summary = 'You do not meet ' + mandatoryFailed.length + ' required condition(s): ' + mandatoryFailed.map((e) => e.title).join(', ') + '.';
  } else if (orRules.length > 0 && !orPassed && !orMissing) {
    status = 'ineligible';
    summary = 'None of the alternative conditions for this opportunity are met.';
  } else if (mandatoryMissing.length > 0) {
    status = 'needs_info';
    summary = 'Add the missing profile details to confirm: ' + mandatoryMissing.map((e) => e.title).join(', ') + '.';
  } else if (orRules.length > 0 && !orPassed) {
    status = 'potentially_eligible';
    summary = 'You meet the mandatory conditions. One alternative requirement could not be confirmed.';
  } else if (optionalAnd.some((e) => e.outcome !== 'pass')) {
    status = 'potentially_eligible';
    summary = 'Mandatory conditions are met; some optional conditions are unmet or unconfirmed.';
  }

  return {
    status,
    summary,
    counts: {
      total: evaluations.length,
      pass: evaluations.filter((e) => e.outcome === 'pass').length,
      fail: evaluations.filter((e) => e.outcome === 'fail').length,
      missing: evaluations.filter((e) => e.outcome === 'missing').length
    },
    evaluations
  };
}

export function profileCompleteness(profile) {
  const data = profile || {};
  const missing = PROFILE_FIELDS.filter((field) => isMissing(data[field.key]));
  const filled = PROFILE_FIELDS.length - missing.length;
  return {
    filled,
    total: PROFILE_FIELDS.length,
    percentage: Math.round((filled / PROFILE_FIELDS.length) * 100),
    missing: missing.map((field) => field.key),
    missing_labels: missing.map((field) => field.label)
  };
}