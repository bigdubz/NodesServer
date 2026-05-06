import Database from "better-sqlite3"
import path from "path";
import type {BundleStatusResponse, UserKeyBundle, UserKeyBundleResponse} from "../types";
import { ONE_TIME_PREKEY_TARGET, MAX_ONE_TIME_PREKEYS_PER_UPLOAD, SIGNED_PREKEY_MAX_AGE_MS } from "../constants";


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

const getBundleStatusDeviceStmt = db.prepare(`
    SELECT registrationId, signingKey, identityKey, lastSeen
    FROM devices
    WHERE userId = ? AND deviceId = ?
`);

const getBundleStatusLatestSpkStmt = db.prepare(`
    SELECT keyId, createdAt
    FROM signed_prekeys
    WHERE userId = ? AND deviceId = ?
    ORDER BY createdAt DESC
    LIMIT 1
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
        bundle.sk,
        bundle.ik,
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
                bundle.spk,
                bundle.spkSignature,
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
            opk
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

const getBundleTx = db.transaction((userId: string, deviceId: string): UserKeyBundleResponse => {
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

        sk: device.signingKey,
        ik: device.identityKey,

        spk: spk.publicKey,
        spkSignature: spk.signature,

        opk: opk
            ? {
                keyId: opk.keyId,
                publicKey: opk.publicKey
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

type BundleStatusDeviceRow = DeviceRow & {
    lastSeen: number;
};

type BundleStatusSpkRow = {
    keyId: number;
    createdAt: number;
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
                existing.signingKey.equals(bundle.sk) &&
                existing.identityKey.equals(bundle.ik)

            if (!same) {
                throw new Error("Identity key mismatch");
            }
        }

        saveBundleTx(bundle, pushToken);
    },

    getBundleStatus(userId: string, deviceId: string): BundleStatusResponse {
        const now = Date.now();

        const device = getBundleStatusDeviceStmt.get(userId, deviceId) as BundleStatusDeviceRow | undefined;
        const spk = getBundleStatusLatestSpkStmt.get(userId, deviceId) as BundleStatusSpkRow | undefined;
        const { count } = countStmt.get(userId, deviceId) as { count: number };

        const bundleMissing = !device || !spk;

        const signedPrekeyCreatedAt = spk?.createdAt ?? 0;

        return {
            userId,
            deviceId,
            bundleMissing,

            oneTimePrekeyCount: count,
            oneTimePrekeyTarget: ONE_TIME_PREKEY_TARGET,
            maxOneTimePrekeysPerUpload: MAX_ONE_TIME_PREKEYS_PER_UPLOAD,

            signedPrekeyStale: !spk || now - signedPrekeyCreatedAt > SIGNED_PREKEY_MAX_AGE_MS,
            signedPrekeyId: spk?.keyId ?? 0,
            signedPrekeyCreatedAt,

            lastBundleUploadAt: signedPrekeyCreatedAt || device?.lastSeen || 0,
            serverTime: now
        }
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
