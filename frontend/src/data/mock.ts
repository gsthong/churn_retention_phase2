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
  { name: 'True Friends', value: 450000, fill: '#0ea5e9' },
  { name: 'Butterflies', value: 210000, fill: '#38bdf8' },
  { name: 'Barnacles', value: 180000, fill: '#94a3b8' },
  { name: 'Strangers', value: 80000, fill: '#cbd5e1' },
];

export const mockFunnel = [
  { stage: 'Scanned', value: 5000 },
  { stage: 'Retrieved', value: 4900 },
  { stage: 'Negotiated', value: 2100 },
  { stage: 'Executed', value: 2100 },
  { stage: 'Saved', value: 850 },
];

export const mockInFlightOps = [
  { id: 'OP-9012', client: 'Acme Corp', segment: 'True Friend', risk: 82, ltv: 45200, action: '15% DISC + CALL', cost: 150, status: 'Running' },
  { id: 'OP-9011', client: 'Globex Inc', segment: 'Barnacle', risk: 41, ltv: 8400, action: 'AUTO RE-ENGAGE', cost: 0.05, status: 'Success' },
  { id: 'OP-9010', client: 'Initech', segment: 'Butterfly', risk: 15, ltv: 12000, action: '10% DISC + EXT', cost: 5, status: 'Queued' },
  { id: 'OP-9009', client: 'Soylent Corp', segment: 'True Friend', risk: 95, ltv: 85100, action: 'EXEC REACHOUT', cost: 0, status: 'Saved' },
  { id: 'OP-9008', client: 'Massive Dyn', segment: 'Stranger', risk: 2, ltv: 1200, action: 'EXIT SURVEY', cost: 0.01, status: 'Churned' },
];

export const mockROI = [
  { cost: 150, ltv: 45000, segment: 'True Friends' },
  { cost: 200, ltv: 85000, segment: 'True Friends' },
  { cost: 10, ltv: 12000, segment: 'Butterflies' },
  { cost: 50, ltv: 20000, segment: 'Butterflies' },
  { cost: 0, ltv: 5000, segment: 'Barnacles' },
  { cost: 0.5, ltv: 8000, segment: 'Barnacles' },
];
