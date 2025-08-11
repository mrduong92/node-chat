import express from "express";
import { createZaloApi } from "./zalo.js";
import { registerSendMessageApi } from "./api.js";

async function main() {
    const { api } = await createZaloApi();
    const app = express();
    app.use(express.json());

    registerSendMessageApi(app, api);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Express server running on port ${PORT}`);
    });
}

main();
