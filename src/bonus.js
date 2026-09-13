import fs from "fs";
import { choose } from "../func/util.js";

const bonuses = JSON.parse(
    fs.readFileSync("./data/bonus.json", "utf8")
);

const buffs = JSON.parse(
    fs.readFileSync("./data/buff.json", "utf8")
);

const bonusesById = Object.fromEntries(
    bonuses.map(bonus => [bonus.id, bonus])
);

const buffsById = Object.fromEntries(
    buffs.map(buff => [buff.id, buff])
);

export class Bonus {
    static find(id) {
        var found = bonusesById[id];
        if (found && Object.hasOwn(found.stats, "buff") && typeof found.stats.buff === "string")
                found.stats.buff = Bonus.find_buff(found.stats.buff);
        return found;
    }
    static find_random() {
        const found = bonuses[Math.floor(Math.random() * bonuses.length)];
        if (found && Object.hasOwn(found.stats, "buff") && typeof found.stats.buff === "string")
                found.stats.buff = Bonus.find_buff(found.stats.buff);
        return found;
    }
    static find_buff(id) {
        return buffsById[id];
    }
    static find_rarety(rarety) {
        var arr = [];
        for (const bonus of bonuses) {
            if (bonus.rarety == rarety)
                arr.push(bonus);
        }
        return choose(arr);
    }
}