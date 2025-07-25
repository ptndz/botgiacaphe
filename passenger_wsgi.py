import time
import re
import cloudscraper
from bs4 import BeautifulSoup
from flask import Flask, jsonify

# --- Cấu hình ---
CACHE_DURATION_SECONDS = 4 * 60 * 60  # Lưu cache trong 4 tiếng  (4 * 60 * 60)  # 4 giờ

# --- Khởi tạo ứng dụng Flask ---
app = Flask(__name__)
application = app  # Đặt biến application để tương thích với WSGI
# --- Biến toàn cục để lưu cache ---
cached_data = {
    "data": None,
    "timestamp": 0
}

def get_coffee_prices():
    """
    Hàm lấy giá cà phê, logic giống như trước.
    """
    url = "https://giacaphe.com/gia-ca-phe-noi-dia/"
    scraper = cloudscraper.create_scraper(browser={'custom': 'ScraperBot/1.0'})
    
    try:
        response = scraper.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        all_css_text = "".join(style.string for style in soup.find_all("style") if style.string)
        
        pattern = re.compile(r"::after\s*{\s*content:\s*'([^']+)'")
        values = pattern.findall(all_css_text)

        if len(values) < 4:
            return None # Trả về None nếu không tìm đủ dữ liệu

        data = {
            "source": "giacaphe.com",
            "prices": {
                "Đắk Lắk": values[0],
                "Lâm Đồng": values[1],
                "Gia Lai": values[2],
                "Đắk Nông": values[3],
            },
            "timestamp": int(time.time()),
            "date": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "text": "Giá cà phê nội địa \n" + 
            "Đắk Lắk: " + values[0] + "\n" +
            "Lâm Đồng: " + values[1] + "\n" +
            "Gia Lai: " + values[2] + "\n" +
            "Đắk Nông: " + values[3] + "",
            "unit": "VNĐ/kg"
        }
        return data

    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu: {e}")
        return None

@app.route('/api/coffee-prices', methods=['GET'])
def api_get_prices():
    """
    Endpoint của API để trả về giá cà phê.
    Sử dụng cache để tối ưu hiệu suất.
    """
    global cached_data
    current_time = time.time()

    # Kiểm tra xem cache có hợp lệ không
    if cached_data["data"] and (current_time - cached_data["timestamp"] < CACHE_DURATION_SECONDS):
        # print("Đang trả về dữ liệu từ cache...")
        return jsonify(cached_data["data"])

    # Nếu cache không hợp lệ, lấy dữ liệu mới
    # print("Cache không hợp lệ, đang lấy dữ liệu mới...")
    fresh_data = get_coffee_prices()
    
    if fresh_data:
        # Cập nhật cache
        cached_data["data"] = fresh_data
        cached_data["timestamp"] = current_time
        return jsonify(fresh_data)
    else:
        # Trả về lỗi nếu không thể lấy dữ liệu
        return jsonify({"error": "Không thể lấy được dữ liệu giá cà phê."}), 500

# Chạy server
if __name__ == '__main__':
    # Chạy trên tất cả các địa chỉ IP, port 5000
    app.run()
