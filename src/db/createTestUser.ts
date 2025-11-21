import bcrypt from "bcrypt";
import { UserDB } from "./userDb.js";

async function main() {
    const userId = "userB";
    const password = "pb";

    const hash = await bcrypt.hash(password, 10);
    UserDB.createUser(userId, hash);
    console.log("User created:", userId);
}

main();