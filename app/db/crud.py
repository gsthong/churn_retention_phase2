from sqlalchemy.orm import Session
from app.models.memory import AgentActionLog

def create_action_log(db: Session, record: dict):
    db_log = AgentActionLog(
        customer_id=record["customer_id"],
        tier=record.get("tier"),
        ltv=record.get("ltv"),
        churn_risk_score=record.get("churn_risk_score"),
        sentiment=record.get("sentiment"),
        pain_points=record.get("pain_points"),
        action_type=record.get("action_type"),
        discount_pct=record.get("discount_pct"),
        free_months=record.get("free_months"),
        reasoning=record.get("reasoning"),
        channel=record.get("channel"),
        message_sent=record.get("message_sent", ""),
        agent_source=record.get("agent_source")
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
