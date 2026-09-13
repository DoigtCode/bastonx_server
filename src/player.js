import { generate_pseudo } from "../func/util.js";
import { Bonus } from "./bonus.js";
import { Fighter } from "./fighter.js";

export class Player {
    constructor(ws) {
        this.fighter = new Fighter();
        this.health = 100;
        this.money = 0;
        this.win_streak = 0;

        this.pseudo = generate_pseudo(6);
        this.ws = ws;
        this.index = 0;
        this.team = this.pseudo;

        this.is_afk = false;
        this.is_death = false;
        this.shop_lock = true;
    }

    toJSON() {
        return {
            fighter : this.fighter,
            health: this.health,
            pseudo: this.pseudo,
            is_afk: this.is_afk,
            is_death : this.is_death,
            index: this.index,
            team: this.team,
            money: this.money,
            shop_lock: this.shop_lock,
            win_streak : this.win_streak
        }
    }
}