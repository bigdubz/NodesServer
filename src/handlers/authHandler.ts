import type { WebSocket } from "ws";
import type {
    ClientAuthMessage,
    ChatPayLoad,
    ServerAuthError, ServerMessageDelivered, ServerChatMessage,
    MessageRow, ServerUserOnline, ServerAuthOK
} from "../types.js";
import { setOnline } from "../presence/presenceStore.js"
import { broadcast, sendPresence } from "../utils/broadcast.js"
import { connectionManager } from "../connectionManager.js";
import { verifyToken } from "../auth/verifyToken.js";
import { MessageDB } from "../db";

export function handleAuth(ws: WebSocket, msg: ClientAuthMessage ): void {
    const { userId, token } = msg.payload;

    const verifiedUserId: string | null = verifyToken(token);

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
    ws.send(JSON.stringify({
        type: "AUTH_OK",
        payload: { userId }
    } as ServerAuthOK));

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
