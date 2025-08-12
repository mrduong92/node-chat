# Lấy tin nhắn zalo cá nhân
- Dùng thư viện zca-js để listen tin nhắn từ Zalo cá nhân
- Login bằng QR code hoặc cookie
- Document: https://tdung.gitbook.io/zca-js

# Lệnh chạy để mở port 3000
`node zalo.js`

# API gửi tin nhắn:
```
curl --location 'http://localhost:3000/send-message' \
--header 'Content-Type: application/json' \
--data '{
    "content": "Nội dung tin nhắn",
    "threadId": "4117594296618220377",
    "threadType": 0
}'
```
