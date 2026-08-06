"""
main.py
--------
Entry point chạy toàn bộ Phase 2: Multi-Agent Retention Workflow.

Cách chạy:
    python main.py                  # chạy full pipeline: sinh data -> chạy agent -> mô phỏng kết quả -> tính ROI
    python main.py --n-customers 500 --holdout 0.15

Nếu đã export ANTHROPIC_API_KEY, hệ thống sẽ gọi Claude thật cho cả 3 agent.
Nếu không, hệ thống tự động chạy MOCK MODE (rule-based) để demo vẫn chạy được.
"""

import argparse
import sys
import shutil
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent))

from config import CUSTOMERS_CSV, ACTIONS_LOG_CSV, OUTCOMES_CSV, USE_MOCK
from data_gen.generate_customers import generate_customers
from data_gen.generate_logs import generate_logs
from orchestrator import run_all
from simulate_outcomes import simulate
from evaluate_roi import evaluate, print_report


def main():
    parser = argparse.ArgumentParser(description="Chạy Phase 2 - Multi-Agent Retention Workflow")
    parser.add_argument("--n-customers", type=int, default=200, help="Số khách hàng nguy cơ cao giả lập")
    parser.add_argument("--holdout", type=float, default=None, help="Tỉ lệ holdout (mặc định lấy trong config.py)")
    parser.add_argument("--skip-data-gen", action="store_true", help="Bỏ qua bước sinh data nếu đã có sẵn")
    parser.add_argument("--input-csv", type=str, default=None, help="Đường dẫn đến file CSV (output từ Phase 1) thay vì tự sinh")
    args = parser.parse_args()

    mode_label = "LIVE (gọi Anthropic API)" if not USE_MOCK else "MOCK (rule-based, không tốn phí/API key)"
    print(f"\n>>> Chế độ chạy: {mode_label}\n")

    # ---- Bước 1: Sinh dữ liệu (Phase 1 output giả lập + log tương tác Phase 2) ----
    if args.input_csv:
        input_path = Path(args.input_csv)
        if not input_path.exists():
            print(f"[LỖI] Không tìm thấy file {input_path}")
            sys.exit(1)
        print(f"[1/4] Dùng dữ liệu đầu vào từ {input_path}...")
        shutil.copy(input_path, CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)
        
        # Đảm bảo có cột tier (phân loại khách hàng) để giới hạn ngân sách
        if "tier" not in customers_df.columns:
            from config import TIER_PERCENTILES
            vip_cut = customers_df["ltv"].quantile(TIER_PERCENTILES["VIP"])
            std_cut = customers_df["ltv"].quantile(TIER_PERCENTILES["Standard"])
            def _tier(ltv: float) -> str:
                if ltv >= vip_cut: return "VIP"
                if ltv >= std_cut: return "Standard"
                return "Basic"
            customers_df["tier"] = customers_df["ltv"].apply(_tier)
            customers_df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")
        
        print("[1/4] Sinh log tương tác / support ticket giả lập cho tập khách hàng mới...")
        generate_logs(customers_df)
    elif not args.skip_data_gen or not CUSTOMERS_CSV.exists():
        print("[1/4] Sinh dữ liệu khách hàng nguy cơ cao...")
        customers_df = generate_customers(n=args.n_customers)
        customers_df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")

        print("[1/4] Sinh log tương tác / support ticket giả lập...")
        generate_logs(customers_df)
    else:
        print("[1/4] Bỏ qua sinh data, dùng file có sẵn:", CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)

    # ---- Bước 2: Chạy Multi-Agent pipeline (holdout split + 3 agent) ----
    print("\n[2/4] Chạy Multi-Agent Retention pipeline (Data Retriever -> Negotiator -> Execution)...")
    if args.holdout is not None:
        from orchestrator import split_holdout
        customers_df = split_holdout(customers_df, holdout_ratio=args.holdout)
        # ghi đè để orchestrator.run_all dùng lại đúng group đã chia
        actions_df = run_all(customers_df.drop(columns=["group"]))
    else:
        actions_df = run_all(customers_df)

    print(f"    -> Đã ghi {len(actions_df)} bản ghi hành động vào {ACTIONS_LOG_CSV}")

    # ---- Bước 3: Mô phỏng kết quả sau 1 tháng (chỉ để demo) ----
    print("\n[3/4] Mô phỏng kết quả sau 1 tháng (CHỈ DÙNG CHO DEMO)...")
    outcomes_df = simulate(actions_df)
    outcomes_df.to_csv(OUTCOMES_CSV, index=False, encoding="utf-8-sig")

    # ---- Bước 4: Tính ROI ----
    print("\n[4/4] Tính toán ROI dựa trên so sánh Holdout vs Treatment...\n")
    metrics = evaluate(outcomes_df)
    print_report(metrics)

    print(f"\nChi tiết: {ACTIONS_LOG_CSV}")
    print(f"Tin nhắn đã 'gửi' cho từng khách: outputs/messages/<customer_id>.txt")


if __name__ == "__main__":
    main()
