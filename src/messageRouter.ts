import type { WebSocket } from "ws";
import type { ClientMessage } from "./types.js";
import { handleAuth } from "./handlers/authHandler.js";
import {
    handleAddReaction,
    handleChatMessage,
    handleMessageSeen,
    handleRemoveReaction,
    handleUserTyping
} from "./handlers/chatHandler.js";

export function routeMessage(ws: WebSocket, msg: ClientMessage) {
    switch (msg.type) {
        case "AUTH":
            return handleAuth(ws, msg);
        case "CHAT_MESSAGE":
            return handleChatMessage(ws, msg);
        case "MESSAGE_SEEN":
            return handleMessageSeen(ws, msg);
        case "USER_TYPING":
            return handleUserTyping(ws, msg);
        case "ADD_REACTION":
            return handleAddReaction(ws, msg);
        case "REMOVE_REACTION":
            return handleRemoveReaction(ws, msg);
        default:
            ws.send(JSON.stringify({
                type: "ERROR",
                payload: { error: "Unknown message type: " + msg }
            }))
            return;
    }
}