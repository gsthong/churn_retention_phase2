const API_BASE = 'http://127.0.0.1:8000/api';

export interface StatsResponse {
  total_customers: number;
  treatment_count: number;
  holdout_count: number;
  total_ltv_at_risk_vnd: number;
  avg_ltv_vnd: number;
  avg_churn_risk: number;
  roi_metrics?: {
    n_holdout?: number;
    n_treatment?: number;
    churn_rate_holdout?: number;
    churn_rate_treatment?: number;
    uplift_pct_points?: number;
    customers_saved_estimate?: number;
    avg_ltv_treatment?: number;
    revenue_saved_vnd?: number;
    total_action_cost_vnd?: number;
    cost_per_save_vnd?: number;
    margin_erosion_pct?: number;
    sleeping_dogs_avoided_cost_vnd?: number;
    grr_pct?: number;
    nrr_pct?: number;
    roi?: number;
  };
  provider: string;
  models: {
    retriever: string;
    negotiator: string;
    execution: string;
  };
}

export interface InterventionItem {
  id: string;
  name: string;
  cost_usd: number | string;
  cost_vnd: number;
  churn_reduced_pp: string;
  suitable_for: string;
  frequency: string;
  max_budget_usd: number;
  risk_level: number;
  description: string;
}

export interface BudgetCeilingItem {
  churn_risk: string;
  barrier: string;
  clv: string;
  action: string;
  budget_ceiling: string;
}

export interface ActionRecord {
  customer_id: string;
  group: string;
  tier: string;
  ltv: number;
  churn_risk_score: number;
  churn_reason?: string;
  churn_category?: string;
  monthly_fee: number;
  sentiment: string;
  pain_points: string;
  action_type: string;
  discount_pct: number;
  free_months: number;
  reasoning: string;
  channel: string;
  message_sent: string;
  agent_source: string;
}

export interface AnalyticsResponse {
  quadrants: { name: string; count: number; total_ltv: number }[];
  actions_dist: { action: string; count: number }[];
  sentiment_dist: { sentiment: string; count: number }[];
  pain_points: { pain_point: string; count: number }[];
  churn_categories?: { category: string; count: number }[];
  top_churn_reasons?: { reason: string; count: number }[];
  uplift_comparison: {
    holdout_churn_rate: number;
    treatment_churn_rate: number;
    uplift: number;
  };
}

export interface Phase1DatasetSummary {
  dataset_name: string;
  total_records: number;
  churned_records: number;
  retained_records: number;
  churn_rate_pct: number;
  voluntary_churn_count: number;
  involuntary_churn_count: number;
  vague_churn_count: number;
  top_churn_reasons: { reason: string; count: number }[];
  contract_distribution: Record<string, number>;
  payment_method_distribution: Record<string, number>;
  monthly_charges_usd: { min: number; mean: number; max: number; median: number };
}

export interface AgentGraphResponse {
  pipeline_name: string;
  nodes: {
    id: string;
    name: string;
    type: string;
    role: string;
    model: string;
    status: string;
  }[];
  edges: {
    from: string;
    to: string;
    label: string;
  }[];
  guardrails: Record<string, {
    max_discount_pct: number;
    max_free_months: number;
    allowed_actions: string[];
  }>;
}

export interface PoliciesResponse {
  guardrails: Record<string, {
    max_discount_pct: number;
    max_free_months: number;
    allowed_actions: string[];
  }>;
  policies_config?: {
    frameworks?: Record<string, {
      name: string;
      description: string;
      target_crc_ratio: string;
      barnacle_philosophy: string;
    }>;
    segments?: Record<string, any>;
    hitl_governance_rules?: any;
    data_privacy_rules?: any;
    intervention_catalog?: InterventionItem[];
    budget_ceiling_matrix?: BudgetCeilingItem[];
  };
  matrix_table?: any[];
  action_costs: Record<string, string>;
}

export interface HitlQueueResponse {
  summary: {
    total_treatment_cases: number;
    tier1_autonomous_count: number;
    tier1_autonomous_pct: number;
    tier2_batch_count: number;
    tier2_batch_pct: number;
    tier3_copilot_count: number;
    tier3_copilot_pct: number;
    target_automation_ratio: string;
  };
  tier1_autonomous: ActionRecord[];
  tier2_batch: ActionRecord[];
  tier3_copilot: ActionRecord[];
}

export interface PrivacyTelemetryResponse {
  status: string;
  pii_masking: {
    enabled: boolean;
    masked_attributes: string[];
    redaction_method: string;
    llm_exposure_level: string;
  };
  regulatory_frameworks: {
    name: string;
    status: string;
    audit_score: string;
  }[];
  hitl_split: {
    ai_autonomous_pct: number;
    human_oversight_pct: number;
    human_saved_hours_monthly: number;
    estimated_labor_cost_saved_vnd: number;
  };
}

export async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchActions(params?: { tier?: string; action_type?: string; channel?: string; limit?: number }): Promise<{ total: number; actions: ActionRecord[] }> {
  try {
    const query = new URLSearchParams();
    if (params?.tier) query.append('tier', params.tier);
    if (params?.action_type) query.append('action_type', params.action_type);
    if (params?.channel) query.append('channel', params.channel);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/actions?${query.toString()}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return { total: 0, actions: [] };
  }
}

export async function fetchAnalytics(): Promise<AnalyticsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgentGraph(): Promise<AgentGraphResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/agent-graph`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPolicies(): Promise<PoliciesResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/policies`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchHitlQueue(): Promise<HitlQueueResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hitl/queue`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function overrideAction(payload: {
  customer_id: string;
  action_type: string;
  discount_pct: number;
  free_months: number;
  specialist_note: string;
  custom_message?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/hitl/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function batchApprove(payload: { customer_ids?: string[]; tier?: string }): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/hitl/batch-approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPrivacyTelemetry(): Promise<PrivacyTelemetryResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/hitl/privacy-telemetry`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPhase1Summary(): Promise<Phase1DatasetSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/phase1/dataset-summary`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}

export async function trainPhase1Model(payload?: { n_customers?: number; filter_voluntary?: boolean }): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/phase1/train-and-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return null;
  }
}
