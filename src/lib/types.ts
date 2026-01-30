export interface CompanySnapshot {
  description: string;
  industry: string;
  hq_location: string;
  founded: string | null;
  employees: string | null;
  revenue_estimate: string | null;
}

export interface BusinessModel {
  products_services: string[];
  revenue_model: string;
  target_customers: string[];
  value_proposition: string;
}

export interface Leader {
  name: string;
  title: string;
  background: string;
}

export interface RecentActivity {
  funding: string[];
  acquisitions: string[];
  product_launches: string[];
  leadership_changes: string[];
  press: string[];
}

export interface MarketContext {
  competitors: string[];
  positioning: string;
  industry_trends: string;
}

export interface FinancialSignals {
  financials: string | null;
  funding_history: string | null;
  growth_indicators: string | null;
}

export interface DossierContent {
  company_snapshot: CompanySnapshot;
  business_model: BusinessModel;
  leadership: Leader[];
  recent_activity: RecentActivity;
  market_context: MarketContext;
  financial_signals: FinancialSignals;
  pain_points: string[];
  conversation_starters: string[];
  confidence_notes: string | null;
}

export interface Dossier {
  id: string;
  company_name: string;
  company_url: string | null;
  content: DossierContent;
  sources: string[];
  created_at: string;
}

export interface GenerateRequest {
  input: string;
}

export interface GenerateResponse {
  id: string;
  status: "processing" | "complete" | "failed";
  dossier?: Dossier;
  error?: string;
}
