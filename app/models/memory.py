from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.db.database import Base

class AgentActionLog(Base):
    __tablename__ = "agent_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True)
    tier = Column(String)
    ltv = Column(Float)
    churn_risk_score = Column(Float)
    sentiment = Column(String)
    pain_points = Column(Text)
    
    # Negotiator Decision
    action_type = Column(String)
    discount_pct = Column(Integer)
    free_months = Column(Integer)
    reasoning = Column(Text)
    
    # Execution
    channel = Column(String)
    message_sent = Column(Text)
    
    # Metadata
    agent_source = Column(String) # llm or mock
    created_at = Column(DateTime, default=datetime.utcnow)

