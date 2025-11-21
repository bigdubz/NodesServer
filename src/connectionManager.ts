import type { WebSocket } from "ws";

class ConnectionManager {
    private connections = new Map<string, WebSocket>();

    add(userId: string, ws: WebSocket): void {
        this.connections.set(userId, ws);
    }

    remove(userId: string): void {
        this.connections.delete(userId);
    }

    get(userId: string): WebSocket | undefined {
        return this.connections.get(userId);
    }
}

export const connectionManager = new ConnectionManager();