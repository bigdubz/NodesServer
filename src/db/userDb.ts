import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "src/db/messages.db");
const db = new Database(dbPath);

// Prepared statements
const getUserStmt = db.prepare(`
    SELECT userId, passwordHash FROM users WHERE userId = ?
`);

const insertUserStmt = db.prepare(`
    INSERT INTO users (userId, passwordHash) VALUES (?, ?)
`);

export const UserDB = {
    getUser(userId: string): { userId: string; passwordHash: string } | undefined {
        return getUserStmt.get(userId) as {
            userId: string;
            passwordHash: string;
        } | undefined;
    },

    createUser(userId: string, passwordHash: string): void {
        insertUserStmt.run(userId, passwordHash);
    }
};