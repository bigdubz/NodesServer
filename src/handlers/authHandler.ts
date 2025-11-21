import type { WebSocket } from "ws";
import type {ClientAuthMessage, ServerAuthError, ServerMessage} from "../types.js";
import { connectionManager } from "../connectionManager.js";
import {verifyToken} from "../auth/verifyToken.js";

export function handleAuth(ws: WebSocket, msg: ClientAuthMessage ): void {
    const { userId, token } = msg.payload;

    const verifiedUserId = verifyToken(token);

    if (!verifiedUserId || verifiedUserId !== userId) {
        const error: ServerAuthError = {
            type: "AUTH_ERROR",
            payload: { error: "Invalid or expired token" }
        };
        ws.send(JSON.stringify(error));
        ws.close();
        return;
    }

    (ws as any).userId = userId;

    connectionManager.add(userId, ws);

    const response: ServerMessage = {
        type: "AUTH_OK",
        payload: { userId }
    }

    ws.send(JSON.stringify(response));
}
