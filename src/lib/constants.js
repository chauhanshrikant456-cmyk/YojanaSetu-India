export const CATEGORY_META = {
  scholarship: {
    label: 'Scholarships',
    singular: 'Scholarship',
    blurb: 'Central and state financial assistance for students, with income and marks conditions.',
    className: 'bg-primary/10 text-primary'
  },
  admission: {
    label: 'Admissions & Counselling',
    singular: 'Admission',
    blurb: 'Counselling, seat allotment and university admission processes across India.',
    className: 'bg-chart-2/10 text-chart-2'
  },
  examination: {
    label: 'Examinations',
    singular: 'Examination',
    blurb: 'Entrance and recruitment examinations, with the documents each stage asks for.',
    className: 'bg-chart-3/10 text-chart-3'
  },
  certification: {
    label: 'Certifications & Skills',
    singular: 'Certification',
    blurb: 'Skill courses and industry certifications you can complete alongside your studies.',
    className: 'bg-chart-4/10 text-chart-4'
  },
  fellowship: {
    label: 'Fellowships & Internships',
    singular: 'Fellowship',
    blurb: 'Research fellowships, internships and entrepreneurship support programmes.',
    className: 'bg-chart-5/10 text-chart-5'
  }
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label
}));

export const EDUCATION_META = {
  class_10: { label: 'Class 10' },
  class_12: { label: 'Class 12' },
  undergraduate: { label: "Bachelor's / Undergraduate" },
  postgraduate: { label: "Master's / Postgraduate" },
  phd: { label: 'PhD / Research' },
  diploma: { label: 'Diploma / Polytechnic' },
  iti: { label: 'ITI / Vocational' },
  any: { label: 'Any level' },
  none: { label: 'Not currently studying' }
};

export const EDUCATION_OPTIONS = Object.entries(EDUCATION_META).map(([value, meta]) => ({
  value,
  label: meta.label
}));

export const PROFILE_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
  { value: 'minority', label: 'Minority' },
  { value: 'other', label: 'Other' }
];

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

export const STATE_OPTIONS = INDIAN_STATES.map((state) => ({ value: state, label: state }));

export const STATUSES_ALLOWED = ['published', 'closing_soon', 'needs_verification'];

export const OPPORTUNITY_STATUS_META = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  published: { label: 'Published', className: 'bg-success/10 text-success' },
  closing_soon: { label: 'Closing soon', className: 'bg-warning/10 text-warning' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
  needs_verification: { label: 'Needs verification', className: 'bg-warning/10 text-warning' }
};

export const OPPORTUNITY_STATUS_OPTIONS = Object.entries(OPPORTUNITY_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label
}));

export const VERDICT_META = {
  eligible: { label: 'Eligible', className: 'bg-success/10 text-success' },
  potentially_eligible: { label: 'Potentially eligible', className: 'bg-warning/10 text-warning' },
  ineligible: { label: 'Ineligible', className: 'bg-destructive/10 text-destructive' },
  needs_info: { label: 'Needs more information', className: 'bg-accent text-accent-foreground' }
};

export const DOC_STATUS_META = {
  missing: { label: 'Missing', className: 'bg-muted text-muted-foreground' },
  uploaded: { label: 'Uploaded', className: 'bg-accent text-accent-foreground' },
  pending_verification: { label: 'Pending verification', className: 'bg-warning/10 text-warning' },
  verified: { label: 'Verified', className: 'bg-success/10 text-success' },
  expired: { label: 'Expired', className: 'bg-destructive/10 text-destructive' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' }
};

export const APPLICATION_STATUS_META = {
  interested: { label: 'Interested', className: 'bg-muted text-muted-foreground' },
  preparing_documents: { label: 'Preparing documents', className: 'bg-accent text-accent-foreground' },
  ready_to_apply: { label: 'Ready to apply', className: 'bg-chart-2/10 text-chart-2' },
  applied: { label: 'Applied', className: 'bg-primary/10 text-primary' },
  under_review: { label: 'Under review', className: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground' }
};

export const APPLICATION_STATUS_ORDER = [
  'interested', 'preparing_documents', 'ready_to_apply', 'applied', 'under_review',
  'approved', 'rejected', 'withdrawn'
];

export const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUS_ORDER.map((value) => ({
  value,
  label: APPLICATION_STATUS_META[value].label
}));

export const OPERATOR_META = {
  eq: { label: 'is equal to', wantsValue: true },
  ne: { label: 'is not equal to', wantsValue: true },
  lt: { label: 'is less than', wantsValue: true },
  lte: { label: 'is less than or equal to', wantsValue: true },
  gt: { label: 'is greater than', wantsValue: true },
  gte: { label: 'is greater than or equal to', wantsValue: true },
  between: { label: 'is between', wantsValue: true, wantsSecondValue: true },
  in: { label: 'is one of', wantsValue: true, hint: 'Separate values with commas' },
  not_in: { label: 'is not one of', wantsValue: true, hint: 'Separate values with commas' },
  exists: { label: 'is provided', wantsValue: false },
  regex: { label: 'matches pattern', wantsValue: true, hint: 'Simple patterns only' }
};

export const OPERATOR_OPTIONS = Object.entries(OPERATOR_META).map(([value, meta]) => ({
  value,
  label: meta.label
}));

export const READINESS_STATUS_META = {
  'Ready to Apply': { className: 'bg-success/10 text-success' },
  'In Preparation': { className: 'bg-warning/10 text-warning' },
  'Action Required': { className: 'bg-destructive/10 text-destructive' }
};

export const FAQS = [
  {
    question: 'Is YojanaSetu India an official government portal?',
    answer: 'No. It is an independent preparation and decision-support tool. Every listing links to the official notification and application portal, and applications are always submitted on the official website.'
  },
  {
    question: 'How reliable are the eligibility verdicts?',
    answer: 'Verdicts come from the eligibility rules published for each scheme by the platform team, checked against the information in your profile. Missing details are never treated as a pass, and schemes awaiting verification are labelled as such.'
  },
  {
    question: 'What does the readiness score mean?',
    answer: 'It is a 0-100 preparation indicator built from eligibility verification, document fulfilment, dependency integrity and profile completeness, using weights the administrators configure. It is not a selection probability.'
  },
  {
    question: 'Where are my uploaded documents stored?',
    answer: 'Documents are stored in secure private storage and are only accessible to you and the administrators who verify them. No public link is created.'
  },
  {
    question: 'Why do some dates say To Be Announced?',
    answer: 'Because the official date has not been published yet. The platform does not guess deadlines — a listing stays marked as needing verification until an administrator confirms it against the official source.'
  }
];

export const DISCLAIMER =
  'YojanaSetu India is an independent information and preparation platform. It is not affiliated with, and does not represent, any government department or examination authority. Always confirm details on the official notification before applying.';