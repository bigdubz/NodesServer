import type { MessageRow, ConversationRow } from "../types.js"
import { connectionManager } from "../connectionManager.js"
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
    INSERT INTO messages (messageId, fromUserId, toUserId, text, createdAt, delivered, seen, replyingTo)
    VALUES (@messageId, @fromUserId, @toUserId, @text, @createdAt, 0, 0, @replyingTo)
`);

const getMessageStmt = db.prepare(`
    SELECT * FROM messages WHERE messageId = ?
`);

const markDeliveredStmt = db.prepare(`
    UPDATE messages SET delivered = 1 WHERE messageId = ?
`);

const markSeenStmt = db.prepare(`
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

const getMessagesStmt = db.prepare(`
    SELECT *
    FROM messages
    WHERE 
        (
            (fromUserId = @me AND toUserId = @them)
            OR
            (fromUserId = @them AND toUserId = @me)
        )
        AND createdAt < @before
    ORDER BY createdAt DESC
    LIMIT @limit
`);

const getSenderStmt = db.prepare(`
    SELECT fromUserId
    FROM messages
    WHERE messageId = ?
`);

const getPeersStmt = db.prepare(`
    SELECT DISTINCT
        CASE
            WHEN fromUserId = ? THEN toUserId
            ELSE fromUserId
        END AS peerId
    FROM messages
    WHERE fromUserId = ? OR toUserId = ?
`);

const getLastMessageStmt = db.prepare(`
    SELECT text, createdAt
    FROM messages
    WHERE (fromUserId = ? AND toUserId = ?)
       OR (fromUserId = ? AND toUserId = ?)
    ORDER BY createdAt DESC
    LIMIT 1
`);

const countUnreadStmt = db.prepare(`
    SELECT COUNT(*) AS unreadCount
    FROM messages
    WHERE fromUserId = ?
      AND toUserId = ?
      AND seen = 0
`);


export const MessageDB = {
    saveMessage(message: {
        messageId: string;
        fromUserId: string;
        toUserId: string;
        text: string;
        createdAt: number;
        replyingTo: string | null;
    }): void {
        insertMessageStmt.run(message);
    },

    getMessage(messageId: string): MessageRow {
        return getMessageStmt.get(messageId) as MessageRow;
    },

    markDelivered(messageId: string): void {
        markDeliveredStmt.run(messageId);
    },

    markSeen(messageId: string): void {
        markSeenStmt.run(messageId);
    },

    getUndeliveredMessages(userId: string): MessageRow[] {
        return getUndeliveredStmt.all(userId) as MessageRow[];
    },

    getConversation(userA: string, userB: string): MessageRow[] {
        return getConversationStmt.all({ userA, userB }) as MessageRow[];
    },

    getMessages(me: string, them: string, before: number, limit: number): MessageRow[] {
        return getMessagesStmt.all({ me, them, before, limit }) as unknown as MessageRow[];
    },

    getSenderOfMessage(messageId: string): string {
        const row = getSenderStmt.get(messageId) as MessageRow;
        if (!row) {
            throw new Error("Message not found: " + messageId);
        }

        return row.fromUserId;
    },

    getConversations(userId: string): ConversationRow[] {
        const peers = getPeersStmt.all(userId, userId, userId) as { peerId: string }[];

        return peers.map(p => {
            const peerId = p.peerId;

            const last = getLastMessageStmt.get(userId, peerId, peerId, userId) as {
                text: string;
                createdAt: number;
            }

            const unread = countUnreadStmt.get(peerId, userId) as { unreadCount: number };
            const isOnline = connectionManager.has(peerId)

            return {
                peerId,
                lastMessage: last?.text ?? "",
                lastTimestamp: last?.createdAt ?? 0,
                unreadCount: unread.unreadCount,
                isOnline
            }
        })
    }
};