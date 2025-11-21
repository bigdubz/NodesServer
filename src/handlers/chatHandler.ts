import type { WebSocket } from "ws";
import type { ClientChatMessage, ServerChatMessage, ServerError } from "../types.js";
import { connectionManager } from "../connectionManager.js";
import { MessageDB } from "../db"
import crypto from "crypto"


export function handleChatMessage(ws: WebSocket, msg: ClientChatMessage) {
    const fromUserId = (ws as any).userId;
    if (!fromUserId) {
        ws.send(
            JSON.stringify({
                type: "ERROR",
                payload: { error: "Unauthorized (not logged in)" }
            } as ServerError)
        );
        return;
    }

    const { toUserId, text } = msg.payload;
    const createdAt = Date.now();
    const messageId = crypto.randomUUID();


    const serverMsg: ServerChatMessage = {
        type: "CHAT_MESSAGE",
        payload: {
            fromUserId,
            text,
            messageId,
            createdAt
        }
    };

    MessageDB.saveMessage({
        messageId,
        fromUserId,
        toUserId,
        text,
        createdAt
    })
    console.log("Message saved to DB:", serverMsg.payload);

    const target = connectionManager.get(toUserId);

    if (target && target.readyState === target.OPEN) {
        target.send(JSON.stringify(serverMsg));

        MessageDB.markDelivered(messageId);

        // send ACK to sender
        ws.send(
            JSON.stringify({
                type: "MESSAGE_DELIVERED",
                payload: { messageId: serverMsg.payload.messageId }
            })
        );
    }
}

