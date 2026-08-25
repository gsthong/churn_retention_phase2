"""
privacy_guard.py
----------------
Lớp bảo vệ dữ liệu cá nhân (PII Redaction & Privacy Guard Layer).
Đảm bảo tuân thủ GDPR, SOC-2 và Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân tại VN).
Trước khi dữ liệu khách hàng được chuyển vào Prompt của LLM bên ngoài (OpenAI/Anthropic/OpenRouter),
mọi thông tin định danh trực tiếp (PII) đều được mã hóa/ẩn danh hóa (Anonymization & Pseudonymization).
"""

import re
from typing import Dict, Any, Tuple

class PrivacyGuard:
    @staticmethod
    def mask_name(name: str) -> str:
        """Ẩn danh tên khách hàng: Nguyễn Văn An -> N. V. A hoặc Khách Hàng #ID"""
        if not name:
            return "Khách Hàng"
        parts = name.strip().split()
        if len(parts) == 1:
            return f"{parts[0][0]}***"
        return " ".join([f"{p[0]}." for p in parts[:-1]] + [parts[-1]])

    @staticmethod
    def mask_email(email: str) -> str:
        """Ẩn danh email: user.name@domain.com -> u***e@domain.com"""
        if not email or "@" not in email:
            return "[REDACTED_EMAIL]"
        user, domain = email.split("@", 1)
        if len(user) <= 2:
            masked_user = user[0] + "*"
        else:
            masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
        return f"{masked_user}@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        """Ẩn danh SĐT: 0912345678 -> 091****678"""
        if not phone:
            return "[REDACTED_PHONE]"
        clean_phone = re.sub(r"\D", "", str(phone))
        if len(clean_phone) >= 9:
            return clean_phone[:3] + "****" + clean_phone[-3:]
        return "[REDACTED_PHONE]"

    @classmethod
    def sanitize_customer_profile(cls, customer_data: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Tách biệt dữ liệu nhạy cảm (Private PII Vault) và dữ liệu an toàn chuyển cho LLM (LLM Safe Profile).
        """
        customer_id = customer_data.get("customer_id", "CUS-XXXX")
        raw_name = customer_data.get("name", "Khách Hàng")
        raw_email = customer_data.get("email", f"{customer_id.lower()}@customer.com")
        raw_phone = customer_data.get("phone", "0901234567")

        # LLM Profile chỉ chứa các thông số định tính & percentile thống kê
        safe_profile = {
            "tokenized_id": customer_id,
            "masked_name": cls.mask_name(raw_name),
            "tier": customer_data.get("tier", "Strangers"),
            "risk_bracket": "High (>75%)" if customer_data.get("churn_risk_score", 0) >= 0.75 else "Medium (55-75%)",
            "risk_score": float(customer_data.get("churn_risk_score", 0.7)),
            "ltv_percentile": customer_data.get("ltv_pct", 0.5),
            "tenure_percentile": customer_data.get("tenure_pct", 0.5),
            "contract_type": customer_data.get("contract_type", "Month-to-month"),
            "wallet_capacity": customer_data.get("wallet_capacity", "Standard"),
            "support_pain_points": customer_data.get("pain_points", []),
            "sentiment": customer_data.get("sentiment", "neutral")
        }

        # Private Vault (Lưu nội bộ on-premise, không bao giờ gửi ra API ngoài)
        private_vault = {
            "customer_id": customer_id,
            "real_name": raw_name,
            "real_email": raw_email,
            "real_phone": raw_phone,
            "exact_monthly_fee": customer_data.get("monthly_fee", 0),
            "exact_ltv": customer_data.get("ltv", 0)
        }

        return safe_profile, private_vault

    @classmethod
    def detokenize_message(cls, template_message: str, private_vault: Dict[str, Any]) -> str:
        """
        Sau khi LLM sinh xong nội dung mẫu, hệ thống nội bộ (On-premise Dispatcher)
        sẽ ráp lại Tên thật để gửi tới khách hàng mà không làm lộ dữ liệu lên Cloud LLM.
        """
        real_name = private_vault.get("real_name", "Quý khách")
        # Thay thế placeholder nếu có
        message = template_message.replace("[TÊN_KHÁCH_HÀNG]", real_name)
        message = message.replace("[KHÁCH_HÀNG]", real_name)
        return message
