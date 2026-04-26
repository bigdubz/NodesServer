import Database from "better-sqlite3"
import fs from "fs";
import path from "path";


const dbPath: string = path.join(process.cwd(), "messages.db");
const schemaPath: string = path.join(process.cwd(), "schema.sql");

const db = new Database(dbPath);

const schema: string = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// prepared statements
const saveMessageStmt = db.prepare(`
    INSERT INTO undelivered_messages (
        toUserId,
        toDeviceId,
        blob,
        createdAt
    ) VALUES (?, ?, ?, ?)
`)

export const MessageDB = {
    // functions that use prepared statements
    saveTempMessage(toUserId: string, toDeviceId: string, blob: Buffer, createdAt: number): void {
        saveMessageStmt.run(toUserId, toDeviceId, blob, createdAt);
    }
};