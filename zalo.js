import { Zalo } from "zca-js";
import fs from "fs";
import db from './db.js';
import crypto from "crypto";
import axios from "axios";

let api = null;
let isReady = false;

// Hàm tạo hash
export function createMessageHash(senderId, content) {
    return crypto
        .createHash("sha256")
        .update(senderId + "|" + content)
        .digest("hex");
}

// Hàm check trùng
function isDuplicate(senderId, content, latestMessage = null) {
    console.log("Checking for duplicate message:", senderId, content);
    const hashCurrentMessage = createMessageHash(senderId, content);
    const hashLatestMessage = createMessageHash(latestMessage.sendable_id, latestMessage.body);
    const now = Date.now();

    if (hashCurrentMessage === hashLatestMessage) {
        const lastTime = latestMessage.created_at;
        // Nếu trùng trong vòng 2 giây → coi như duplicate
        if (now - lastTime <= 2000) {
            return true;
        }
    }
    return false;
}

export async function initZalo() {
    const zalo = new Zalo({
        selfListen: true, // mặc định false, lắng nghe sự kiện của bản thân
        checkUpdate: true, // mặc định true, kiểm tra update
        logging: true // mặc định true, bật/tắt log mặc định của thư viện
    });
    // const _api = await zalo.loginQR();
    const cookie = JSON.parse(fs.readFileSync("./cookie.json", "utf-8"));
    const _api = await zalo.login({
        cookie: cookie,
        imei: "30f2d42f-6d84-4821-8d5c-e6ee28781ee5-7ddeda88d0c599cc494da0dece6554d5", // điền giá trị đã lấy ở bước 3
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", // điền giá trị đã lấy ở bước 4
    });

    const { listener } = _api;
    listener.on("message", async (msg) => {
        console.log("Received message:", msg);
        // Get user_id in DB
        const [rows] = await db.query("SELECT id FROM users WHERE type = 'zalo_user' AND uid = ?", [msg.data.uidFrom]);
        let senderId = null;
        if (rows.length > 0) {
            senderId = rows[0].id;
        } else {
            // Insert new user to db
            const result = await db.query("INSERT INTO users (type, uid, tenant_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())", ['zalo_user', msg.data.uidFrom, 1, 'customer']);
            senderId = result.insertId;
        }
        // Get conversation_id in DB
        const [convRows] = await db.query("SELECT id FROM chat_conversations WHERE thread_id = ?", [msg.threadId]);
        let conversationId = null;
        if (convRows.length > 0) {
            conversationId = convRows[0].id;
        } else {
            // Insert new conversation to db
            const result = await db.query("INSERT INTO chat_conversations (type, thread_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())", ['private', msg.threadId]);
            conversationId = result.insertId;
        }

        // Save to database or handle the message as needed
        if (msg.data.msgType === "webchat") {
            // Check for duplicate messages
            // Get latest message of sender
            const [latestRows] = await db.query("SELECT * FROM chat_messages WHERE sendable_id = ? AND sendable_type = 'App\\\\Models\\\\User' ORDER BY created_at DESC LIMIT 1", [senderId]);
            if (latestRows.length > 0) {
                const latestMessage = latestRows[0];
                console.log("Latest message found:", latestMessage);
                if (isDuplicate(senderId, msg.data.content, latestMessage)) {
                    console.log("Bỏ qua tin nhắn trùng:", msg.data.content);
                    return;
                }
            }
            // Save to database
            console.log("Saving message to database:", msg.data.content);
            const [insertResult] = await db.query("INSERT INTO chat_messages (conversation_id, sendable_id, sendable_type, body, type, created_at, updated_at) VALUES (?, ?, 'App\\\\Models\\\\User', ?, ?, NOW(), NOW())", [conversationId, senderId, msg.data.content, 'text']);
            console.log("Message saved to database: ", insertResult.insertId);
            // Gọi API tới /hook/message-created, method POST, params: message_id
            try {
                const response = await axios.post(
                    "http://nginx/api/hook/message-created",
                    { message_id: insertResult.insertId },
                    { headers: { "Content-Type": "application/json" } }
                );
                console.log("Hook message created called successfully", response.data);
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.error("AxiosError: connect ECONNREFUSED", error.config?.url);
                } else {
                    console.error("AxiosError:", error);
                }
                // Optionally handle the error further, e.g., retry or notify
            }
        }
    });
    listener.start();

    api = _api;
    isReady = true;
    console.log("✅ Zalo client started and listening...");
}

export function getZaloApi() {
    if (!isReady) throw new Error("Zalo API not initialized yet!");
    return api;
}
