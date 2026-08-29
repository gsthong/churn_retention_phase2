# Phase 1 & Phase 2 — Churn Prediction & Multi-Agent Retention Workflow

Hệ thống hoàn chỉnh kết hợp **Phase 1 (Machine Learning Churn Prediction & Churn Reason Categorization)** và **Phase 2 (Multi-Agent Retention Action Layer)** trên bộ dữ liệu thực tế **IBM Telco Customer Churn (7,043 khách hàng)**.

---

## 📂 Cấu trúc thư mục

```
churn_retention_phase2/
├── config.py                    # Cấu hình dataset, phân loại lý do churn, guardrail, model routing
├── phase1_model.py              # Phase 1: Train Random Forest trên Telco dataset, phân loại lý do rời bỏ & xuất cohort
├── prepare_real_data.py         # Script chuẩn bị dữ liệu thực tế cho pipeline
├── main.py                      # Entry point — chạy toàn bộ pipeline Phase 1 & Phase 2
├── orchestrator.py              # Chia holdout/treatment + điều phối 3 AI Agent
├── simulate_outcomes.py         # Mô phỏng kết quả sau 1 tháng (CHỈ DÙNG CHO DEMO)
├── evaluate_roi.py              # Tính ROI & NRR: so sánh holdout vs treatment
├── notebooks/                   # Jupyter Notebooks nghiên cứu & huấn luyện Phase 1
│   ├── AISC_Customer_Churn_Data_Final.ipynb  # Phân loại lý do Churn (Voluntary / Involuntary)
│   └── Lab_Build_Model.ipynb                 # Thử nghiệm mô hình Random Forest
├── data_gen/
│   ├── generate_customers.py    # Sinh dữ liệu khách hàng tổng hợp (nếu không dùng dataset thật)
│   └── generate_logs.py         # Sinh log tương tác theo 20 lý do Churn thực tế từ dataset
├── agents/
│   ├── llm_client.py            # Client gọi Groq/OpenRouter/OpenAI API + rule-based fallback
│   ├── data_retriever_agent.py  # Agent 1: Đọc log, trích xuất pain points & sentiment
│   ├── negotiator_agent.py      # Agent 2: Chiến lược CAC/CRC & ép guardrail ngân sách
│   ├── execution_agent.py       # Agent 3: Soạn & gửi tin nhắn cá nhân hóa tiếng Việt
│   └── privacy_guard.py         # Bảo vệ PII (Nghị định 13/2023 & GDPR)
├── data/
│   ├── Telco_customer_churn.xlsx # Dữ liệu gốc 7,043 khách hàng IBM Telco
│   ├── at_risk_customers.csv     # Cohort nguy cơ cao do Phase 1 xuất ra
│   └── logs/                     # Log tương tác của từng khách hàng
├── app/                         # Backend FastAPI API
│   ├── server.py                # Server entrypoint
│   └── api/endpoints.py         # Endpoints: Stats, Analytics, HITL, Phase 1 Summary
├── frontend/                    # Giao diện React + Vite + Tailwind Dashboard
└── outputs/                     # actions_log.csv, outcomes.csv, messages/
```

---

## 🎯 Phân loại lý do rời mạng (Phase 1 Ground Truth)

Theo nghiên cứu từ notebook Phase 1, các lý do rời mạng được phân loại thành:
1. **Voluntary Churn (15 lý do - Đối tượng giữ chân chính)**:
   - Giá cước, khuyến mãi đối thủ (*Competitor made better offer*, *Price too high*, *Extra data charges*).
   - Tốc độ & thiết bị (*Competitor offered higher download speeds*, *Competitor had better devices*).
   - Chất lượng hỗ trợ & dịch vụ (*Attitude of support person*, *Poor expertise of phone support*, *Service dissatisfaction*).
2. **Involuntary Churn (4 lý do - Cơ chế bảo toàn ngân sách)**:
   - Di dời/Chuyển nhà (*Moved*), qua đời (*Deceased*), ngoài vùng phủ (*Limited range of services*), sự cố hạ tầng (*Network reliability*).
   - **Chiến lược Agent**: Không lãng phí ngân sách ưu đãi/discount vào nhóm bất khả kháng, kích hoạt tính năng **Pause Subscription / Bảo lưu**.
3. **Vague Churn**:
   - Không rõ nguyên nhân (*Don't know*) -> Nudge tính năng tự động.

---

## 🚀 Hướng dẫn chạy

### 1. Cài đặt môi trường
```bash
pip install -r requirements.txt
pip install openpyxl
```

### 2. Chạy toàn bộ Pipeline (Phase 1 ML + Phase 2 Multi-Agent)

```bash
# Chạy với dữ liệu thật Telco_customer_churn.xlsx (200 khách hàng nguy cơ cao)
python main.py --source telco_xlsx --n-customers 200

# Chạy và ép huấn luyện lại mô hình Phase 1 ML
python main.py --run-phase1 --n-customers 200

# Chỉ tập trung vào nhóm Voluntary Churn (khách hàng có thể giữ chân được)
python main.py --source telco_xlsx --filter-voluntary --n-customers 200
```

### 3. Chạy từng module độc lập
```bash
# Bước 1: Huấn luyện mô hình Phase 1 & xuất cohort
python phase1_model.py --n-customers 200

# Bước 2: Sinh log tương tác theo lý do churn
python -m data_gen.generate_logs

# Bước 3: Chạy 3 AI Agent (Retriever -> Negotiator -> Execution)
python orchestrator.py

# Bước 4: Mô phỏng kết quả sau 1 tháng
python simulate_outcomes.py

# Bước 5: Tính toán ROI & NRR
python evaluate_roi.py
```

### 4. Khởi động Web Dashboard (FastAPI + React)
```bash
# Terminal 1: Backend FastAPI
python app/server.py

# Terminal 2: Frontend Vite
cd frontend
npm run dev
```

---

## 🛡️ Kiến trúc Guardrail & Governance
- `Negotiator Agent` đề xuất giải pháp nhưng luôn bị ép tuân thủ `_enforce_guardrail()` theo từng phân khúc kinh doanh (`True_Friends_Elite`, `Butterflies_Whales`, `Barnacles_Whale`, `Strangers`).
- Tỷ lệ tự động hóa: **80% Autonomous (AI) : 20% Human Oversight (HITL Specialist Review)**.
