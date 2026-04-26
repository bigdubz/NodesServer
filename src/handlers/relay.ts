import type { ClientMessage } from "../types.js";
import { WebSocket } from "ws";
import { connectionManager } from "../connectionManager";
import { MessageDB } from "../db/undeliveredMessages.js";

export function relayMessage(ws: WebSocket, message: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): void {
    if (!(ws as any).userId || !(ws as any).deviceId) return;

    const {
        toUserId,
        toDeviceId,
    } = message.payload;

    // save message first
    MessageDB.saveTempMessage(toUserId, toDeviceId, message.payload.blob, Date.now());

    const receiverDevice = connectionManager.get(toUserId, toDeviceId) as WebSocket;

    if (receiverDevice && receiverDevice.readyState === WebSocket.OPEN) {
        receiverDevice.send(JSON.stringify({
            type: "ENCRYPTED_RELAY",
            payload: message.payload
        }));
        return;
    }
}