"""
generate_logs.py
-----------------
Sinh dữ liệu log tương tác / ticket hỗ trợ cho từng khách hàng.
Tự động khai thác trực tiếp Churn Reason và Churn Category thực tế từ Phase 1 (Telco dataset)
để tạo ra log hội thoại/khiếu nại chân thực nhất cho Data Retriever Agent và Strategic Negotiator Agent.

Chạy: python -m data_gen.generate_logs
"""

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import CUSTOMERS_CSV, LOG_DIR, DATA_DIR, RANDOM_SEED

# Mapping 20 Telco Churn Reasons -> Rich Vietnamese Customer Tickets / Chat Logs
TELCO_REASON_LOGS: Dict[str, List[str]] = {
    "Competitor made better offer": [
        "Bên đối thủ đang chào gói cước kèm quà tặng hấp dẫn hơn nhiều, tôi đang cân nhắc hủy gia hạn.",
        "Nhà mạng bên kia vừa gọi tư vấn gói rẻ hơn 30% cho khách hàng mới, khuyến mãi hời quá.",
        "Thấy bạn bè chuyển sang bên đối thủ bảo chính sách ưu đãi khách hàng tốt hơn hẳn bên mình.",
    ],
    "Competitor had better devices": [
        "Bên đối thủ tặng kèm modem WiFi 6 hai băng tần và thiết bị mới, bên mình thiết bị cũ quá rồi.",
        "Thiết bị phát sóng bên mình dùng 2 năm rồi bắt đầu chập chờn, hỏi đổi mới thì bắt đóng thêm phí.",
    ],
    "Competitor offered higher download speeds": [
        "Tốc độ tải bên nhà mạng kia lên tới 500Mbps mà giá tương đương, bên mình đo speedtest chỉ được 80Mbps.",
        "Bên đối thủ cam kết băng thông quốc tế tối thiểu 10Mbps, bên mình tối đến là xem YouTube bị quay tròn.",
    ],
    "Competitor offered more data": [
        "Gói data bên mạng đối thủ gấp đôi dung lượng với cùng mức giá, bên mình dùng nửa tháng là hết sạch dung lượng cao.",
        "Dung lượng 4G/5G hàng ngày bị bóp băng thông sớm quá, bên đối thủ cho tới 4GB/ngày.",
    ],
    "Product dissatisfaction": [
        "Chất lượng sản phẩm dịch vụ thời gian gần đây không đạt như kỳ vọng ban đầu, các tính năng hay gặp lỗi.",
        "Ứng dụng quản lý hay bị văng giữa chừng, giao diện giật lag khó thao tác.",
    ],
    "Service dissatisfaction": [
        "Dịch vụ thường xuyên bị gián đoạn vào giờ cao điểm, rất ức chế khi đang làm việc online tại nhà.",
        "Chất lượng đường truyền không ổn định, ping cao khi chơi game và họp trực tuyến.",
    ],
    "Long distance charges": [
        "Cước gọi đường dài và liên mạng tháng này tính đắt quá, bên mình không có gói cước gộp ưu đãi.",
        "Phí phát sinh gọi liên tỉnh cao bất thường, cần giải thích rõ bảng giá.",
    ],
    "Attitude of service provider": [
        "Thái độ giải quyết khiếu nại của tổng đài viên rất thờ ơ, không tôn trọng khách hàng lâu năm.",
        "Khiếu nại cả tuần không thấy quản lý liên hệ lại, cách chăm sóc khách hàng quá thiếu chuyên nghiệp.",
    ],
    "Attitude of support person": [
        "Nhân viên hỗ trợ kỹ thuật hôm qua nói chuyện gắt gỏng, hẹn bảo trì 9h sáng mà 3h chiều mới tới.",
        "Kỹ thuật viên đến nhà kiểm tra qua loa rồi bảo bình thường, trong khi mạng vẫn không dùng được.",
    ],
    "Poor expertise of online support": [
        "Nhắn tin qua web chat hỏi lỗi kỹ thuật mà bot trả lời vòng vo, nhân viên online không nắm được nghiệp vụ.",
        "Support qua chat hướng dẫn khởi động lại modem mãi mà không giải quyết được lỗi IP.",
    ],
    "Poor expertise of phone support": [
        "Gọi tổng đài 3 lần gặp 3 nhân viên khác nhau nhưng không ai giải quyết dứt điểm được sự cố mạng.",
        "Nhân viên trực tổng đài không hiểu về gói cước doanh nghiệp, chuyển máy lòng vòng mất cả 30 phút.",
    ],
    "Extra data charges": [
        "Hóa đơn tháng này bị cộng thêm 150.000đ phí data vượt gói vô lý mà không hề nhận được tin nhắn cảnh báo trước.",
        "Sao tự nhiên có khoản phụ phí dung lượng phát sinh trong khi tôi không hề đăng ký thêm dịch vụ nào?",
    ],
    "Price too high": [
        "Gói cước tháng này giá cao quá so với thu nhập hiện tại, kinh tế khó khăn nên tôi đang cân nhắc cắt giảm.",
        "Mức phí duy trì hàng tháng đắt hơn nhiều so với nhu cầu thực tế của gia đình tôi.",
    ],
    "Lack of affordable download/upload speed": [
        "Không có gói cước tốc độ cao với mức giá vừa túi tiền cho hộ gia đình, gói nhanh thì giá quá cao.",
        "Cần gói cước upload cao để livestream nhưng giá gói chuyên dụng bên mình đắt quá.",
    ],
    "Lack of self-service on Website": [
        "Website và app không có chức năng tự đổi gói hoặc tra cứu chi tiết cước, mỗi lần muốn đổi phải ra tận quầy giao dịch.",
        "Giao diện web khó sử dụng, tìm mãi không thấy chỗ hủy dịch vụ gia hạn tự động.",
    ],
    "Network reliability": [
        "Mạng rớt liên tục 4 lần trong tuần qua, đang họp video call với khách hàng thì bị ngắt kết nối.",
        "Tín hiệu mạng chập chờn từ đầu tuần tới giờ, đèn modem cứ báo đỏ liên tục.",
    ],
    "Limited range of services": [
        "Khu vực nhà tôi không hỗ trợ các dịch vụ giá trị gia tăng và truyền hình cáp đi kèm mà tôi cần.",
        "Nhà mạng không có gói combo tích hợp cả internet, truyền hình và di động cho cả gia đình.",
    ],
    "Moved": [
        "Tôi sắp chuyển nhà sang địa chỉ mới ở tỉnh khác vào cuối tháng này, muốn hỏi thủ tục tạm ngưng hoặc chuyển địa điểm.",
        "Tôi đi công tác nước ngoài dài hạn 6 tháng, muốn bảo lưu hợp đồng hoặc tạm khóa dịch vụ.",
    ],
    "Deceased": [
        "Chủ hợp đồng là người thân trong gia đình tôi vừa qua đời, gia đình muốn thanh lý hợp đồng và đóng gói cước.",
        "Gia đình muốn làm thủ tục hủy dịch vụ do chủ tài khoản đã mất.",
    ],
    "Don't know": [
        "Tài khoản không phát sinh lưu lượng và không mở ứng dụng trong hơn 20 ngày qua.",
        "Không có hoạt động sử dụng dịch vụ trong tháng gần nhất.",
    ],
}

FALLBACK_TEMPLATES = {
    "technical_issue": [
        "Mạng dạo này lag quá, tao load phim không nổi.",
        "Ứng dụng cứ bị văng ra giữa chừng, phiền thật sự.",
        "Kết nối chập chờn suốt 3 ngày nay, gọi tổng đài không ai nghe máy.",
    ],
    "billing_complaint": [
        "Sao tháng này tự nhiên bị trừ tiền nhiều hơn mọi khi vậy?",
        "Phí phát sinh gì mà không thấy thông báo trước, thấy hơi khó chịu.",
        "Mình đâu có dùng thêm gói gì mà hóa đơn tăng vọt thế này.",
    ],
    "competitor_mention": [
        "Bên đối thủ đang có gói rẻ hơn nhiều mà chất lượng nghe nói cũng ổn.",
        "Thấy quảng cáo bên kia khuyến mãi khủng quá, đang phân vân chuyển qua.",
    ],
    "feature_confusion": [
        "Không biết cách bật tính năng mới này thế nào, hướng dẫn rối quá.",
        "Mò mãi không ra chỗ đổi gói cước trong app, giao diện khó hiểu.",
    ],
    "silence": [
        "Không có hoạt động đăng nhập nào trong 21 ngày gần nhất.",
        "Tài khoản không phát sinh sử dụng dữ liệu trong 18 ngày qua.",
    ],
    "price_sensitive_but_positive": [
        "Dịch vụ dùng cũng ổn đó, nhưng giá hơi cao so với thu nhập hiện tại.",
        "Nhìn chung hài lòng, chỉ là dạo này chi tiêu eo hẹp nên đang cân nhắc cắt giảm.",
    ],
}


def _random_timestamp(rng: random.Random, days_back: int = 30) -> str:
    dt = datetime.now() - timedelta(days=rng.randint(0, days_back), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
    return dt.strftime("%Y-%m-%d %H:%M")


def _get_category_tag(reason: str) -> str:
    r = reason.lower()
    if any(k in r for k in ["competitor", "offer", "speed", "data"]):
        return "competitor_mention"
    if any(k in r for k in ["price", "charge", "fee", "bill"]):
        return "billing_complaint"
    if any(k in r for k in ["support", "attitude", "expertise", "dissatisfaction"]):
        return "support_dissatisfaction"
    if any(k in r for k in ["network", "reliability", "lag", "disconnect"]):
        return "technical_issue"
    if any(k in r for k in ["moved", "relocation"]):
        return "relocation"
    if "deceased" in r:
        return "deceased"
    if "website" in r or "self-service" in r:
        return "feature_confusion"
    return "silence"


def generate_logs(customers_df: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = random.Random(seed)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    index_rows = []
    for _, row in customers_df.iterrows():
        cid = row["customer_id"]
        churn_reason = str(row.get("churn_reason", "")).strip()
        churn_category = str(row.get("churn_category", "voluntary")).strip()

        lines = []
        n_events = rng.randint(1, 3)

        # 1. Primary event directly matching the real Churn Reason
        if churn_reason and churn_reason in TELCO_REASON_LOGS:
            primary_text = rng.choice(TELCO_REASON_LOGS[churn_reason])
            primary_tag = _get_category_tag(churn_reason)
        else:
            primary_tag = "technical_issue" if rng.random() < 0.5 else "billing_complaint"
            primary_text = rng.choice(FALLBACK_TEMPLATES[primary_tag])

        ts1 = _random_timestamp(rng, days_back=rng.randint(1, 5))
        lines.append(f"[{ts1}] ({primary_tag}) {primary_text}")

        # 2. Additional supporting events (if n_events > 1)
        for _ in range(n_events - 1):
            sec_keys = list(FALLBACK_TEMPLATES.keys())
            sec_cat = rng.choice(sec_keys)
            sec_text = rng.choice(FALLBACK_TEMPLATES[sec_cat])
            ts_sec = _random_timestamp(rng, days_back=rng.randint(6, 25))
            lines.append(f"[{ts_sec}] ({sec_cat}) {sec_text}")

        # Sort logs chronologically
        lines.sort()

        log_path = LOG_DIR / f"{cid}.txt"
        log_path.write_text("\n".join(lines), encoding="utf-8")

        index_rows.append({
            "customer_id": cid,
            "log_path": str(log_path.relative_to(DATA_DIR.parent)),
            "churn_reason": churn_reason,
            "churn_category": churn_category,
            "primary_category": primary_tag,
            "n_events": n_events,
        })

    return pd.DataFrame(index_rows)


if __name__ == "__main__":
    if not CUSTOMERS_CSV.exists():
        from phase1_model import run_phase1
        run_phase1(n_customers=200)

    customers_df = pd.read_csv(CUSTOMERS_CSV)
    index_df = generate_logs(customers_df)
    index_path = DATA_DIR / "logs_index.csv"
    index_df.to_csv(index_path, index=False, encoding="utf-8-sig")
    print(f"Đã sinh log tương tác cho {len(index_df)} khách hàng -> {LOG_DIR}/")
    print(f"Index file -> {index_path}")
