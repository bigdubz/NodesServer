import jwt from "jsonwebtoken";

const SECRET = "412b65e0-1b3d-4b70-a12d-86524b0696b1";

export function createBootstrapToken(userId: string) {
    return jwt.sign({ userId }, SECRET, { expiresIn: "10m" });
}

export function createDeviceToken(userId: string, deviceId: string) {
    return jwt.sign({ userId, deviceId }, SECRET, { expiresIn: "30d" });
}

export function verifyBootstrapToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

export function verifyDeviceToken(token: string): { userId: string; deviceId: string } | null {
    try {
        return jwt.verify(token, SECRET) as { userId: string; deviceId: string };
    } catch {
        return null;
    }
}
