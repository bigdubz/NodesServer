// Temporary
export const users: Record<string, { password: string }> = {
    userA: { password: "pa" },
    userB: { password: "pb" },
};

export function validateUser(userId: string, password: string): boolean | undefined {
    const user = users[userId];
    return user && user.password === password;
}
