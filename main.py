import argparse
import sys
import shutil
from pathlib import Path
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(str(Path(__file__).resolve().parent))

from config import (
    CUSTOMERS_CSV,
    TELCO_DATASET_PATH,
    ACTIONS_LOG_CSV,
    OUTCOMES_CSV,
    USE_MOCK,
    OPENROUTER_API_KEY,
    RETRIEVER_MODEL,
    NEGOTIATOR_MODEL,
    EXECUTION_MODEL,
)
from phase1_model import run_phase1
from data_gen.generate_customers import generate_customers
from data_gen.generate_logs import generate_logs
from orchestrator import run_all
from simulate_outcomes import simulate
from evaluate_roi import evaluate, print_report

def main():
    parser = argparse.ArgumentParser(description="Run Phase 2 - Multi-Agent Retention Workflow")
    parser.add_argument("--source", type=str, choices=["telco_xlsx", "synthetic"], default="telco_xlsx", help="Data source: 'telco_xlsx' (real Telco ML) or 'synthetic'")
    parser.add_argument("--run-phase1", action="store_true", help="Force train Phase 1 ML model and re-generate cohort")
    parser.add_argument("--n-customers", type=int, default=200, help="Number of customers in retention cohort")
    parser.add_argument("--filter-voluntary", action="store_true", help="Filter for voluntary churn cases only")
    parser.add_argument("--holdout", type=float, default=None, help="Holdout ratio (e.g. 0.10)")
    parser.add_argument("--skip-data-gen", action="store_true", help="Skip data gen if customer CSV already exists")
    parser.add_argument("--input-csv", type=str, default=None, help="Custom input CSV path")
    args = parser.parse_args()

    if not USE_MOCK:
        provider = "OpenRouter" if OPENROUTER_API_KEY else "OpenAI"
        mode = f"LIVE ({provider})\n  - Retriever Model:  {RETRIEVER_MODEL}\n  - Negotiator Model: {NEGOTIATOR_MODEL}\n  - Execution Model:  {EXECUTION_MODEL}"
    else:
        mode = "MOCK (rule-based with Business Guardrails)"
    print(f"\n>>> Running mode: {mode}\n")

    # Step 1: Data Preparation / Phase 1 ML
    if args.input_csv:
        input_path = Path(args.input_csv)
        if not input_path.exists():
            print(f"[ERROR] File not found {input_path}")
            sys.exit(1)
        print(f"[1/4] Using custom input from {input_path}...")
        shutil.copy(input_path, CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)
        
        if "tier" not in customers_df.columns:
            from config import assign_advanced_segment
            customers_df['ltv_pct'] = customers_df['ltv'].rank(pct=True)
            customers_df['tenure_pct'] = customers_df['tenure_months'].rank(pct=True) if "tenure_months" in customers_df.columns else 0.5
            customers_df["tier"] = customers_df.apply(lambda row: assign_advanced_segment(
                row["ltv_pct"], row["tenure_pct"], row.get("is_tribe_leader", False), row.get("is_enterprise_wallet", False)
            ), axis=1)
            customers_df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")
        
        print("[1/4] Generating contextual interaction logs...")
        generate_logs(customers_df)

    elif args.run_phase1 or (args.source == "telco_xlsx" and TELCO_DATASET_PATH.exists() and (not args.skip_data_gen or not CUSTOMERS_CSV.exists())):
        print(f"[1/4] Executing Phase 1 ML Model on {TELCO_DATASET_PATH.name}...")
        customers_df, metrics = run_phase1(
            n_customers=args.n_customers,
            filter_voluntary_only=args.filter_voluntary,
            output_path=CUSTOMERS_CSV
        )
        print("[1/4] Generating contextual interaction logs from real churn reasons...")
        generate_logs(customers_df)

    elif not args.skip_data_gen or not CUSTOMERS_CSV.exists():
        print(f"[1/4] Generating synthetic customer data (N={args.n_customers})...")
        customers_df = generate_customers(n=args.n_customers)
        customers_df.to_csv(CUSTOMERS_CSV, index=False, encoding="utf-8-sig")
        print("[1/4] Generating interaction logs...")
        generate_logs(customers_df)
    else:
        print("[1/4] Skipping data gen, using existing cohort:", CUSTOMERS_CSV)
        customers_df = pd.read_csv(CUSTOMERS_CSV)

    # Step 2: Multi-Agent pipeline
    print(f"\n[2/4] Running Multi-Agent Action Layer on {len(customers_df)} accounts...")
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
    print("\n[4/4] Evaluating ROI & Net Revenue Retained (NRR)...\n")
    metrics = evaluate(outcomes_df)
    print_report(metrics)

if __name__ == "__main__":
    main()
