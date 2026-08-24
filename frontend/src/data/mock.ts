export const mockActionRecords = [
  {
    customer_id: 'CUS-0002',
    name: 'Trần Thị Phương',
    group: 'treatment',
    tier: 'True_Friends_Standard',
    ltv: 32570000,
    churn_risk_score: 0.605,
    monthly_fee: 480000,
    sentiment: 'frustrated',
    pain_points: 'Ứng dụng bị văng liên tục; Giao diện khó dùng',
    action_type: 'vip_training',
    discount_pct: 0,
    free_months: 1,
    reasoning: 'Khách hàng High LTV. Tặng 1 tháng miễn phí và hỗ trợ chuyên sâu White-Glove để bảo vệ dòng tiền lâu dài.',
    channel: 'phone_call',
    message_sent: 'Chào chị Phương, chúng em rất tiếc khi biết ứng dụng gặp tình trạng bị văng khiến chị khó chịu. Để chị có trải nghiệm tốt nhất, công ty xin tặng chị 1 tháng sử dụng miễn phí và hỗ trợ đào tạo VIP để khám phá trọn vẹn các tính năng nhé.',
    agent_source: 'llm'
  },
  {
    customer_id: 'CUS-0006',
    name: 'Nguyễn Bảo Mai',
    group: 'treatment',
    tier: 'True_Friends_Standard',
    ltv: 16085000,
    churn_risk_score: 0.870,
    monthly_fee: 176000,
    sentiment: 'price_sensitive',
    pain_points: 'So sánh giá đối thủ; Giá gói cước cao',
    action_type: 'discount',
    discount_pct: 25,
    free_months: 0,
    reasoning: 'Giảm giá tối đa 25% theo trần Guardrail để giữ chân khách hàng lâu năm, tối ưu tỷ lệ CRC so với việc mất trắng LTV.',
    channel: 'phone_call',
    message_sent: 'Chào bạn Bảo Mai, mình biết bạn đang cân nhắc về mức phí dịch vụ so với các lựa chọn khác. Để cảm ơn sự đồng hành của bạn suốt thời gian qua, công ty xin gửi tặng ưu đãi giảm 25% cho lần gia hạn tiếp theo.',
    agent_source: 'llm'
  },
  {
    customer_id: 'CUS-0015',
    name: 'Hoàng Minh Khôi',
    group: 'treatment',
    tier: 'Butterflies_Standard',
    ltv: 16157000,
    churn_risk_score: 0.836,
    monthly_fee: 378000,
    sentiment: 'frustrated',
    pain_points: 'Khó sử dụng tính năng mới; Đang tham khảo đối thủ',
    action_type: 'loyalty_upgrade',
    discount_pct: 15,
    free_months: 0,
    reasoning: 'Commercial Play: Khóa dòng tiền trả trước 1 năm với ưu đãi 15% để ngăn chặn rủi ro chuyển dịch sang đối thủ.',
    channel: 'email',
    message_sent: 'Chào anh Minh Khôi, rất tiếc vì sự bất tiện khi sử dụng tính năng mới. Chúng em muốn gửi đến anh ưu đãi đặc biệt: giảm 15% khi chuyển sang gói thường niên để tối ưu chi phí và nhận hỗ trợ kỹ thuật ưu tiên.',
    agent_source: 'mock'
  },
  {
    customer_id: 'CUS-0004',
    name: 'Nguyễn Ngọc Vy',
    group: 'treatment',
    tier: 'Barnacles_Standard',
    ltv: 11258000,
    churn_risk_score: 0.822,
    monthly_fee: 131000,
    sentiment: 'frustrated',
    pain_points: 'Tốc độ mạng chậm; Cước phát sinh không rõ ràng',
    action_type: 'pause_subscription',
    discount_pct: 0,
    free_months: 0,
    reasoning: 'Nhóm Low LTV. Đề xuất Pause để giữ hồ sơ trong CRM với chi phí 0đ, tránh hao phí ngân sách CSKH.',
    channel: 'email',
    message_sent: 'Chào bạn Ngọc Vy, để hỗ trợ bạn tốt nhất trong giai đoạn này, chúng tôi có thể kích hoạt tính năng tạm dừng gói dịch vụ để bảo lưu thông tin và tránh phát sinh phí.',
    agent_source: 'mock'
  },
  {
    customer_id: 'CUS-0001',
    name: 'Nguyễn Bảo Hương',
    group: 'treatment',
    tier: 'Strangers',
    ltv: 3857000,
    churn_risk_score: 0.850,
    monthly_fee: 318000,
    sentiment: 'frustrated',
    pain_points: 'Ứng dụng văng; Giao diện khó hiểu; Mạng chậm',
    action_type: 'feature_newsletter',
    discount_pct: 0,
    free_months: 0,
    reasoning: 'Zero-cost save: Gửi bản tin tự động hướng dẫn tính năng mới với chi phí 0đ.',
    channel: 'email',
    message_sent: 'Chào bạn Bảo Hương, đội ngũ kỹ thuật đang cập nhật phiên bản mới với giao diện tối ưu hơn. Mời bạn tham khảo bản tin hướng dẫn mẹo sử dụng để có trải nghiệm mượt mà nhất nhé.',
    agent_source: 'mock'
  }
];

export const mockQuadrantDist = [
  { name: 'True Friends Elite', count: 48, value: 1450000000, fill: '#0d9488', desc: 'Top 5% LTV, Highly Loyal' },
  { name: 'True Friends Standard', count: 185, value: 2850000000, fill: '#14b8a6', desc: 'High LTV, High Loyalty' },
  { name: 'Butterflies Whales', count: 62, value: 980000000, fill: '#06b6d4', desc: 'Top LTV, High Flight Risk' },
  { name: 'Butterflies Standard', count: 210, value: 1650000000, fill: '#38bdf8', desc: 'Med LTV, Low Loyalty' },
  { name: 'Barnacles Heavy', count: 95, value: 450000000, fill: '#94a3b8', desc: 'Low LTV, High Cost to Serve' },
  { name: 'Barnacles Standard', count: 320, value: 890000000, fill: '#cbd5e1', desc: 'Low LTV, High Loyalty' },
  { name: 'Strangers', count: 420, value: 680000000, fill: '#e2e8f0', desc: 'Low LTV, Low Loyalty' }
];

export const mockPainPointsData = [
  { pain_point: 'Mạng chậm / Giật lag', count: 342, category: 'Technical' },
  { pain_point: 'Cước phí không rõ ràng', count: 280, category: 'Billing' },
  { pain_point: 'So sánh giá đối thủ', count: 215, category: 'Competitor' },
  { pain_point: 'Ứng dụng bị văng', count: 185, category: 'Technical' },
  { pain_point: 'Khó sử dụng tính năng mới', count: 140, category: 'Usability' },
  { pain_point: 'Không hoạt động (>2 tuần)', count: 110, category: 'Inactivity' }
];

export const mockActionEffectiveness = [
  { action: 'VIP Training / White Glove', savedRate: 78, cost: 20000, avgLTV: 28000000 },
  { action: 'Discount Voucher (15-25%)', savedRate: 65, cost: 85000, avgLTV: 18500000 },
  { action: 'Loyalty Upgrade (Annual)', savedRate: 58, cost: 120000, avgLTV: 16000000 },
  { action: 'Pause Subscription', savedRate: 42, cost: 0, avgLTV: 9500000 },
  { action: 'Feature Newsletter', savedRate: 24, cost: 0, avgLTV: 4200000 }
];

export const mockUpliftData = [
  { name: 'Holdout (No Action)', churnRate: 64.5, fill: '#f43f5e' },
  { name: 'Treatment (Multi-Agent AI)', churnRate: 28.2, fill: '#0d9488' }
];
