import express from "express";
import bodyParser from "body-parser";
import { initZalo, getZaloApi, createMessageHash } from "./zalo.js";
import db from './db.js';

const app = express();
app.use(bodyParser.json());

app.post("/send-message", async (req, res) => {
    try {
        const { messageId, senderId, content, threadId, threadType } = req.body;
        console.log("Send message request:", { content, threadId, threadType });
        const api = getZaloApi();
        await api.sendMessage(content, threadId, threadType);
        res.json({ success: true });
    } catch (err) {
        res.status(503).json({ success: false, error: err.message });
    }
});

// Lấy tất cả user
app.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Express server running on port ${PORT}`);
    await initZalo(); // Chạy login QR trước khi sẵn sàng
});
