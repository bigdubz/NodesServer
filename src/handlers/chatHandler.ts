import type { WebSocket } from "ws";
import type { ClientChatMessage, ServerChatMessage, ServerError } from "../types.js";
import { connectionManager } from "../connectionManager.js";

export function handleChatMessage(ws: WebSocket, msg: ClientChatMessage) {
    const fromUserId = (ws as any).userId;
    if (!fromUserId) return;

    const { toUserId, text } = msg.payload;
    const target = connectionManager.get(toUserId);

    const serverMsg: ServerChatMessage = {
        type: "CHAT_MESSAGE",
        payload: {
            fromUserId,
            text,
            messageId: Math.random().toString(36).slice(2),
            createdAt: new Date().toISOString()
        }
    };

    if (target) {
        target.send(JSON.stringify(serverMsg));

        // send ACK to sender
        ws.send(
            JSON.stringify({
                type: "MESSAGE_DELIVERED",
                payload: { messageId: serverMsg.payload.messageId }
            })
        );
    } else {
        ws.send(
            JSON.stringify({
                type: "ERROR",
                payload: { error: "User not connected" }
            } as ServerError)
        );
    }
}

