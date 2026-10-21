// Site-wide identity and the official government portals shown in the footer.
// Every URL here is an official government or authority domain.

export const SITE_NAME = 'YojanaSetu India';

export const SUPPORT_EMAIL = 'backbenchers2456@gmail.com';

export const CREATORS = 'Shrikant and Shreyansh';

export const ADMIN_ENTRY_PATH = '/login?returnTo=/admin';

// Official portals grouped by the platform's own categories.
export const OFFICIAL_PORTALS = [
  {
    label: 'Scholarships',
    links: [
      { label: 'National Scholarship Portal', url: 'https://scholarships.gov.in' },
      { label: 'myScheme (Govt. of India)', url: 'https://www.myscheme.gov.in' },
      { label: 'UGC scholarships', url: 'https://www.ugc.gov.in' }
    ]
  },
  {
    label: 'Admissions & Counselling',
    links: [
      { label: 'JoSAA counselling', url: 'https://josaa.nic.in' },
      { label: 'MCC medical counselling', url: 'https://mcc.nic.in' },
      { label: 'AICTE', url: 'https://www.aicte-india.org' }
    ]
  },
  {
    label: 'Examinations',
    links: [
      { label: 'National Testing Agency', url: 'https://nta.ac.in' },
      { label: 'CBSE', url: 'https://www.cbse.gov.in' },
      { label: 'UGC NET', url: 'https://ugcnet.nta.ac.in' }
    ]
  },
  {
    label: 'Certifications & Skills',
    links: [
      { label: 'SWAYAM', url: 'https://swayam.gov.in' },
      { label: 'NPTEL', url: 'https://nptel.ac.in' },
      { label: 'Skill India / NSDC', url: 'https://www.nsdcindia.org' }
    ]
  },
  {
    label: 'Fellowships & Internships',
    links: [
      { label: 'AICTE internship portal', url: 'https://internship.aicte-india.org' },
      { label: 'DST INSPIRE', url: 'https://www.online-inspire.gov.in' },
      { label: 'National Career Service', url: 'https://www.ncs.gov.in' }
    ]
  }
];

// Government utilities that help with documents, verification and applications.
export const GOVERNMENT_UTILITIES = [
  { label: 'Ministry of Education', url: 'https://www.education.gov.in' },
  { label: 'India.gov.in', url: 'https://www.india.gov.in' },
  { label: 'DigiLocker', url: 'https://www.digilocker.gov.in' },
  { label: 'UMANG', url: 'https://web.umang.gov.in' },
  { label: 'National Career Service', url: 'https://www.ncs.gov.in' }
];