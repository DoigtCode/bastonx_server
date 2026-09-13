import fs from "fs";

const users = JSON.parse(
    fs.readFileSync("./data/users.json", "utf8")
);

export class User {
    constructor(user_id, login) {
        this.user_id = user_id
        this.login = login;
    }

    static find(user_id) {
        if (users[user_id])
            return users[user_id];
    }

    static register(user_id, login) {
        users[user_id] = new User(user_id, login);
        fs.writeFileSync(
            "./data/users.json",
            JSON.stringify(users, null, 2)
        );
    }
}