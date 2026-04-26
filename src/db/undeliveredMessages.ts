import Database from "better-sqlite3"
import fs from "fs";
import path from "path";
import { createHash } from 'crypto';


const dbPath: string = path.join(process.cwd(), "messages.db");
const schemaPath: string = path.join(process.cwd(), "schema.sql");

const db = new Database(dbPath);

const schema: string = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// prepared statements
const getUndeliveredMessagesStmt = db.prepare(`
    SELECT toUserId, toDeviceId, fromUserId, fromDeviceId, blob, createdAt, blobHash
    FROM undelivered_messages
    WHERE toUserId = ? AND toDeviceId = ?
    ORDER BY createdAt, blobHash
`)

const saveMessageStmt = db.prepare(`
    INSERT OR IGNORE INTO undelivered_messages (
        toUserId,
        toDeviceId,
        fromUserId,
        fromDeviceId,
        blob,
        createdAt,
        blobHash
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const deleteMessageStmt = db.prepare(`
    DELETE FROM undelivered_messages WHERE toUserId = ? AND toDeviceId = ? AND blobHash = ?
`)

function sha256(blob: Buffer): Buffer {
    return createHash("sha256").update(blob).digest();
}

export type MessageRow = {
    toUserId: string;
    toDeviceId: string;
    fromUserId: string;
    fromDeviceId: string;
    blob: Buffer;
    createdAt: number;
    blobHash: Buffer;
}

export const MessageDB = {

    getUndeliveredMessages(toUserId: string, toDeviceId: string): MessageRow[] {
        const rows = getUndeliveredMessagesStmt.all(toUserId, toDeviceId) as MessageRow[];

        return rows.map((r: any) => ({
            toUserId: r.toUserId,
            toDeviceId: r.toDeviceId,
            fromUserId: r.fromUserId,
            fromDeviceId: r.fromDeviceId,
            blob: Buffer.from(r.blob),
            createdAt: r.createdAt,
            blobHash: Buffer.from(r.blobHash),
        }))
    },

    saveTempMessage(
        toUserId: string, toDeviceId: string,
        fromUserId: string, fromDeviceId: string,
        blob: Buffer, createdAt: number
    ): Buffer {
        const hash = sha256(blob);
        saveMessageStmt.run(toUserId, toDeviceId, fromUserId, fromDeviceId, blob, createdAt, hash);
        return hash;
    },

    deleteTempMessage(toUserId: string, toDeviceId:string, blobHash: Buffer): void {
        deleteMessageStmt.run(toUserId, toDeviceId, blobHash);
    }
};
