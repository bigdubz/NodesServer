import Database from "better-sqlite3"
import path from "path";
import type {UserKeyBundle} from "../types";


const dbPath: string = path.join(process.cwd(), "src/db/messages.db");
const db = new Database(dbPath);

// prepared statements
// save bundle
const insertDeviceStmt = db.prepare(`
    INSERT INTO devices (
        userId,
        deviceId,
        registrationId,
        signingKey,
        identityKey,
        pushToken,
        lastSeen
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId, deviceId) DO UPDATE SET
        lastSeen = excluded.lastSeen,
        pushToken = excluded.pushToken
`);

const insertSpkStmt = db.prepare(`
    INSERT INTO signed_prekeys (
        userId,
        deviceId,
        keyId,
        publicKey,
        signature,
        createdAt
    ) VALUES (?, ?, ?, ?, ?, ?) 
`);

const insertOpkStmt = db.prepare(`
    INSERT INTO one_time_prekeys (
        userId,
        deviceId,
        publicKey
    ) VALUES (?, ?, ?)
`);

const getExistingDeviceStmt = db.prepare(`
    SELECT signingKey, identityKey
    FROM devices
    WHERE userId = ? AND deviceId = ?
`);

const countStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM one_time_prekeys
    WHERE userId = ? AND deviceId = ?
`);

const saveBundleTx = db.transaction((bundle: UserKeyBundle, pushToken?: string) => {
    const now = Date.now();

    insertDeviceStmt.run(
        bundle.userId,
        bundle.deviceId,
        bundle.registrationId,
        Buffer.from(bundle.sk, "base64"),
        Buffer.from(bundle.ik, "base64"),
        pushToken ?? null,
        now
    );

    let spkId: number;
    let inserted = false;

    while (!inserted) {
        spkId = generateSpkId();
        try {
            insertSpkStmt.run(
                bundle.userId,
                bundle.deviceId,
                spkId,
                Buffer.from(bundle.spk, "base64"),
                Buffer.from(bundle.spkSignature, "base64"),
                now
            );
            inserted = true;
        } catch (err) {
            // retry
        }
    }

    const { count } = countStmt.get(bundle.userId, bundle.deviceId) as { count: number };

    if (count > 1000) {
        throw new Error("Too many OPKs");
    }

    for (const opk of bundle.opks) {
        insertOpkStmt.run(
            bundle.userId,
            bundle.deviceId,
            Buffer.from(opk, "base64")
        );
    }
});

// fetch bundle
const getDevicesForUserStmt = db.prepare(`
    SELECT deviceId
    FROM devices
    WHERE userId = ?
`);

const getDeviceStmt = db.prepare(`
    SELECT registrationId, signingKey, identityKey
    FROM devices
    WHERE userId = ? AND deviceId = ?
`);

const getLatestSpkStmt = db.prepare(`
    SELECT keyId, publicKey, signature
    FROM signed_prekeys
    WHERE userId = ? AND deviceId = ?
    ORDER BY createdAt DESC
    LIMIT 1
`)

const getOneOpkStmt = db.prepare(`
    SELECT keyId, publicKey
    FROM one_time_prekeys
    WHERE userId = ? AND deviceId = ?
    ORDER BY keyId
    LIMIT 1
`);

const deleteOpkStmt = db.prepare(`
    DELETE FROM one_time_prekeys
    WHERE keyId = ?
`)

const getBundleTx = db.transaction((userId: string, deviceId: string) => {
    const device = getDeviceStmt.get(userId, deviceId) as DeviceRow | undefined;
    if (!device) {
        throw new Error("Device not found");
    }

    const spk = getLatestSpkStmt.get(userId, deviceId) as SignedPrekeyRow | undefined;
    if (!spk) {
        throw new Error("Signed Prekey not found");
    }

    const opk = getOneOpkStmt.get(userId, deviceId) as OneTimePrekeyRow | undefined;
    if (opk) {
        deleteOpkStmt.run(opk.keyId);
    }

    return {
        userId,
        deviceId,
        registrationId: device.registrationId,

        sk: device.signingKey.toString("base64"),
        ik: device.identityKey.toString("base64"),

        spk: spk.publicKey.toString("base64"),
        spkSignature: spk.signature.toString("base64"),

        opk: opk
            ? {
                keyId: opk.keyId,
                publicKey: opk.publicKey.toString("base64")
              }
            : null
    }
});

function generateSpkId(): number {
    return Math.floor(Math.random() * 2 ** 31);
}

type DeviceRow = {
    registrationId: number;
    signingKey: Buffer;
    identityKey: Buffer;
};

type SignedPrekeyRow = {
    publicKey: Buffer;
    signature: Buffer;
};

type OneTimePrekeyRow = {
    keyId: number;
    publicKey: Buffer;
};

export const BundlesDB = {
    saveBundle(bundle: UserKeyBundle, pushToken?: string): void {

        const existing = getExistingDeviceStmt.get(bundle.userId, bundle.deviceId) as DeviceRow | undefined;

        if (existing) {
            const same =
                existing.signingKey.equals(Buffer.from(bundle.sk, "base64")) &&
                existing.identityKey.equals(Buffer.from(bundle.ik, "base64"))

            if (!same) {
                throw new Error("Identity key mismatch");
            }
        }

        saveBundleTx(bundle, pushToken);
    },

    getBundles(userId: string) {
        const rows = getDevicesForUserStmt.all(userId) as { deviceId: string }[];

        const bundles = [];

        for (const row of rows) {
            try {
                const bundle = getBundleTx(userId, row.deviceId);
                bundles.push(bundle);
            } catch (err) {
                // skip broken device
            }
        }

        return bundles;
    }
};

