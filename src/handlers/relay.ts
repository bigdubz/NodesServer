import type { ClientConnection, ClientMessage } from "../types.js";
import { WebSocket } from "ws";
import { connectionManager } from "../connectionManager";
import { MessageDB } from "../db/undeliveredMessages.js";
import {validateRelayMessage} from "../utils/validate";
import {sendError, sendOk} from "../utils/send";

export function relayMessage(conn: ClientConnection,
                             message: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): void {
    const {
        toUserId,
        toDeviceId,
        blob
    } = message.payload;

    const fromUserId = conn.auth.userId;
    const fromDeviceId = conn.auth.deviceId;

    if (!validateRelayMessage(message)) {
        sendError(conn, "101", "Message size too large or invalid fields");
        return;
    }

    // save message first
    try {
        MessageDB.saveTempMessage(toUserId, toDeviceId, fromUserId, fromDeviceId, message.payload.blob, Date.now());
    } catch (err) {
        sendError(conn, "102", "Failed to save the message. The message was not delivered");
        return;
    }

    const receiverDevice = connectionManager.get(toUserId, toDeviceId) as ClientConnection;
    if (receiverDevice && receiverDevice.ws.readyState === WebSocket.OPEN) {
        sendOk(
            receiverDevice,
            "ENCRYPTED_RELAY",
            {
            toUserId,
            toDeviceId,
            fromUserId,
            fromDeviceId,
            blob: blob.toString("base64")
            }
        );

        // we need another ACK specifically designed to be client -> server, so that the server knows
        // whether it is safe to delete the message or not (we will use hash(blob) from client for referencing)
        // we never delete messages here.
        // so, we need an onAck(). we use conn.auth.userId and conn.auth.deviceId to infer the
        // original sender's destination.
        // (the sender of the ACK is the receiver of the message)
    }
}