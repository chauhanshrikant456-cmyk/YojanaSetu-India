import { evaluateRules, profileCompleteness } from './eligibility.ts';
import { analyzeGaps } from './graph.ts';

export function resolveWeights(settings) {
  const weights = {
    eligibility: Number(settings?.eligibility_weight ?? 30),
    document: Number(settings?.document_weight ?? 30),
    dependency: Number(settings?.dependency_weight ?? 25),
    profile: Number(settings?.profile_weight ?? 15)
  };
  const total = weights.eligibility + weights.document + weights.dependency + weights.profile;
  return { weights, total };
}

export function readinessLabel(score, settings) {
  const ready = Number(settings?.ready_threshold ?? 80);
  const preparation = Number(settings?.preparation_threshold ?? 50);
  if (score >= ready) return 'Ready to Apply';
  if (score >= preparation) return 'In Preparation';
  return 'Action Required';
}

export function computeReadiness({ profile, rules, requiredDocCodes, documents, documentTypes, edges, settings }) {
  const { weights, total } = resolveWeights(settings);
  const pendingCredit = Number(settings?.pending_document_credit ?? 0.6);
  const typesByCode = {};
  (documentTypes || []).forEach((type) => {
    typesByCode[type.code] = type;
  });

  const eligibility = evaluateRules(profile, rules);
  const evaluationCount = eligibility.counts.total;
  let eligibilityRatio = evaluationCount > 0 ? eligibility.counts.pass / evaluationCount : 0;
  if (eligibility.status === 'ineligible') eligibilityRatio = 0;
  const eligibilityPoints = eligibilityRatio * weights.eligibility;

  const required = requiredDocCodes || [];
  const held = (documents || []).filter((doc) => ['uploaded', 'pending_verification', 'verified'].includes(doc.status));

  const documentDetail = required.map((code) => {
    const record = (documents || []).find((doc) => doc.document_code === code);
    const status = record?.status || 'missing';
    let credit = 0;
    if (status === 'verified') credit = 1;
    else if (status === 'uploaded' || status === 'pending_verification') credit = pendingCredit;
    return {
      code,
      name: typesByCode[code]?.name || record?.document_name || code,
      status,
      credit,
      expiry_date: record?.expiry_date || null,
      rejection_reason: record?.rejection_reason || null,
      blocked: false,
      blocked_by: []
    };
  });

  const heldCodes = new Set(held.map((doc) => doc.document_code));
  const unresolvedSet = new Set(documentDetail.filter((item) => !heldCodes.has(item.code)).map((item) => item.code));
  const gaps = analyzeGaps(required, edges || [], unresolvedSet);
  const blockedSet = new Set(gaps.blocked);

  documentDetail.forEach((item) => {
    item.blocked = blockedSet.has(item.code);
    item.blocked_by = (gaps.blocked_by[item.code] || []).map((code) => ({
      code,
      name: typesByCode[code]?.name || code
    }));
  });

  const documentRatio = required.length > 0
    ? documentDetail.reduce((sum, item) => sum + item.credit, 0) / required.length
    : 1;
  const documentPoints = documentRatio * weights.document;

  const dependencyRatio = required.length > 0
    ? 1 - (gaps.blocked.length / required.length)
    : 1;
  const dependencyPoints = Math.max(0, dependencyRatio) * weights.dependency;

  const completeness = profileCompleteness(profile);
  const profilePoints = (completeness.percentage / 100) * weights.profile;

  const rawScore = eligibilityPoints + documentPoints + dependencyPoints + profilePoints;
  const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const statusLabel = readinessLabel(overallScore, settings);

  const nextActions = [];
  if (eligibility.status === 'ineligible') {
    nextActions.push({
      label: 'Review the conditions you did not meet before investing more time',
      detail: eligibility.summary,
      link: '/eligibility'
    });
  }
  if (completeness.missing.length > 0) {
    nextActions.push({
      label: 'Complete your profile',
      detail: 'Missing: ' + completeness.missing_labels.slice(0, 6).join(', '),
      link: '/profile'
    });
  }
  gaps.roots.slice(0, 3).forEach((code) => {
    const blockedNames = documentDetail.filter((item) => item.blocked_by.some((dep) => dep.code === code)).map((item) => item.name);
    nextActions.push({
      label: 'Obtain ' + (typesByCode[code]?.name || code) + ' first',
      detail: blockedNames.length > 0
        ? 'It is a prerequisite for ' + blockedNames.join(', ') + '.'
        : 'This is the earliest step in the dependency chain.',
      link: '/documents'
    });
  });
  documentDetail
    .filter((item) => !item.blocked && (item.status === 'missing' || item.status === 'expired' || item.status === 'rejected'))
    .slice(0, 4)
    .forEach((item) => {
      const detail = item.status === 'rejected'
        ? (item.rejection_reason ? 'Rejected: ' + item.rejection_reason : 'The uploaded copy was rejected.')
        : item.status === 'expired'
          ? 'The stored copy has expired.'
          : 'Not yet uploaded.';
      nextActions.push({
        label: (item.status === 'rejected' ? 'Replace ' : 'Upload ') + item.name,
        detail,
        link: '/documents'
      });
    });
  documentDetail
    .filter((item) => item.status === 'pending_verification')
    .slice(0, 2)
    .forEach((item) => {
      nextActions.push({
        label: item.name + ' is awaiting verification',
        detail: 'Partial credit is applied until an administrator verifies it.',
        link: '/documents'
      });
    });
  if (overallScore >= Number(settings?.ready_threshold ?? 80)) {
    nextActions.push({
      label: 'Review the official notification and apply on the official portal',
      detail: 'Readiness is a preparation indicator, not a guarantee of selection.',
      link: null
    });
  }

  return {
    overall_score: overallScore,
    status_label: statusLabel,
    eligibility,
    profile: completeness,
    points: {
      eligibility: Math.round(eligibilityPoints * 10) / 10,
      document: Math.round(documentPoints * 10) / 10,
      dependency: Math.round(dependencyPoints * 10) / 10,
      profile: Math.round(profilePoints * 10) / 10
    },
    weights,
    weight_total: total,
    thresholds: {
      ready: Number(settings?.ready_threshold ?? 80),
      preparation: Number(settings?.preparation_threshold ?? 50)
    },
    documents: documentDetail,
    dependency: {
      roots: gaps.roots.map((code) => ({ code, name: typesByCode[code]?.name || code })),
      blocked: gaps.blocked.map((code) => ({
        code,
        name: typesByCode[code]?.name || code,
        blocked_by: (gaps.blocked_by[code] || []).map((dep) => typesByCode[dep]?.name || dep)
      })),
      sequence: gaps.sequence.map((code) => ({ code, name: typesByCode[code]?.name || code })),
      needed: gaps.needed
    },
    explanations: [
      {
        component: 'Eligibility verification',
        weight: weights.eligibility,
        earned: Math.round(eligibilityPoints * 10) / 10,
        note: evaluationCount === 0
          ? 'No eligibility conditions are published for this listing yet, so no points can be awarded for this component.'
          : eligibility.status === 'ineligible'
            ? 'An ineligible verdict scores zero here; ' + eligibility.counts.pass + ' of ' + evaluationCount + ' conditions passed.'
            : eligibility.counts.pass + ' of ' + evaluationCount + ' published conditions passed. Missing details never count as a pass.'
      },
      {
        component: 'Document fulfilment',
        weight: weights.document,
        earned: Math.round(documentPoints * 10) / 10,
        note: required.length > 0
          ? 'Verified documents score fully, uploaded or pending documents score ' + Math.round(pendingCredit * 100) + '%, the rest score zero.'
          : 'This opportunity lists no required documents.'
      },
      {
        component: 'Dependency integrity',
        weight: weights.dependency,
        earned: Math.round(dependencyPoints * 10) / 10,
        note: gaps.blocked.length + ' of ' + required.length + ' required document(s) are waiting on an unresolved prerequisite.'
      },
      {
        component: 'Profile completeness',
        weight: weights.profile,
        earned: Math.round(profilePoints * 10) / 10,
        note: completeness.filled + ' of ' + completeness.total + ' profile fields are filled.'
      }
    ],
    next_actions: nextActions,
    has_missing_profile_data: completeness.missing.length > 0,
    has_unverified_documents: documentDetail.some((item) => item.status === 'pending_verification' || item.status === 'uploaded')
  };
}