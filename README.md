# BotGPT - Discord.js BOT

Vui lòng đảm bảo đã cài đặt `git` và `nodejs` trên hệ thống. Khuyến nghị sử dụng `nodejs@16` hoặc cao hơn.


Sử dụng lệnh sau để tải về trường trình mới nhất:
```bash
git clone https://github.com/DK189/botgpt.git
```

Sau đó dùng lệnh sau để vào thư mục chương trình và cài đặt các thành phần cần thiết.
```bash
cd botgpt
npm ci
```

Để khởi chạy chương trình, sử dụng lệnh sau.
```bash
DISCORD_BOT_TOKEN="<Discord bot Token>" \
OPENAI_API_KEY="<OpenAI Platform API KEY>" \
npm start
```
*Token và apikey hãy lấy từ trình cấp nhà phát triển của nền tảng tương ứng*


Nếu thành công, trên giao diện sẽ xuất hiện phản hồi sau.
```bash
> botgpt@1.0.0 start
> node main.js

Sẵn sàng rồi BotGPT#0000!
Dùng link sau để thêm BotGPT vào server nhé!!
        https://discord.com/oauth2/authorize?scope=bot&permissions=8&client_id=000000000000000
```

Lúc này, hãy truy cập vào link có trong phản hồi để thực hiện thêm bot vào server Discord của bạn.

# Quá trình sử dụng

Trong server discord đã add BotGPT, buộc phải có channel có tên là `botgpt`, đây là nơi mọi người và BotGPT trò truyện với nhau.

Để reset và bắt đầu đoạn chat mới, sử dụng lệnh `&new`. nếu bạn sử dụng lệnh này ngoài channel `botgpt`, BotGPT sẽ thông báo lại phải sử dụng kênh `botgpt` mới có thể tương tác.

# Cập nhật và thông báo miến trừ trách nhiệm

Chưa có kế hoạch cụ thể về việc quốc tế hoá và đưa lên nền tảng phân phối như **npm**, **yarn**, hay thậm chí là **docker**. Do vậy bạn cứ việc sử dụng git trong việc tải về theo hướng dẫn ở trên và dùng `git pull` để cập nhật phiên bản mới nhất. Tốt nhất là thực thi lệnh `git pull & npm ci` mỗi lần trước khi khởi chạy chương trình.

Mặc dù trong chương trình này hầu hết sử dụng tiếng Việt, tuy nhiên ChatGPT của openai vẫn có hỗ trợ các ngôn ngữ khác, do vậy không cần lo lắng khi bạn muốn dùng ngôn ngữ khác ngoài tiếng Việt để tương tác với BotGPT.

# Nâng cao

Nếu muốn lệnh khởi chạy trông đơn giản hơn, hãy đưa `DISCORD_BOT_TOKEN` và `OPENAI_API_KEY` vào cấu hình môi trường của máy tính.
Lúc này bạn chỉ cần chạy chương trình thông qua lệnh
```bash
npm start
```