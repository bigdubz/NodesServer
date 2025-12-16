import type { WebSocket } from "ws";
import type { ClientAddReaction, ClientRemoveReaction, ServerAddReaction, ServerRemoveReaction } from "../types";
import { connectionManager } from "../connectionManager";
import { MessageDB } from "../db";

export function handleAddReaction(ws: WebSocket, msg: ClientAddReaction) {
    const sender = (ws as any)
    const fromUserId = sender.userId;
    const { messageId, reaction, toUserId } = msg.payload;

    if (!fromUserId) return // not authenticated

    MessageDB.setReaction(messageId, fromUserId, reaction)

    let reactionWsMsg = JSON.stringify({
        type: "ADD_REACTION",
        payload: {
            messageId,
            userId: fromUserId,
            reaction
        }
    } as ServerAddReaction)

    sender.send(reactionWsMsg)

    const target: WebSocket | undefined = connectionManager.get(toUserId);
    if (!target) return

    target.send(reactionWsMsg)
}

export function handleRemoveReaction(ws: WebSocket, msg: ClientRemoveReaction) {
    const sender = (ws as any)
    const fromUserId = sender.userId;
    const { messageId, toUserId } = msg.payload;

    if (!fromUserId) return // not authenticated

    MessageDB.removeReaction(messageId, fromUserId)

    let reactionWsMsg = JSON.stringify({
        type: "REMOVE_REACTION",
        payload: {
            messageId,
            userId: fromUserId
        }
    } as ServerRemoveReaction)

    sender.send(reactionWsMsg)

    const target: WebSocket | undefined = connectionManager.get(toUserId);

    if (!target) return

    target.send(reactionWsMsg)
}
