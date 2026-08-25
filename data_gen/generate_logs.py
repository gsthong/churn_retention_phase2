"""
generate_logs.py
-----------------
Sinh dữ liệu "làm màu" (synthetic) cho Phase 2: log tương tác / ticket hỗ trợ
của từng khách hàng nguy cơ cao. Đây chính là dữ liệu mà Data Retriever Agent
sẽ "đào bới" để tìm hiểu khách đang gặp vấn đề gì trước khi Negotiator Agent
ra quyết định.

Mỗi khách hàng được gán ngẫu nhiên 1-3 sự kiện, mỗi sự kiện thuộc 1 trong các
category (dùng để mock fallback khi không có LLM), và có nội dung text tự nhiên
(dùng để LLM đọc hiểu khi có API key).

Chạy: python -m data_gen.generate_logs
"""

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import CUSTOMERS_CSV, LOG_DIR, DATA_DIR, RANDOM_SEED

# category -> (nhãn ngắn dùng cho rule-based fallback, list mẫu câu)
LOG_TEMPLATES = {
    "technical_issue": [
        "Mạng dạo này lag quá, tao load phim không nổi.",
        "Ứng dụng cứ bị văng ra giữa chừng, phiền thật sự.",
        "Kết nối chập chờn suốt 3 ngày nay, gọi tổng đài không ai nghe máy.",
        "Sao dạo này tốc độ chậm hẳn so với tháng trước vậy?",
    ],
    "billing_complaint": [
        "Sao tháng này tự nhiên bị trừ tiền nhiều hơn mọi khi vậy?",
        "Phí phát sinh gì mà không thấy thông báo trước, thấy hơi khó chịu.",
        "Mình đâu có dùng thêm gói gì mà hóa đơn tăng vọt thế này.",
        "Cho hỏi khoản phụ phí này là phí gì, không rõ ràng chút nào.",
    ],
    "competitor_mention": [
        "Bên đối thủ đang có gói rẻ hơn nhiều mà chất lượng nghe nói cũng ổn.",
        "Thấy quảng cáo bên kia khuyến mãi khủng quá, đang phân vân chuyển qua.",
        "Bạn mình chuyển sang nhà mạng khác rồi, bảo giá rẻ hơn hẳn.",
    ],
    "feature_confusion": [
        "Không biết cách bật tính năng mới này thế nào, hướng dẫn rối quá.",
        "Tính năng mới ra mà không thấy hướng dẫn sử dụng rõ ràng, hơi khó dùng.",
        "Mò mãi không ra chỗ đổi gói cước trong app, giao diện khó hiểu.",
    ],
    "silence": [
        "Không có hoạt động đăng nhập nào trong 21 ngày gần nhất.",
        "Tài khoản không phát sinh sử dụng dữ liệu trong 18 ngày qua.",
        "Không mở app kể từ lần cuối cách đây hơn 2 tuần.",
    ],
    "price_sensitive_but_positive": [
        "Dịch vụ dùng cũng ổn đó, nhưng giá hơi cao so với thu nhập hiện tại.",
        "Nhìn chung hài lòng, chỉ là dạo này chi tiêu eo hẹp nên đang cân nhắc cắt giảm.",
    ],
}

CATEGORY_WEIGHTS = {
    "technical_issue": 0.25,
    "billing_complaint": 0.2,
    "competitor_mention": 0.15,
    "feature_confusion": 0.15,
    "silence": 0.15,
    "price_sensitive_but_positive": 0.10,
}


def _random_timestamp(rng: random.Random, days_back: int = 30) -> str:
    dt = datetime.now() - timedelta(days=rng.randint(0, days_back), hours=rng.randint(0, 23))
    return dt.strftime("%Y-%m-%d %H:%M")


def generate_logs(customers_df: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = random.Random(seed)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    categories = list(CATEGORY_WEIGHTS.keys())
    weights = list(CATEGORY_WEIGHTS.values())

    index_rows = []
    for _, row in customers_df.iterrows():
        cid = row["customer_id"]
        n_events = rng.randint(1, 3)
        chosen_categories = rng.choices(categories, weights=weights, k=n_events)

        lines = []
        for cat in chosen_categories:
            text = rng.choice(LOG_TEMPLATES[cat])
            ts = _random_timestamp(rng)
            lines.append(f"[{ts}] ({cat}) {text}")

        log_path = LOG_DIR / f"{cid}.txt"
        log_path.write_text("\n".join(lines), encoding="utf-8")

        index_rows.append(
            {
                "customer_id": cid,
                "log_path": str(log_path.relative_to(DATA_DIR.parent)),
                "primary_category": chosen_categories[0],
                "n_events": n_events,
            }
        )

    return pd.DataFrame(index_rows)


if __name__ == "__main__":
    customers_df = pd.read_csv(CUSTOMERS_CSV)
    index_df = generate_logs(customers_df)
    index_path = DATA_DIR / "logs_index.csv"
    index_df.to_csv(index_path, index=False, encoding="utf-8-sig")
    print(f"Đã sinh log tương tác cho {len(index_df)} khách hàng -> {LOG_DIR}/")
    print(f"Index file -> {index_path}")
