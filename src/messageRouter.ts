import type { WebSocket } from "ws";
import type { ClientMessage } from "./types.js";
import { handleAuth } from "./handlers/authHandler.js";
import { handleChatMessage } from "./handlers/chatHandler.js";

export function routeMessage(ws: WebSocket, msg: ClientMessage) {
    switch (msg.type) {
        case "AUTH":
            return handleAuth(ws, msg);
        case "CHAT_MESSAGE":
            return handleChatMessage(ws, msg);
        default:
            console.log("Unknown message type:", msg);
    }
}