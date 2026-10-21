export const mockHighRiskCustomers = [
  { id: 'CUS-9012', name: 'Acme Studio', ltv: 45200, health: 35, risk: 'High Risk', lastSeen: '14 days ago', fee: '$120/mo' },
  { id: 'CUS-9013', name: 'Globex Inc.', ltv: 8400, health: 52, risk: 'Med Risk', lastSeen: '2 days ago', fee: '$450/mo' },
  { id: 'CUS-9014', name: 'Initech', ltv: 1440, health: 22, risk: 'High Risk', lastSeen: '5 days ago', fee: '$89/mo' },
];

export const mockPortfolioGrowth = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4780 },
  { name: 'May', value: 8900 },
  { name: 'Jun', value: 12000 },
];

export const mockQuadrantDist = [
  { name: 'True Friends', value: 450000, fill: '#0ea5e9', count: 48, desc: 'High LTV, High Loyalty' },
  { name: 'Butterflies', value: 210000, fill: '#38bdf8', count: 62, desc: 'High LTV, Low Loyalty' },
  { name: 'Barnacles', value: 180000, fill: '#94a3b8', count: 95, desc: 'Low LTV, High Loyalty' },
  { name: 'Strangers', value: 80000, fill: '#cbd5e1', count: 420, desc: 'Low LTV, Low Loyalty' },
];

export const mockFunnel = [
  { stage: 'Scanned', value: 5000 },
  { stage: 'Retrieved', value: 4900 },
  { stage: 'Negotiated', value: 2100 },
  { stage: 'Executed', value: 2100 },
  { stage: 'Saved', value: 850 },
];

export const mockInFlightOps = [
  { id: 'OP-9012', agentId: 'AG-04', client: 'Acme Corp', segment: 'True Friend', risk: 82, ltv: 45200, predSave: 82, action: '15% DISC + CALL', cost: 150, status: 'Running' },
  { id: 'OP-9011', agentId: 'AG-02', client: 'Globex Inc', segment: 'Barnacle', risk: 41, ltv: 8400, predSave: 41, action: 'AUTO RE-ENGAGE EMAIL', cost: 0.05, status: 'Success' },
  { id: 'OP-9010', agentId: 'AG-01', client: 'Initech', segment: 'Butterfly', risk: 15, ltv: 12000, predSave: 15, action: '10% DISC + TRIAL EXT', cost: 5, status: 'Queued' },
  { id: 'OP-9009', agentId: 'AG-04', client: 'Soylent Corp', segment: 'True Friend', risk: 95, ltv: 85100, predSave: 95, action: 'EXEC REACHOUT + 20%', cost: 0, status: 'Saved' },
  { id: 'OP-9008', agentId: 'AG-02', client: 'Massive Dyn', segment: 'Stranger', risk: 2, ltv: 1200, predSave: 2, action: 'EXIT SURVEY EMAIL', cost: 0.01, status: 'Churned' },
];

export const mockROI = [
  { cost: 150, ltv: 45000, segment: 'True Friends' },
  { cost: 200, ltv: 85000, segment: 'True Friends' },
  { cost: 10, ltv: 12000, segment: 'Butterflies' },
  { cost: 50, ltv: 20000, segment: 'Butterflies' },
  { cost: 0, ltv: 5000, segment: 'Barnacles' },
  { cost: 0.5, ltv: 8000, segment: 'Barnacles' },
];

export const mockActionRecords = [
  {
    customer_id: 'CUS-0002',
    group: 'treatment',
    tier: 'True_Friends_Standard',
    ltv: 32570000,
    churn_risk_score: 0.605,
    monthly_fee: 480000,
    sentiment: 'frustrated',
    pain_points: 'App crashes repeatedly; UI navigation difficult',
    action_type: 'vip_training',
    discount_pct: 0,
    free_months: 1,
    reasoning: 'High LTV account. Offer 1 month free extension and white-glove onboarding to protect long-term recurring revenue.',
    channel: 'phone_call',
    message_sent: 'Hi Brenda, our customer care team noticed you recently encountered app stability issues. We sincerely apologize for this inconvenience. As a token of our appreciation, we are offering you 1 month free extension and a dedicated VIP onboarding session.',
    agent_source: 'llm'
  },
  {
    customer_id: 'CUS-0006',
    group: 'treatment',
    tier: 'True_Friends_Standard',
    ltv: 16085000,
    churn_risk_score: 0.870,
    monthly_fee: 176000,
    sentiment: 'price_sensitive',
    pain_points: 'Competitor pricing comparison; Monthly rate too high',
    action_type: 'discount',
    discount_pct: 25,
    free_months: 0,
    reasoning: 'Apply max 25% discount per guardrail policy to retain long-tenure subscriber, optimizing CRC vs complete LTV loss.',
    channel: 'phone_call',
    message_sent: 'Hi Charles, we understand you are evaluating alternative market rates. To thank you for staying with us, we would love to extend a 25% discount on your upcoming renewal cycle.',
    agent_source: 'llm'
  }
];

export const mockPainPointsData = [
  { pain_point: 'Slow Network / High Latency', count: 342, category: 'Technical' },
  { pain_point: 'Billing Ambiguity / Hidden Fees', count: 280, category: 'Billing' },
  { pain_point: 'Competitor Offer Comparison', count: 215, category: 'Competitor' },
  { pain_point: 'App Crash & Instability', count: 185, category: 'Technical' },
  { pain_point: 'Feature Usability Confusion', count: 140, category: 'Usability' },
];

export const mockActionEffectiveness = [
  { action: 'VIP Training', savedRate: 78, cost: 20000, avgLTV: 28000000 },
  { action: 'Discount (15-25%)', savedRate: 65, cost: 85000, avgLTV: 18500000 },
  { action: 'Loyalty Upgrade', savedRate: 58, cost: 120000, avgLTV: 16000000 },
  { action: 'Pause Sub', savedRate: 42, cost: 0, avgLTV: 9500000 },
  { action: 'Newsletter', savedRate: 24, cost: 0, avgLTV: 4200000 }
];

export const mockUpliftData = [
  { name: 'Holdout (No Action)', churnRate: 64.5, fill: '#f43f5e' },
  { name: 'Treatment (Multi-Agent AI)', churnRate: 28.2, fill: '#0d9488' }
];
