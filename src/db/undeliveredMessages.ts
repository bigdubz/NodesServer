import Database from "better-sqlite3"
import fs from "fs";
import path from "path";


const dbPath: string = path.join(process.cwd(), "src/db/messages.db");
const schemaPath: string = path.join(process.cwd(), "src/db/schema.sql");

const db = new Database(dbPath);

const schema: string = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// prepared statements

export const MessageDB = {
    // functions that use prepared statements
};