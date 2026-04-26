import type { WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "./types.js";
import { onAuth } from "./handlers/authHandler.js";
import { relayMessage } from "./handlers/relay.js";
import { onAck } from "./handlers/ackHandler";

export function routeMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
        case "AUTH":
            return onAuth(ws, msg);

        case "ENCRYPTED_SEND":
            return relayMessage(ws, msg);

        case "ACK":
            return onAck(ws, msg);

        default:
            ws.send(JSON.stringify({
                type: "ERROR",
                payload: { code: "100", error: "Unknown message type: " + msg }
            } as ServerMessage));
            return;
    }
}