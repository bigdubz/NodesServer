import type { WebSocket } from "ws";
import type {
    ClientChatMessage, ClientMessageSeen, ClientTyping, ClientAddReaction, ClientRemoveReaction,
    ServerChatMessage, ServerAddReaction, ServerRemoveReaction, ServerMessageDelivered, ServerMessageSeen,
    ServerUserTyping
} from "../types.js";
import { connectionManager } from "../connectionManager.js";
import { MessageDB } from "../db"
import crypto from "crypto"


export function handleChatMessage(ws: WebSocket, msg: ClientChatMessage) {
    const fromUserId = (ws as any).userId;
    if (!fromUserId) return

    const { toUserId, text, clientId, replyingTo } = msg.payload;
    const createdAt = Date.now();
    const messageId = crypto.randomUUID();

    MessageDB.saveMessage({
        messageId,
        fromUserId,
        toUserId,
        text,
        createdAt,
        replyingTo
    })

    const target: WebSocket | undefined = connectionManager.get(toUserId);

    if (target && target.readyState === target.OPEN) {
        const serverMsg: ServerChatMessage = {
            type: "CHAT_MESSAGE",
            payload: {
                fromUserId,
                text,
                messageId,
                createdAt,
                isOnline: true,
                replyingTo
            }
        };
        target.send(JSON.stringify(serverMsg));

        MessageDB.markDelivered(messageId);
    }

    // send ACK to sender
    ws.send(JSON.stringify({
            type: "MESSAGE_DELIVERED",
            payload: { messageId: messageId, clientId }
    } as ServerMessageDelivered));
}

export function handleMessageSeen(_ws: WebSocket, msg: ClientMessageSeen) {
    const { messageId } = msg.payload;

    MessageDB.markSeen(messageId);

    const senderId: string = MessageDB.getSenderOfMessage(messageId);
    const sender: WebSocket | undefined = connectionManager.get(senderId);

    if (sender && sender.readyState === sender.OPEN) {
        sender.send(JSON.stringify({
            type: "MESSAGE_SEEN",
            payload: { messageId }
        } as ServerMessageSeen));
    }
}

export function handleAddReaction(ws: WebSocket, msg: ClientAddReaction) {
    const sender = (ws as any)
    const fromUserId = sender.userId;
    const { messageId, reaction, toUserId } = msg.payload;

    if (!fromUserId) return // not authenticated

    MessageDB.setReaction(messageId, reaction)

    sender.send(JSON.stringify({
        type: "ADD_REACTION",
        payload: { messageId, reaction }
        } as ServerAddReaction)
    )

    const target: WebSocket | undefined = connectionManager.get(toUserId);
    if (!target) return

    target.send(JSON.stringify({
        type: "ADD_REACTION",
        payload: { messageId, reaction }
        } as ServerAddReaction)
    )
}

export function handleRemoveReaction(ws: WebSocket, msg: ClientRemoveReaction) {
    const sender = (ws as any)
    const fromUserId = sender.userId;
    const { messageId, toUserId } = msg.payload;

    if (!fromUserId) return // not authenticated

    MessageDB.removeReaction(messageId)

    sender.send(JSON.stringify({
            type: "REMOVE_REACTION",
            payload: { messageId }
    } as ServerRemoveReaction))

    const target: WebSocket | undefined = connectionManager.get(toUserId);

    if (!target) return

    target.send(JSON.stringify({
            type: "REMOVE_REACTION",
            payload: { messageId }
        } as ServerRemoveReaction)
    )
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
    } as ServerUserTyping));
}
