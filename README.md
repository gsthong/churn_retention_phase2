# Phase 2 — Multi-Agent Retention Action Layer

Code đầy đủ cho **Phase 2** của đề tài *Churn Prediction + Multi-Agent Retention Workflow*:
nhận đầu vào là danh sách khách hàng nguy cơ rời bỏ cao (giả lập output của Phase 1),
rồi để 3 AI Agent tự vận hành: đào dữ liệu → ra quyết định giữ chân → soạn & "gửi" tin nhắn cá nhân hóa.

## Cấu trúc thư mục

```
churn_retention_phase2/
├── config.py                    # Guardrail ngân sách, catalog hành động, model routing
├── main.py                      # Entry point — chạy toàn bộ pipeline
├── orchestrator.py              # Chia holdout/treatment + điều phối 3 agent
├── simulate_outcomes.py         # Mô phỏng kết quả sau 1 tháng (CHỈ DÙNG CHO DEMO)
├── evaluate_roi.py              # Tính ROI: so sánh holdout vs treatment
├── data_gen/
│   ├── generate_customers.py    # Sinh danh sách khách hàng nguy cơ cao (giả lập output Phase 1)
│   └── generate_logs.py         # Sinh log tương tác / support ticket giả lập (data "làm màu")
├── agents/
│   ├── llm_client.py            # Wrapper gọi Anthropic API, tự fallback sang mock nếu thiếu API key
│   ├── data_retriever_agent.py  # Đặc vụ thu thập — đọc log, trích xuất pain point
│   ├── negotiator_agent.py      # Đặc vụ đàm phán — ra quyết định, ép guardrail ngân sách
│   └── execution_agent.py       # Đặc vụ thực thi — soạn & "gửi" tin nhắn cá nhân hóa
├── data/                        # (sinh ra khi chạy) customer CSV + log thô
└── outputs/                     # (sinh ra khi chạy) actions_log.csv, outcomes.csv, tin nhắn đã gửi
```

## Cài đặt

```bash
pip install -r requirements.txt
```

## Chạy demo

### Cách 1 — Không cần API key (MOCK MODE)

Chạy được ngay, không tốn phí, không cần mạng. Mỗi agent dùng logic rule-based
(cây quyết định) thay cho LLM, vẫn tôn trọng đầy đủ guardrail ngân sách:

```bash
python main.py
```

### Cách 2 — Chạy thật với Claude (LIVE MODE)

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
python main.py
```

Khi có API key, hệ thống tự động gọi Claude thật cho cả 3 agent:
- **Data Retriever Agent** dùng `claude-haiku-4-5-20251001` (model rẻ, đủ cho tác vụ trích xuất đơn giản)
- **Negotiator Agent** & **Execution Agent** dùng `claude-sonnet-5` (tác vụ ra quyết định chiến lược
  và sinh nội dung cá nhân hóa cần model mạnh hơn)

Đây cũng là một điểm nên nhấn khi thuyết trình: **model routing để tối ưu chi phí vận hành**,
một pattern kiến trúc rất thực tế trong các hệ thống Agentic AI sản xuất.

### Tuỳ chọn CLI

```bash
python main.py --n-customers 300 --holdout 0.15
```

- `--n-customers`: số khách hàng nguy cơ cao giả lập (mặc định 200)
- `--holdout`: tỉ lệ nhóm đối chứng (mặc định lấy theo `config.HOLDOUT_RATIO` = 10%)
- `--skip-data-gen`: dùng lại dữ liệu đã sinh trước đó thay vì tạo mới

## Chạy từng bước riêng lẻ (khi cần debug / demo từng phase)

```bash
python -m data_gen.generate_customers   # sinh data/at_risk_customers.csv
python -m data_gen.generate_logs        # sinh data/logs/*.txt
python orchestrator.py                  # chạy 3 agent -> outputs/actions_log.csv
python simulate_outcomes.py             # mô phỏng churned/retained -> outputs/outcomes.csv
python evaluate_roi.py                  # in báo cáo ROI
```

## Kiến trúc Guardrail (điểm mấu chốt để bảo vệ trước ban giám khảo)

`Negotiator Agent` gọi LLM để đề xuất hành động, nhưng **đề xuất đó không bao giờ
được thực thi trực tiếp**. Hàm `_enforce_guardrail()` trong `agents/negotiator_agent.py`
luôn chạy sau cùng, ép `discount_pct` / `free_months` / `action_type` về đúng giới hạn
định nghĩa sẵn trong `config.GUARDRAILS` theo tier khách hàng — dù LLM có "sáng tạo"
đề xuất vượt khung, hệ thống vẫn không bao giờ thực thi hành động vượt ngân sách.
Script test nhanh guardrail:

```bash
python -c "
import pandas as pd
from config import GUARDRAILS
df = pd.read_csv('outputs/actions_log.csv')
violations = df[df.apply(lambda r: r['discount_pct'] > GUARDRAILS[r['tier']]['max_discount_pct'], axis=1)]
print('Số vi phạm guardrail:', len(violations))
"
```

## Lưu ý về `simulate_outcomes.py`

File này **chỉ phục vụ demo/thuyết trình** — nó tự sinh ra kết quả giả lập "khách có
rời bỏ hay không sau 1 tháng" dựa trên một hàm xác suất đơn giản, vì demo không thể
chờ dữ liệu thật một tháng. Khi triển khai thật, bước này phải được thay bằng dữ liệu
gia hạn/hủy gói thực tế của khách hàng.

Một lưu ý thú vị khi thuyết trình: với cỡ mẫu nhỏ (`--n-customers` dưới ~100), nhóm
holdout chỉ có vài chục người nên kết quả A/B test có thể nhiễu (do phương sai thống
kê), đôi khi ra kết quả ngược trực giác. Cỡ mẫu càng lớn (khuyến nghị ≥200), kết quả
càng ổn định và phản ánh đúng hiệu quả thật của hệ thống — đây chính là lý do vì sao
cỡ mẫu (statistical power) luôn là một câu hỏi quan trọng trong thiết kế A/B test,
và là một điểm bạn có thể chủ động nêu ra để "chặn đầu" câu hỏi phản biện của giám khảo.

## Ví dụ output

```
BÁO CÁO ROI - HOLDOUT vs TREATMENT
============================================================
Số khách hàng nhóm đối chứng (holdout):   20
Số khách hàng nhóm điều trị (treatment):  180
------------------------------------------------------------
Tỉ lệ rời bỏ - Holdout:    85.0%
Tỉ lệ rời bỏ - Treatment:  55.6%
Mức giảm tỉ lệ rời bỏ:     29.4% điểm phần trăm
------------------------------------------------------------
Ước tính số khách được giữ chân:  53.0 khách
LTV trung bình (treatment):        16,680,811 VND
=> Doanh thu ước tính cứu được:    884,082,989 VND
------------------------------------------------------------
Tổng chi phí ưu đãi đã bỏ ra:       6,110,900 VND
=> ROI:                            143.67x
============================================================
```

## Việc cần làm tiếp (nếu muốn phát triển thêm cho vòng sau)

- Nối `data_gen/generate_customers.py` với model Phase 1 thật (XGBoost train trên
  bộ IBM Telco Customer Churn) thay vì sinh `churn_risk_score`/`ltv` ngẫu nhiên.
- Thay `simulate_outcomes.py` bằng dữ liệu gia hạn/hủy gói thực tế khi có.
- Thêm kênh gửi thật (SendGrid cho email, Zalo OA API cho Zalo) vào `execution_agent.py`
  thay vì ghi ra file `.txt`.
- Thêm cơ chế retry/backoff cho `llm_client.py` khi gọi API thật ở quy mô lớn.
