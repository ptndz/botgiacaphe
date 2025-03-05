// Thay thế bằng API Token của bot Telegram
var TELEGRAM_TOKEN = 'I';
var TELEGRAM_API_URL = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN;

// Hàm thiết lập Webhook
function setWebhook() {
  // Thay thế bằng URL Web App của bạn
  var webAppUrl = 'https://script.google.com/macros/s/AKfycbzqN9KQQFN_5l6ehcwEnhek2MlDRGHOwzo22fMcfUmkkmld5EFX6jnhkcvStcBNpa6GsA/exec';

  // Gửi yêu cầu thiết lập Webhook
  var payload = {
    method: 'setWebhook',
    url: webAppUrl
  };
  var options = {
    method: 'post',
    payload: payload
  };
  var response = UrlFetchApp.fetch(TELEGRAM_API_URL + '/', options);

  // Hiển thị kết quả
  Logger.log(response.getContentText());
}
// Gửi tin nhắn đến người dùng
function sendMessage(chatId, text, options) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  var data;

  var JSONData = {}
  for (var i in options) {
    JSONData[i] = JSON.stringify(options[i])
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

// Hàm lấy nội dung HTML từ URL
function getContent_(url) {
  return UrlFetchApp.fetch(url).getContentText();
}

// Hàm lấy giá cà phê từ trang giacaphe.com
function getCoffeePrice() {
  // URL của trang giá cà phê
  var url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';

  // Lấy nội dung HTML của trang
  var content = getContent_(url);
  const regex = /::after\s*{\s*content:\s*'([^']+)'/g;
  let match;
  const contents = [];

  while ((match = regex.exec(content)) !== null) {
    contents.push(match[1]);
  }
  var message = 'Giá cà phê hôm nay:\n';
  message += `Đắk Lắk: ${contents[0]}
Lâm Đồng: ${contents[1]}
Gia Lai: ${contents[2]}
Đắk Nông: ${contents[3]}`
  return message;
}

// Hàm test để in kết quả ra Log
function testGetCoffeePrice() {
  var coffeePrice = getCoffeePrice();
  Logger.log(coffeePrice);
}

// Hàm gửi thông báo hàng ngày lúc 8h
function sendDailyCoffeePrice() {
  var chatId = ''; // Thay thế bằng Chat ID của bạn
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

    if (callbackData === 'xemgia') {
      var message = getCoffeePrice();
      sendMessage(chatId, message);
    }
  }
  // Xử lý tin nhắn thông thường
  else if (update.message) {
    var chatId = update.message.chat.id;
    var text = update.message.text;

    if (text === '/start') {
      // Tạo Inline Keyboard
      var keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Xem giá cà phê', callback_data: 'xemgia' }
            ]
          ],
          keyboard: [["/xemgia"]]
        }
      };
      var welcomeMessage = 'Chào mừng bạn đến với Coffee Price Bot! \n Nhấn nút bên dưới để xem giá cà phê hôm nay.';
      sendMessage(chatId, welcomeMessage, keyboard);
    } else if (text === '/xemgia') {
      var message = getCoffeePrice();
      sendMessage(chatId, message);
    }
  }
}
