import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from phase1_model import run_phase1

def get_data(limit=None, filter_voluntary=False):
    n = limit if limit else 200
    print(f"Preparing Phase 1 Real Data (N={n}, filter_voluntary={filter_voluntary})...")
    df, metrics = run_phase1(n_customers=n, filter_voluntary_only=filter_voluntary)
    print(f"Done. Successfully generated {len(df)} customer records with ML Churn Risk Scores.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare real Telco churn data from Phase 1 ML pipeline")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows")
    parser.add_argument("--all", action="store_true", help="Download/generate full churn cohort")
    parser.add_argument("--filter-voluntary", action="store_true", help="Filter for voluntary churn only")
    args = parser.parse_args()
    
    lim = 500 if args.all else (args.limit or 200)
    get_data(lim, filter_voluntary=args.filter_voluntary)
