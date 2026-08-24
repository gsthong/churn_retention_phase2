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
    roi?: number;
  };
  provider: string;
  models: {
    retriever: string;
    negotiator: string;
    execution: string;
  };
}

export interface ActionRecord {
  customer_id: string;
  group: string;
  tier: string;
  ltv: number;
  churn_risk_score: number;
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
  uplift_comparison: {
    holdout_churn_rate: number;
    treatment_churn_rate: number;
    uplift: number;
  };
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
