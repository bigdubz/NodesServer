import bcrypt from "bcrypt";
import { UsersTable } from "./usersTable";

async function main() {
    const userId = "userB";
    const password = "pb";

    const hash = await bcrypt.hash(password, 10);
    UsersTable.createUser(userId, hash);
    console.log("User created:", userId);
}

main();