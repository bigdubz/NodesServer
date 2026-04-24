import type { WebSocket } from "ws";
import type { ClientMessage, ServerMessage, } from "../types.js";
import { broadcast, sendPresence } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB } from "../db/undeliveredMessages";

export function handleAuth(ws: WebSocket, msg: Extract<ClientMessage, { type: "AUTH"}> ): void {
    const { userId, token } = msg.payload;

    const verifiedUserId: string | null = verifyToken(token);

    if (!verifiedUserId || verifiedUserId !== userId) {
        const error: ServerMessage = {
            type: "ERROR",
            payload: { code: "200", error: "Invalid or expired token" }
        };
        ws.send(JSON.stringify(error));
        ws.close();
        return;
    }

    (ws as any).userId = userId;
    connectionManager.add(userId, ws);

    ws.send(JSON.stringify({
        type: "AUTH_OK",
        payload: { userId }
    } as ServerMessage));

    // todo: this should now point to the new undeliveredMessages table
    const undelivered: MessageRow[] = MessageDB.getUndeliveredMessages(userId);


    for (const msg of undelivered) {
        const payload: ChatPayLoad = {
            messageId: msg.messageId,
            fromUserId: msg.fromUserId,
            text: msg.text,
            createdAt: msg.createdAt,
            isOnline: false,
            replyingTo: msg.replyingTo
        }

        ws.send(JSON.stringify({
            type: "CHAT_MESSAGE",
            payload
        } as ServerChatMessage))

        MessageDB.markDelivered(msg.messageId);

        const sender: WebSocket | undefined = connectionManager.get(msg.fromUserId);
        if (sender && sender.readyState === sender.OPEN) {
            sender.send(JSON.stringify({
                type: "MESSAGE_DELIVERED",
                payload: { messageId: msg.messageId }
            } as ServerMessageDelivered));
        }
    }

    broadcast({
        type: "USER_ONLINE",
        payload: { userId }
    } as ServerUserOnline);
    sendPresence(userId);
}
