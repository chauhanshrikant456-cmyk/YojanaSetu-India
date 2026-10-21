import { EDUCATION_OPTIONS, PROFILE_CATEGORY_OPTIONS, GENDER_OPTIONS, STATE_OPTIONS } from '@/lib/constants';

export const PROFILE_FIELDS = [
  { key: 'annualFamilyIncome', profileField: 'annual_family_income', label: 'Annual family income (₹)', type: 'number', placeholder: 'e.g. 250000' },
  { key: 'marksPercentage', profileField: 'marks_percentage', label: 'Marks percentage', type: 'number', placeholder: 'e.g. 78' },
  { key: 'state', profileField: 'state', label: 'State you study in', type: 'select', options: STATE_OPTIONS },
  { key: 'domicileState', profileField: 'domicile_state', label: 'Domicile state', type: 'select', options: STATE_OPTIONS },
  { key: 'educationLevel', profileField: 'education_level', label: 'Current education level', type: 'select', options: EDUCATION_OPTIONS },
  { key: 'course', profileField: 'course', label: 'Course or stream', type: 'text', placeholder: 'e.g. BSc Physics' },
  { key: 'currentStudyYear', profileField: 'current_study_year', label: 'Current study year', type: 'number', placeholder: 'e.g. 2' },
  { key: 'category', profileField: 'category', label: 'Category', type: 'select', options: PROFILE_CATEGORY_OPTIONS },
  { key: 'gender', profileField: 'gender', label: 'Gender', type: 'select', options: GENDER_OPTIONS },
  { key: 'age', profileField: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 21' },
  { key: 'disabilityStatus', profileField: 'disability_status', label: 'Certified disability', type: 'boolean' },
  { key: 'entranceExamScore', profileField: 'entrance_exam_score', label: 'Entrance exam score or rank', type: 'number', placeholder: 'e.g. 68' },
  { key: 'passingYear', profileField: 'passing_year', label: 'Year of passing last exam', type: 'number', placeholder: 'e.g. 2025' }
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

export function profileCompleteness(profile) {
  if (!profile) return { filled: 0, total: PROFILE_FIELDS.length, percentage: 0, missing: PROFILE_FIELDS };
  const missing = PROFILE_FIELDS.filter((field) => !isFilled(profile[field.profileField]));
  const filled = PROFILE_FIELDS.length - missing.length;
  return {
    filled,
    total: PROFILE_FIELDS.length,
    percentage: Math.round((filled / PROFILE_FIELDS.length) * 100),
    missing
  };
}

export function toEngineProfile(profile) {
  const engine = {};
  PROFILE_FIELDS.forEach((field) => {
    const value = profile?.[field.profileField];
    if (isFilled(value)) engine[field.key] = value;
  });
  return engine;
}

export function emptyProfileDraft() {
  const draft = {};
  PROFILE_FIELDS.forEach((field) => {
    draft[field.profileField] = '';
  });
  return draft;
}

export function profileToDraft(profile) {
  const draft = emptyProfileDraft();
  PROFILE_FIELDS.forEach((field) => {
    const value = profile?.[field.profileField];
    if (value !== undefined && value !== null) draft[field.profileField] = value;
  });
  return draft;
}

export function draftToPayload(draft) {
  const payload = {};
  PROFILE_FIELDS.forEach((field) => {
    const value = draft[field.profileField];
    if (!isFilled(value)) {
      payload[field.profileField] = null;
      return;
    }
    if (field.type === 'number') payload[field.profileField] = Number(value);
    else if (field.type === 'boolean') payload[field.profileField] = value === true || value === 'yes' || value === 'true';
    else payload[field.profileField] = value;
  });
  return payload;
}