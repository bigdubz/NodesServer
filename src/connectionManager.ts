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

    getAll(): WebSocket[] {
        return Array.from(this.connections.values());
    }
}

export const connectionManager = new ConnectionManager();