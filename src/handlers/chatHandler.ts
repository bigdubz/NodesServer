import type { WebSocket } from "ws";
import type { ClientChatMessage, ServerChatMessage, ServerError, ClientMessageSeen, ClientTyping } from "../types.js";
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

export function handleMessageSeen(_ws: WebSocket, msg: ClientMessageSeen) {
    const { messageId } = msg.payload;

    MessageDB.markSeen(messageId);

    const senderId = MessageDB.getSenderOfMessage(messageId);
    const sender = connectionManager.get(senderId);

    if (sender && sender.readyState === sender.OPEN) {
        sender.send(JSON.stringify({
            type: "MESSAGE_SEEN",
            payload: { messageId }
        }));
    }
}

export function handleUserTyping(ws: WebSocket, msg: ClientTyping) {
    const fromUserId = (ws as any).userId;
    const { toUserId, isTyping } = msg.payload;

    if (!fromUserId) return // not authenticated
    const target: WebSocket | undefined = connectionManager.get(toUserId);

    if (!target) return // user offline

    target.send(JSON.stringify({
        type: "USER_TYPING",
        payload: {
            fromUserId,
            isTyping
        }
    }));
}
