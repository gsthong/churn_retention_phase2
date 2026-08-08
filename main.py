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
    parser = argparse.ArgumentParser(description="Run Phase 2 - Multi-Agent Retention Workflow")
    parser.add_argument("--n-customers", type=int, default=200, help="Number of simulated customers")
    parser.add_argument("--holdout", type=float, default=None, help="Holdout ratio")
    parser.add_argument("--skip-data-gen", action="store_true", help="Skip data gen if already exists")
    parser.add_argument("--input-csv", type=str, default=None, help="Input CSV path")
    args = parser.parse_args()

    mode = "LIVE (OpenAI API)" if not USE_MOCK else "MOCK (rule-based)"
    print(f"\n>>> Running mode: {mode}\n")

    # Step 1: Data generation
    if args.input_csv:
        input_path = Path(args.input_csv)
        if not input_path.exists():
            print(f"[ERROR] File not found {input_path}")
            sys.exit(1)
        print(f"[1/4] Using input from {input_path}...")
        shutil.copy(input_path, CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)
        
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
        
        print("[1/4] Generating simulated interaction logs...")
        generate_logs(customers_df)
    elif not args.skip_data_gen or not CUSTOMERS_CSV.exists():
        print("[1/4] Generating customer data...")
        customers_df = generate_customers(n=args.n_customers)
        customers_df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")

        print("[1/4] Generating interaction logs...")
        generate_logs(customers_df)
    else:
        print("[1/4] Skipping data gen, using existing:", CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)

    # Step 2: Multi-Agent pipeline
    print("\n[2/4] Running Agent pipeline...")
    if args.holdout is not None:
        from orchestrator import split_holdout
        customers_df = split_holdout(customers_df, holdout_ratio=args.holdout)
        actions_df = run_all(customers_df.drop(columns=["group"]))
    else:
        actions_df = run_all(customers_df)

    print(f"    -> Saved {len(actions_df)} action logs to {ACTIONS_LOG_CSV}")

    # Step 3: Simulation
    print("\n[3/4] Simulating 1-month outcomes...")
    outcomes_df = simulate(actions_df)
    outcomes_df.to_csv(OUTCOMES_CSV, index=False, encoding="utf-8-sig")

    # Step 4: Evaluate ROI
    print("\n[4/4] Evaluating ROI...\n")
    metrics = evaluate(outcomes_df)
    print_report(metrics)

if __name__ == "__main__":
    main()
