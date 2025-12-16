import type { MessageRow, ConversationRow } from "../types.js"
import { connectionManager } from "../connectionManager.js"
import Database from "better-sqlite3"
import fs from "fs";
import path from "path";


const dbPath: string = path.join(process.cwd(), "src/db/messages.db");
const schemaPath: string = path.join(process.cwd(), "src/db/schema.sql");

const db = new Database(dbPath);

const schema: string = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);


const insertMessageStmt = db.prepare(`
    INSERT INTO messages (messageId, fromUserId, toUserId, text, createdAt, delivered, seen, replyingTo)
    VALUES (@messageId, @fromUserId, @toUserId, @text, @createdAt, 0, 0, @replyingTo)
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

const setReactionStmt = db.prepare(`
    INSERT INTO message_reactions (messageId, userId, reaction) VALUES (@messageId, @userId, @reaction)
`)

const removeReactionStmt = db.prepare(`
    DELETE FROM message_reactions WHERE messageId = @messageId AND userId = @userId
`)

const getMessagesStmt = db.prepare(`
    SELECT
        m.*,
        json_group_object(r.userId, r.reaction)
            FILTER (WHERE r.userId IS NOT NULL) AS reactions
    FROM messages m
             LEFT JOIN message_reactions r
                       ON r.messageId = m.messageId
    WHERE
        (
            (m.fromUserId = @me AND m.toUserId = @them)
                OR
            (m.fromUserId = @them AND m.toUserId = @me)
            )
      AND m.createdAt < @before
    GROUP BY m.messageId
    ORDER BY m.createdAt DESC
        LIMIT @limit;
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

interface MessageRowDB {
    messageId: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    createdAt: number;
    delivered: number;
    seen: number;
    replyingTo: string | null;
    reactions: string | null; // 👈 JSON string from SQLite
}

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

    markDelivered(messageId: string): void {
        markDeliveredStmt.run(messageId);
    },

    markSeen(messageId: string): void {
        markSeenStmt.run(messageId);
    },

    getUndeliveredMessages(userId: string): MessageRow[] {
        return getUndeliveredStmt.all(userId) as MessageRow[];
    },

    getMessages(me: string, them: string, before: number, limit: number): MessageRowDB[] {
        const rows: MessageRowDB[] = getMessagesStmt.all({ me, them, before, limit }) as MessageRowDB[];
        return rows.map(row => ({
            ...row,
            reactions: row.reactions
                ? JSON.parse(row.reactions)
                : null
        }))
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
            const peerId: string = p.peerId;

            const last = getLastMessageStmt.get(userId, peerId, peerId, userId) as {
                text: string;
                createdAt: number;
            }

            const unread = countUnreadStmt.get(peerId, userId) as { unreadCount: number };
            const isOnline: boolean = connectionManager.has(peerId)

            return {
                peerId,
                lastMessage: last?.text ?? "",
                lastTimestamp: last?.createdAt ?? 0,
                unreadCount: unread.unreadCount,
                isOnline
            }
        })
    },

    setReaction(messageId: string, userId: string, reaction: string): void {
        setReactionStmt.run({ messageId, userId, reaction });
    },

    removeReaction(messageId: string, userId: string): void {
        removeReactionStmt.run({ messageId, userId });
    }
};