import type { WebSocket } from "ws";
import type { ClientMessage } from "../types.js";

export function relayMessage(ws: WebSocket, message: Extract<ClientMessage, { type: "ENCRYPTED_SEND" }>): void {
    if (!(ws as any).userId || !(!ws as any).deviceId) return;

    const {
        fromUserId,
        fromDeviceId,
        toUserId,
        toDeviceId,
        clientNonce,
        dhPublicKey,
        messageNumber,
        previousChainLength,
        iv,
        ciphertext
    } = message.payload;


}