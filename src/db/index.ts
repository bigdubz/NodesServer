import type { MessageRow } from "../types.js"
import Database from "better-sqlite3"
import fs from "fs";
import path from "path";


// resolve paths
const dbPath = path.join(process.cwd(), "src/db/messages.db");
const schemaPath = path.join(process.cwd(), "src/db/schema.sql");

const db = new Database(dbPath);

const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// Prepared statements
const insertMessageStmt = db.prepare(`
    INSERT INTO messages (messageId, fromUserId, toUserId, text, createdAt, delivered, seen)
    VALUES (@messageId, @fromUserId, @toUserId, @text, @createdAt, 0, 0)
`);

const markDeliveredStmt = db.prepare(`
    UPDATE messages SET delivered = 1 WHERE messageId = ?
`);

const markReadStmt = db.prepare(`
    UPDATE messages SET seen = 1 WHERE messageId = ?
`);

const getUndeliveredStmt = db.prepare(`
    SELECT * FROM messages
    WHERE toUserId = ? AND delivered = 0
    ORDER BY createdAt ASC
`);

const getConversationStmt = db.prepare(`
    SELECT * FROM messages
    WHERE (fromUserId = @userA AND toUserId = @userB)
       OR (fromUserId = @userB AND toUserId = @userA)
    ORDER BY createdAt ASC
`);

export const MessageDB = {
    saveMessage(message: {
        messageId: string;
        fromUserId: string;
        toUserId: string;
        text: string;
        createdAt: number;
    }): void {
        insertMessageStmt.run(message);
    },

    markDelivered(messageId: string): void {
        markDeliveredStmt.run(messageId);
    },

    markSeen(messageId: string): void {
        markReadStmt.run(messageId);
    },

    getUndeliveredMessages(userId: string): MessageRow[] {
        return getUndeliveredStmt.all(userId) as MessageRow[];
    },

    getConversation(userA: string, userB: string): MessageRow[] {
        return getConversationStmt.all({ userA, userB }) as MessageRow[];
    }
};