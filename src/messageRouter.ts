import type { WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "./types.js";
import { handleAuth } from "./handlers/authHandler.js";
import { relayMessage } from "./handlers/relay.js";

export function routeMessage(ws: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
        case "AUTH":
            return handleAuth(ws, msg);

        case "ENCRYPTED_SEND":
            return relayMessage(ws, msg);

        default:
            ws.send(JSON.stringify({
                type: "ERROR",
                payload: { code: "100", error: "Unknown message type: " + msg }
            } as ServerMessage));
            return;
    }
}