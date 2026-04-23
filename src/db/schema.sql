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

CREATE TABLE IF NOT EXISTS message_reactions (
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    reaction NVARCHAR(10) NOT NULL,
    PRIMARY KEY (messageId, userId),
    FOREIGN KEY (messageId) REFERENCES messages(messageId) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_bundles (
    userId TEXT PRIMARY KEY,
    deviceId INTEGER NOT NULL,
    identityKey BLOB NOT NULL,
    signedPreKey BLOB NOT NULL,
    preKeySignature BLOB NOT NULL,   -- Signature of SPK using private IK
    lastUpdated INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS devices (
    userId TEXT NOT NULL,
    deviceId INTEGER NOT NULL,       -- Small int (1, 2, 3...)
    registrationId INTEGER NOT NULL, -- Random int to prevent session collisions
    identityKey BLOB NOT NULL,       -- The Public Identity Key (IK) for this specific device
    pushToken TEXT,                  -- FCM/APNs token for wake-up calls
    lastSeen INTEGER NOT NULL,
    PRIMARY KEY (userId, deviceId),
    FOREIGN KEY (userId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS one_time_prekeys (
    keyId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    deviceId INTEGER NOT NULL,
    preKey BLOB NOT NULL,            -- OPK (Public)
    isUsed INTEGER DEFAULT 0,        -- 1 = Alice took it, don't give to anyone else
    FOREIGN KEY (userId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS undelivered_messages (
    queueId INTEGER PRIMARY KEY AUTOINCREMENT,
    toUserId TEXT NOT NULL,
    toDeviceId INTEGER NOT NULL,    -- The specific device this blob is for
    fromUserId TEXT NOT NULL,
    fromDeviceId INTEGER NOT NULL,  -- Who sent it
    encryptedPayload BLOB NOT NULL, -- The Protobuf message
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (toUserId, toDeviceId) REFERENCES devices(userId, deviceId)
);

CREATE INDEX IF NOT EXISTS idx_otk_user ON one_time_prekeys(userId) WHERE isUsed = 0;

CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages (toUserId);

CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages (fromUserId);

CREATE INDEX IF NOT EXISTS idx_reactions_messageId ON message_reactions(messageId);
