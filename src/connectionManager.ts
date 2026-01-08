import { WebSocket } from "ws";

class ConnectionManager {
    private connections: Map<string, WebSocket> = new Map<string, WebSocket>();

    add(userId: string, ws: WebSocket): void {
        this.connections.set(userId, ws);
    }

    remove(userId: string): void {
        this.connections.delete(userId);
    }

    get(userId: string): WebSocket | undefined {
        return this.connections.get(userId);
    }

    has(userId: string): boolean {
        return !!this.get(userId);
    }

    getAll(): WebSocket[] {
        return Array.from(this.connections.values());
    }

    getAllOnline(): WebSocket[] {
        return this.getAll().filter(ws => ws.readyState === WebSocket.OPEN);
    }

    getUserIdsOnline(): string[] {
        return this.getAllOnline().map(ws => (ws as any).userId);
    }
}

export const connectionManager = new ConnectionManager();