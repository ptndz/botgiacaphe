// Thay thế bằng API Token của bot Telegram
var TELEGRAM_TOKEN = "";
var TELEGRAM_API_URL = "https://api.telegram.org/bot" + TELEGRAM_TOKEN;

// Hàm thiết lập Webhook
function setWebhook() {
  // Thay thế bằng URL Web App của bạn
  var webAppUrl = "";

  // Gửi yêu cầu thiết lập Webhook
  var payload = {
    method: "setWebhook",
    url: webAppUrl,
  };
  var options = {
    method: "post",
    payload: payload,
  };
  var response = UrlFetchApp.fetch(TELEGRAM_API_URL + "/", options);

  // Hiển thị kết quả
  Logger.log(response.getContentText());
}
// Gửi tin nhắn đến người dùng
function sendMessage(chatId, text, options) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  var data;

  var JSONData = {};
  for (var i in options) {
    JSONData[i] = JSON.stringify(options[i]);
  }
  data = JSONData;
  data.chat_id = chatId;
  data.text = text;

  const payload = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(data),
  };

  UrlFetchApp.fetch(url, payload);
}

/**
 * Lấy giá cà phê từ API và định dạng thành tin nhắn.
 * API: https://api-caphe.bug.edu.vn/api/coffee-prices
 */
function getCoffeePrice() {
  const apiUrl = "https://api-caphe.bug.edu.vn/api/coffee-prices";

  try {
    // Gọi API để lấy dữ liệu
    const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });

    // Kiểm tra xem yêu cầu có thành công không
    if (response.getResponseCode() !== 200) {
      Logger.log(`Lỗi API: ${response.getContentText()}`);
      return "Không thể lấy dữ liệu giá cà phê vào lúc này.";
    }

    // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
    const data = JSON.parse(response.getContentText());
    const prices = data.prices;

    // Kiểm tra xem dữ liệu giá có tồn tại không
    if (!prices) {
      return "Dữ liệu trả về từ API không hợp lệ.";
    }

    // Tạo tin nhắn hiển thị giá cà phê
    let message = "☕ Giá cà phê hôm nay:\n";
    message += `Đắk Lắk: ${prices["Đắk Lắk"]}\n`;
    message += `Lâm Đồng: ${prices["Lâm Đồng"]}\n`;
    message += `Gia Lai: ${prices["Gia Lai"]}\n`;
    message += `Đắk Nông: ${prices["Đắk Nông"]}\n`;

    // Thêm nguồn và đơn vị cho đầy đủ thông tin
    message += `(Nguồn: ${data.source} - Đơn vị: ${data.unit})`;

    return message;
  } catch (e) {
    Logger.log(e.toString());
    return "Đã có lỗi xảy ra khi xử lý dữ liệu.";
  }
}

// Hàm test để in kết quả ra Log
function testGetCoffeePrice() {
  var coffeePrice = getCoffeePrice();
  Logger.log(coffeePrice);
}

// Hàm gửi thông báo hàng ngày lúc 8h
function sendDailyCoffeePrice() {
  var chatId = "1599852312"; // Thay thế bằng Chat ID của bạn
  var message = getCoffeePrice();
  sendMessage(chatId, message);
}

// Hàm xử lý tin nhắn và callback từ Telegram
function doPost(e) {
  var update = JSON.parse(e.postData.contents);

  // Xử lý callback từ Inline Keyboard
  if (update.callback_query) {
    var chatId = update.callback_query.message.chat.id;
    var callbackData = update.callback_query.data;

    if (callbackData === "xemgia") {
      var message = getCoffeePrice();
      sendMessage(chatId, message);
    }
  }
  // Xử lý tin nhắn thông thường
  else if (update.message) {
    var chatId = update.message.chat.id;
    var text = update.message.text;

    if (text === "/start") {
      // Tạo Inline Keyboard
      var keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Xem giá cà phê", callback_data: "xemgia" }],
          ],
          keyboard: [["/xemgia"]],
        },
      };
      var welcomeMessage =
        "Chào mừng bạn đến với Coffee Price Bot! \n Nhấn nút bên dưới để xem giá cà phê hôm nay.";
      sendMessage(chatId, welcomeMessage, keyboard);
    } else if (text === "/xemgia") {
      var message = getCoffeePrice();
      sendMessage(chatId, message);
    }
  }
}
