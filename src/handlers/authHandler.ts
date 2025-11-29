import type { WebSocket } from "ws";
import type { ClientAuthMessage, ServerAuthError, ServerMessage, ChatPayLoad } from "../types.js";
import { setOnline } from "../presence/presenceStore.js"
import { broadcast } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB } from "../db";

export function handleAuth(ws: WebSocket, msg: ClientAuthMessage ): void {
    const { userId, token } = msg.payload;

    const verifiedUserId = verifyToken(token);

    if (!verifiedUserId || verifiedUserId !== userId) {
        const error: ServerAuthError = {
            type: "AUTH_ERROR",
            payload: { error: "Invalid or expired token" }
        };
        ws.send(JSON.stringify(error));
        ws.close();
        return;
    }

    (ws as any).userId = userId;
    connectionManager.add(userId, ws);

    setOnline(userId);

    broadcast({
        type: "USER_ONLINE",
        payload: { userId }
    });

    const response: ServerMessage = {
        type: "AUTH_OK",
        payload: { userId }
    }

    const undelivered = MessageDB.getUndeliveredMessages(userId);

    for (const msg of undelivered) {
        const payload: ChatPayLoad = {
            messageId: msg.messageId,
            fromUserId: msg.fromUserId,
            text: msg.text,
            createdAt: msg.createdAt,
            isOnline: false
        }

        ws.send(JSON.stringify({
            type: "CHAT_MESSAGE",
            payload
        }))

        MessageDB.markDelivered(msg.messageId);

        const sender = connectionManager.get(msg.fromUserId);
        if (sender && sender.readyState === sender.OPEN) {
            sender.send(JSON.stringify({
                type: "MESSAGE_DELIVERED",
                payload: { messageId: msg.messageId }
            }));
        }
    }

    ws.send(JSON.stringify(response));
}
