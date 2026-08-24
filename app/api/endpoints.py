import os
import sys
import json
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from typing import Optional
import pandas as pd
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from config import (
    ACTIONS_LOG_CSV,
    OUTCOMES_CSV,
    CUSTOMERS_CSV,
    GUARDRAILS,
    ACTION_COST_ESTIMATE,
    RETRIEVER_MODEL,
    NEGOTIATOR_MODEL,
    EXECUTION_MODEL,
    USE_MOCK,
    OPENROUTER_API_KEY
)
from evaluate_roi import evaluate

router = APIRouter()

def _safe_read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    try:
        return pd.read_csv(path)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return pd.DataFrame()

@router.get("/stats")
def get_stats():
    actions_df = _safe_read_csv(ACTIONS_LOG_CSV)
    outcomes_df = _safe_read_csv(OUTCOMES_CSV)
    
    total_customers = len(actions_df)
    treatment_df = actions_df[actions_df["group"] == "treatment"] if not actions_df.empty and "group" in actions_df.columns else actions_df
    holdout_df = actions_df[actions_df["group"] == "holdout"] if not actions_df.empty and "group" in actions_df.columns else pd.DataFrame()
    
    roi_metrics = {}
    if not outcomes_df.empty and "group" in outcomes_df.columns and "churned" in outcomes_df.columns:
        try:
            roi_metrics = evaluate(outcomes_df)
        except Exception as e:
            print(f"ROI eval error: {e}")
            
    total_ltv_at_risk = float(actions_df["ltv"].sum()) if not actions_df.empty and "ltv" in actions_df.columns else 0.0
    avg_ltv = float(actions_df["ltv"].mean()) if not actions_df.empty and "ltv" in actions_df.columns else 0.0
    avg_risk = float(actions_df["churn_risk_score"].mean()) if not actions_df.empty and "churn_risk_score" in actions_df.columns else 0.0
    
    return {
        "total_customers": total_customers,
        "treatment_count": len(treatment_df),
        "holdout_count": len(holdout_df),
        "total_ltv_at_risk_vnd": total_ltv_at_risk,
        "avg_ltv_vnd": avg_ltv,
        "avg_churn_risk": avg_risk,
        "roi_metrics": roi_metrics,
        "provider": "OpenRouter" if OPENROUTER_API_KEY else ("OpenAI" if not USE_MOCK else "Mock Engine"),
        "models": {
            "retriever": RETRIEVER_MODEL,
            "negotiator": NEGOTIATOR_MODEL,
            "execution": EXECUTION_MODEL
        }
    }

@router.get("/actions")
def get_actions(
    tier: Optional[str] = None,
    action_type: Optional[str] = None,
    channel: Optional[str] = None,
    limit: int = 200
):
    df = _safe_read_csv(ACTIONS_LOG_CSV)
    if df.empty:
        return {"total": 0, "actions": []}
        
    if tier and tier != "all":
        df = df[df["tier"].str.lower() == tier.lower()]
    if action_type and action_type != "all":
        df = df[df["action_type"].str.lower() == action_type.lower()]
    if channel and channel != "all":
        df = df[df["channel"].str.lower() == channel.lower()]
        
    records = df.head(limit).fillna("").to_dict(orient="records")
    return {"total": len(df), "actions": records}

@router.get("/analytics")
def get_analytics():
    actions_df = _safe_read_csv(ACTIONS_LOG_CSV)
    outcomes_df = _safe_read_csv(OUTCOMES_CSV)
    
    if actions_df.empty:
        return {"quadrants": [], "pain_points": [], "actions_dist": [], "sentiment_dist": []}
        
    # 1. Quadrants / Tier distribution
    tier_counts = actions_df["tier"].value_counts().to_dict()
    tier_ltv = actions_df.groupby("tier")["ltv"].sum().to_dict()
    quadrants = [
        {"name": k, "count": int(v), "total_ltv": float(tier_ltv.get(k, 0))}
        for k, v in tier_counts.items()
    ]
    
    # 2. Action distribution
    action_counts = actions_df["action_type"].value_counts().to_dict()
    actions_dist = [{"action": k, "count": int(v)} for k, v in action_counts.items()]
    
    # 3. Sentiment distribution
    sentiment_counts = actions_df[actions_df["sentiment"] != "n/a"]["sentiment"].value_counts().to_dict() if "sentiment" in actions_df.columns else {}
    sentiment_dist = [{"sentiment": k, "count": int(v)} for k, v in sentiment_counts.items()]
    
    # 4. Pain points frequency
    pain_points_list = []
    if "pain_points" in actions_df.columns:
        for pts in actions_df["pain_points"].dropna():
            if str(pts).strip():
                for p in str(pts).split(";"):
                    cleaned = p.strip()
                    if cleaned and len(cleaned) > 2:
                        pain_points_list.append(cleaned)
    pain_series = pd.Series(pain_points_list).value_counts().head(10).to_dict()
    pain_points_dist = [{"pain_point": k, "count": int(v)} for k, v in pain_series.items()]
    
    # 5. Holdout vs Treatment Churn comparison
    holdout_churn_rate = 0.0
    treatment_churn_rate = 0.0
    if not outcomes_df.empty and "group" in outcomes_df.columns and "churned" in outcomes_df.columns:
        h = outcomes_df[outcomes_df["group"] == "holdout"]
        t = outcomes_df[outcomes_df["group"] == "treatment"]
        holdout_churn_rate = float(h["churned"].mean()) if not h.empty else 0.0
        treatment_churn_rate = float(t["churned"].mean()) if not t.empty else 0.0
        
    return {
        "quadrants": quadrants,
        "actions_dist": actions_dist,
        "sentiment_dist": sentiment_dist,
        "pain_points": pain_points_dist,
        "uplift_comparison": {
            "holdout_churn_rate": holdout_churn_rate,
            "treatment_churn_rate": treatment_churn_rate,
            "uplift": holdout_churn_rate - treatment_churn_rate
        }
    }

@router.get("/agent-graph")
def get_agent_graph():
    return {
        "pipeline_name": "Autonomous Churn Retention Action Layer",
        "nodes": [
            {
                "id": "phase1_input",
                "name": "Phase 1 ML Risk Predictor",
                "type": "input",
                "role": "Outputs Churn Probability (0.55-0.98), LTV, Contract & Tenure",
                "model": "XGBoost / LightGBM",
                "status": "active"
            },
            {
                "id": "agent_retriever",
                "name": "1. Data Retriever Agent",
                "type": "agent",
                "role": "Scans interaction logs, detects pain points & customer sentiment",
                "model": RETRIEVER_MODEL,
                "status": "online"
            },
            {
                "id": "agent_negotiator",
                "name": "2. Strategic Negotiator Agent",
                "type": "agent",
                "role": "Executes CAC vs CRC arbitrage, determines retention offer within Guardrails",
                "model": NEGOTIATOR_MODEL,
                "status": "online"
            },
            {
                "id": "guardrail_layer",
                "name": "Budget & Policy Guardrail",
                "type": "guardrail",
                "role": "Hard constraint enforcement (max discount %, allowed actions per tier)",
                "model": "Deterministic Rule-Engine",
                "status": "enforced"
            },
            {
                "id": "agent_execution",
                "name": "3. Execution Agent",
                "type": "agent",
                "role": "Synthesizes empathetic, personalized Vietnamese copy & dispatches message",
                "model": EXECUTION_MODEL,
                "status": "online"
            },
            {
                "id": "dispatch_channels",
                "name": "Omnichannel Dispatch",
                "type": "output",
                "role": "Email (SendGrid) / Zalo OA / Phone Call CRM / In-App",
                "model": "SendGrid + Zalo API",
                "status": "ready"
            }
        ],
        "edges": [
            {"from": "phase1_input", "to": "agent_retriever", "label": "Customer ID & Risk"},
            {"from": "agent_retriever", "to": "agent_negotiator", "label": "Extracted Pain Points & Sentiment"},
            {"from": "agent_negotiator", "to": "guardrail_layer", "label": "Proposed Action & Discount"},
            {"from": "guardrail_layer", "to": "agent_execution", "label": "Budget-Approved Retention Plan"},
            {"from": "agent_execution", "to": "dispatch_channels", "label": "Generated Personalized Message"}
        ],
        "guardrails": GUARDRAILS
    }

@router.get("/policies")
def get_policies():
    return {
        "guardrails": GUARDRAILS,
        "action_costs": {
            "discount": "monthly_fee * (discount_pct / 100)",
            "vip_training": "20,000 VND flat",
            "loyalty_upgrade": "monthly_fee * 12 * (discount_pct / 100)",
            "feature_newsletter": "0 VND (Zero-cost)",
            "pause_subscription": "0 VND (Zero-cost)",
            "email_only": "500 VND (SendGrid cost)",
            "no_action": "0 VND"
        }
    }
