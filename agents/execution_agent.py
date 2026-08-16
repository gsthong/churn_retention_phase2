import sys
import asyncio
from dataclasses import dataclass
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import EXECUTION_MODEL, MESSAGES_DIR, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, ZALO_OA_TOKEN
from agents.llm_client import complete
from agents.data_retriever_agent import RetrievedProfile
from agents.negotiator_agent import NegotiationDecision

SYSTEM_PROMPT = """Bạn là Execution Agent trong hệ thống giữ chân khách hàng.
Nhiệm vụ: viết một tin nhắn ngắn (email hoặc Zalo), giọng văn thân thiện, chân thành,
tiếng Việt, gửi cho khách hàng đang có nguy cơ rời bỏ dịch vụ.

Yêu cầu:
- Nhắc đúng vào vấn đề/pain point cụ thể mà khách đang gặp phải (không nói chung chung).
- Trình bày rõ ràng ưu đãi/hành động (nếu có) mà công ty dành cho khách.
- Giọng văn ấm áp, không giống spam quảng cáo, không dùng quá nhiều dấu chấm than.
- Độ dài 3-5 câu.
- CHỈ trả về nội dung tin nhắn, không thêm tiêu đề hay giải thích gì khác.
"""

ACTION_DESCRIPTION_VI = {
    "discount": "giảm giá {discount_pct}% phí gia hạn trong {free_months} tháng",
    "vip_training": "đánh giá chiến lược và tặng 3 giờ đào tạo VIP miễn phí để giải quyết triệt để vấn đề",
    "loyalty_upgrade": "ưu đãi Loyalty Upgrade: giảm 15% khi chuyển sang gói thường niên",
    "email_only": "gửi email thông báo tính năng mới",
    "feature_newsletter": "bản tin giới thiệu các tính năng mới giúp tối ưu hiệu suất làm việc",
    "no_action": "không làm gì cả",
    "pause_subscription": "chức năng Pause: tạm ngưng dịch vụ thay vì hủy để bảo lưu dữ liệu",
}


@dataclass
class ExecutionResult:
    customer_id: str
    channel: str
    message: str
    source: str


def _mock_message(customer_name: str, profile: RetrievedProfile, decision: NegotiationDecision) -> str:
    pain_point = profile.pain_points[0] if profile.pain_points else "trải nghiệm sử dụng gần đây"
    offer_template = ACTION_DESCRIPTION_VI.get(decision.action_type, "một số hỗ trợ từ đội ngũ")
    offer_text = offer_template.format(discount_pct=decision.discount_pct, free_months=decision.free_months)

    return (
        f"Chào {customer_name}, đội ngũ chăm sóc khách hàng nhận thấy bạn gần đây gặp vấn đề liên quan đến "
        f"{pain_point.lower()}. Chúng tôi thực sự xin lỗi vì trải nghiệm chưa tốt này. "
        f"Để cảm ơn bạn đã đồng hành, chúng tôi gửi tặng bạn {offer_text}. "
        f"Nếu cần hỗ trợ thêm, đừng ngần ngại phản hồi lại tin nhắn này nhé."
    )


def _send_email_via_sendgrid(to_email: str, subject: str, content: str) -> bool:
    if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
        return False
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=content.replace('\n', '<br>')
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print(f"[WARN] SendGrid error: {e}")
        return False


def _send_zalo_message(phone: str, content: str) -> bool:
    if not ZALO_OA_TOKEN:
        return False
    try:
        import requests
        url = "https://openapi.zalo.me/v3.0/oa/message/cs"
        headers = {
            "access_token": ZALO_OA_TOKEN,
            "Content-Type": "application/json"
        }
        payload = {
            "recipient": {"phone": phone},
            "message": {"text": content}
        }
        response = requests.post(url, headers=headers, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"[WARN] Zalo API error: {e}")
        return False



async def execute(customer_id: str, customer_name: str, profile: RetrievedProfile, decision: NegotiationDecision) -> ExecutionResult:
    if decision.action_type == "no_action":
        return ExecutionResult(customer_id=customer_id, channel="none", message="", source="n/a")

    user_prompt = (
        f"Tên khách hàng: {customer_name}\n"
        f"Pain point chính: {', '.join(profile.pain_points)}\n"
        f"Sentiment: {profile.sentiment}\n"
        f"Hành động công ty quyết định thực hiện: {decision.action_type} "
        f"(discount_pct={decision.discount_pct}, free_months={decision.free_months})\n"
        f"Lý do nội bộ: {decision.reasoning}\n"
    )

    text = await complete(EXECUTION_MODEL, SYSTEM_PROMPT, user_prompt, max_tokens=300)
    if text:
        message, source = text.strip(), "llm"
    else:
        message, source = _mock_message(customer_name, profile, decision), "mock"

    channel = "phone_call" if decision.action_type in ("vip_training", "discount") else "email"

    sent_successfully = False
    if channel == "email":
        dummy_email = f"{customer_id.lower().replace('-', '')}@example.com"
        sent_successfully = await asyncio.to_thread(
            _send_email_via_sendgrid,
            to_email=dummy_email, 
            subject="Cập nhật ưu đãi từ dịch vụ CSKH", 
            content=message
        )
    else:
        dummy_phone = "84999999999"
        sent_successfully = await asyncio.to_thread(
            _send_zalo_message,
            dummy_phone, message
        )

    if not sent_successfully:
        out_path = MESSAGES_DIR / f"{customer_id}.txt"
        out_path.write_text(
            f"[Channel: {channel}] [Action: {decision.action_type}]\n\n{message}", encoding="utf-8"
        )

    return ExecutionResult(customer_id=customer_id, channel=channel, message=message, source=source)
