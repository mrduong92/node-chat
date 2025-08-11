import { Zalo } from "zca-js";
import fs from "fs";

let api = null;
let isReady = false;

export async function initZalo() {
    const zalo = new Zalo({
        selfListen: false, // mặc định false, lắng nghe sự kiện của bản thân
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
    listener.on("message", (msg) => {
        console.log("Received message:", msg);
        // if (typeof msg.data.content === "string") {
        //     _api.sendMessage(msg.data.content, msg.threadId, msg.type)
        //         .catch(console.error);
        // }
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
