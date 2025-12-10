import { WebSocket } from "ws";
import { connectionManager } from "../connectionManager.js"

export function broadcast(msg: object): void {
    for (const ws of connectionManager.getAll()) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg))
        }
    }
}