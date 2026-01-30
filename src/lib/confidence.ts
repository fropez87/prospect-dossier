import { Dossier } from "./types";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceResult {
  level: ConfidenceLevel;
  score: number; // 0-100
  label: string;
  notes: string | null; // from Claude's self-assessment
}

/**
 * Calculates a confidence score for a dossier based on:
 * 1. Source count (how many web sources were found)
 * 2. Field completeness (how many fields are populated vs null/empty)
 * 3. Content depth (are populated fields substantive or thin)
 */
export function calculateConfidence(dossier: Dossier): ConfidenceResult {
  const sourceScore = getSourceScore(dossier.sources.length);
  const completenessScore = getCompletenessScore(dossier);
  const depthScore = getDepthScore(dossier);

  // Weighted: completeness 40%, sources 30%, depth 30%
  const score = Math.round(
    completenessScore * 0.4 + sourceScore * 0.3 + depthScore * 0.3
  );

  const level: ConfidenceLevel =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  const label =
    level === "high"
      ? "High Confidence"
      : level === "medium"
        ? "Medium Confidence"
        : "Low Confidence";

  return {
    level,
    score,
    label,
    notes: dossier.content.confidence_notes || null,
  };
}

function getSourceScore(count: number): number {
  if (count >= 15) return 100;
  if (count >= 10) return 80;
  if (count >= 5) return 60;
  if (count >= 2) return 35;
  return 10;
}

function getCompletenessScore(dossier: Dossier): number {
  const { content } = dossier;
  const snap = content.company_snapshot;
  const fin = content.financial_signals;

  const checks = [
    !!snap.description,
    !!snap.industry,
    !!snap.hq_location,
    !!snap.founded,
    !!snap.employees,
    !!snap.revenue_estimate,
    !!content.business_model.value_proposition,
    !!content.business_model.revenue_model,
    content.business_model.products_services.length > 0,
    content.business_model.target_customers.length > 0,
    content.leadership.length > 0,
    content.recent_activity.funding?.length > 0 ||
      content.recent_activity.acquisitions?.length > 0 ||
      content.recent_activity.product_launches?.length > 0 ||
      content.recent_activity.press?.length > 0,
    !!content.market_context.positioning,
    !!content.market_context.industry_trends,
    content.market_context.competitors.length > 0,
    !!fin.financials,
    !!fin.funding_history,
    !!fin.growth_indicators,
    content.pain_points.length > 0,
    content.conversation_starters.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function getDepthScore(dossier: Dossier): number {
  const { content } = dossier;
  let points = 0;
  let maxPoints = 0;

  // Description length (3-5 sentences ≈ 150+ chars)
  maxPoints += 10;
  const descLen = content.company_snapshot.description?.length || 0;
  if (descLen >= 200) points += 10;
  else if (descLen >= 100) points += 6;
  else if (descLen > 0) points += 3;

  // Leadership count (target: 4-6)
  maxPoints += 10;
  const leaderCount = content.leadership.length;
  if (leaderCount >= 4) points += 10;
  else if (leaderCount >= 2) points += 6;
  else if (leaderCount >= 1) points += 3;

  // Leadership background depth
  maxPoints += 10;
  const avgBgLen =
    leaderCount > 0
      ? content.leadership.reduce((sum, l) => sum + (l.background?.length || 0), 0) / leaderCount
      : 0;
  if (avgBgLen >= 100) points += 10;
  else if (avgBgLen >= 50) points += 6;
  else if (avgBgLen > 0) points += 3;

  // Products/services count (target: 5-8)
  maxPoints += 10;
  const prodCount = content.business_model.products_services.length;
  if (prodCount >= 5) points += 10;
  else if (prodCount >= 3) points += 6;
  else if (prodCount >= 1) points += 3;

  // Competitors count (target: 5-8)
  maxPoints += 10;
  const compCount = content.market_context.competitors.length;
  if (compCount >= 5) points += 10;
  else if (compCount >= 3) points += 6;
  else if (compCount >= 1) points += 3;

  // Pain points count (target: 5-7)
  maxPoints += 10;
  const painCount = content.pain_points.length;
  if (painCount >= 5) points += 10;
  else if (painCount >= 3) points += 6;
  else if (painCount >= 1) points += 3;

  // Conversation starters count (target: 5-7)
  maxPoints += 10;
  const starterCount = content.conversation_starters.length;
  if (starterCount >= 5) points += 10;
  else if (starterCount >= 3) points += 6;
  else if (starterCount >= 1) points += 3;

  // Financial detail depth
  maxPoints += 10;
  const finFields = [
    content.financial_signals.financials,
    content.financial_signals.funding_history,
    content.financial_signals.growth_indicators,
  ].filter(Boolean);
  const avgFinLen =
    finFields.length > 0
      ? finFields.reduce((sum, f) => sum + (f?.length || 0), 0) / finFields.length
      : 0;
  if (avgFinLen >= 100 && finFields.length >= 2) points += 10;
  else if (avgFinLen >= 50) points += 6;
  else if (finFields.length > 0) points += 3;

  // Recent activity breadth
  maxPoints += 10;
  const activityCategories = [
    content.recent_activity.funding,
    content.recent_activity.acquisitions,
    content.recent_activity.product_launches,
    content.recent_activity.leadership_changes,
    content.recent_activity.press,
  ].filter((arr) => arr && arr.length > 0).length;
  if (activityCategories >= 4) points += 10;
  else if (activityCategories >= 2) points += 6;
  else if (activityCategories >= 1) points += 3;

  // Market context depth
  maxPoints += 10;
  const posLen = content.market_context.positioning?.length || 0;
  const trendLen = content.market_context.industry_trends?.length || 0;
  if (posLen >= 100 && trendLen >= 100) points += 10;
  else if (posLen >= 50 || trendLen >= 50) points += 6;
  else if (posLen > 0 || trendLen > 0) points += 3;

  return maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
}
