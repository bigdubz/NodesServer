import type {ClientMessage, ServerMessage} from "../types.js";
import { WebSocket } from "ws";
import { connectionManager } from "../connectionManager";
import { MessageDB } from "../db/undeliveredMessages.js";

export function relayMessage(ws: WebSocket, message: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): void {
    if (!(ws as any).userId || !(ws as any).deviceId)  {
        return;
    }

    const {
        toUserId,
        toDeviceId,
        blob
    } = message.payload;

    const fromUserId = (ws as any).userId;
    const fromDeviceId = (ws as any).deviceId;

    // save message first
    MessageDB.saveTempMessage(toUserId, toDeviceId, fromUserId, fromDeviceId, message.payload.blob, Date.now());

    const receiverDevice = connectionManager.get(toUserId, toDeviceId) as WebSocket;

    if (receiverDevice && receiverDevice.readyState === WebSocket.OPEN) {
        receiverDevice.send(JSON.stringify({
            type: "ENCRYPTED_RELAY",
            payload: {
                toUserId,
                toDeviceId,
                fromUserId,
                fromDeviceId,
                blob: blob.toString("base64")
            }
        } as ServerMessage));

        // we need another ACK specifically designed to be client -> server, so that the server knows
        // whether it is safe to delete the message or not (we will use hash(blob) from client for referencing)
        // we never delete messages here.
        // so, we need an onAck(). we use ws.userId and ws.deviceId to infer the original sender's destination.
        // (the sender of the ACK is the receiver of the message)
    }
}