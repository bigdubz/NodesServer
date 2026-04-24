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

CREATE TABLE IF NOT EXISTS devices (
    userId TEXT NOT NULL,
    deviceId TEXT NOT NULL,
    registrationId INTEGER NOT NULL, -- Random int to prevent session collisions

    signingKey BLOB NOT NULL,
    identityKey BLOB NOT NULL,       -- The Public Identity Key (IK) for this specific device

    pushToken TEXT,                  -- FCM/APNs token for wake-up calls
    lastSeen INTEGER NOT NULL,

    PRIMARY KEY (userId, deviceId),
    FOREIGN KEY (userId) REFERENCES users(userId)
);

CREATE TABLE IF NOT EXISTS signed_prekeys (
    userId TEXT NOT NULL,
    deviceId TEXT NOT NULL,

    keyId INTEGER NOT NULL,
    publicKey BLOB NOT NULL, -- SPK
    signature BLOB NOT NULL, -- signed by signingPublicKey

    createdAt INTEGER NOT NULL,

    PRIMARY KEY (userId, deviceId, keyId),
    FOREIGN KEY (userId, deviceId)
        REFERENCES devices(userId, deviceId)
);

CREATE TABLE IF NOT EXISTS one_time_prekeys (
    keyId INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT NOT NULL,
    deviceId TEXT NOT NULL,

    publicKey BLOB NOT NULL, -- opk

    FOREIGN KEY (userId, deviceId)
        REFERENCES devices(userId, deviceId)
);

CREATE TABLE IF NOT EXISTS undelivered_messages (
    queueId INTEGER PRIMARY KEY AUTOINCREMENT,

    toUserId TEXT NOT NULL,
    toDeviceId TEXT NOT NULL,

    fromUserId TEXT NOT NULL,
    fromDeviceId TEXT NOT NULL,

    encryptedPayload BLOB NOT NULL, -- The Protobuf message
    createdAt INTEGER NOT NULL,

    FOREIGN KEY (toUserId, toDeviceId)
        REFERENCES devices(userId, deviceId),
    FOREIGN KEY (fromUserId, fromDeviceId)
        REFERENCES devices(userId, deviceId)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_registration ON devices(userId, registrationId);

CREATE INDEX IF NOT EXISTS idx_opk_lookup ON one_time_prekeys(userId, deviceId);

CREATE INDEX IF NOT EXISTS idx_spk_latest ON signed_prekeys(userId, deviceId, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_undelivered_lookup ON undelivered_messages(toUserId, toDeviceId, queueId);

CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages (toUserId);

CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages (fromUserId);

CREATE INDEX IF NOT EXISTS idx_reactions_messageId ON message_reactions(messageId);
