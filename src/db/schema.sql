CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    passwordHash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    messageId TEXT PRIMARY KEY,
    fromUserId TEXT NOT NULL,
    toUserId TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    delivered INTEGER NOT NULL DEFAULT 0,
    seen INTEGER NOT NULL DEFAULT 0,
    replyingTo TEXT NULL,
    reaction NVARCHAR(10) NULL,
    FOREIGN KEY (replyingTo) REFERENCES messages(messageId) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages (toUserId);

CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages (fromUserId);

