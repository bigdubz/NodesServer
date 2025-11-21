import { WebSocketServer } from "ws";
import http from "http";
import { routeMessage } from "./messageRouter.js";
import type { ClientMessage } from "./types.js";
import { connectionManager } from "./connectionManager.js";
import { handleLogin } from "./http/loginRoute.js";

const PORT = 8080;

// http server
const server = http.createServer((req, res) => {
    if (req.url === "/login") {
        return handleLogin(req, res);
    }

    res.writeHead(200);
    res.end("WebSocket server is running.\n");
});

// websocket server
const wss = new WebSocketServer({ server });


wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (raw) => {
        try {
            const msg = JSON.parse(raw.toString()) as ClientMessage;
            routeMessage(ws, msg);
            console.log("routed message:", msg);
        } catch (err) {
            console.error("Error parsing message:", err);
        }
    });

    ws.on("close", () => {
        const id = (ws as any).userId;
        if (id) connectionManager.remove(id);
        console.log("Client disconnected");
    });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Server is running on port ${PORT}`));
