import { Bonus } from "./bonus.js";
import { v4 as uuidv4 } from 'uuid';
import { Player } from "./player.js";
import { broadcast, REQ, sendRequest } from "../func_server/request.js";
import { choose, choose_rarety } from "../func/util.js";

export class Shop {
    constructor() {
        this.rareties = [80, 16, 3, 1];
        this.rareties_final = [35, 45, 15, 5];
        this.nb_articles = 6;
        this.articles = [];
        this.duration = 60000;
    }

    refresh(game) {
        this.articles = [];
        for (var i = 0; i < this.nb_articles; i++) {
            var random_rarety = choose_rarety(this.get_rareties(game.nb_rounds/15));
            this.articles.push(new Article(Bonus.find_rarety(random_rarety).id, 4-random_rarety));
        }
    }

    unlock(game) {
        const players_sorted = [...game.active_players()].sort((a, b) => a.health - b.health);
        const delays = [5000, 15000, 25000, 35000];
        const count = players_sorted.length;

        const get_delay = (index) => {
            if (index === 0) {
                return delays[0];
            }
            if (index === count - 1) {
                return delays[3];
            }
            if (index < Math.ceil(count / 2)) {
                return delays[1];
            }
            return delays[2];
        };


        for (const [index, player] of players_sorted.entries()) {
            const delay = get_delay(index);
            sendRequest(player.ws, REQ.SHOP_UNLOCK, {shop_lock : true, delay : delay});
            setTimeout(() => {
                player.shop_lock = false;
                sendRequest(player.ws, REQ.SHOP_UNLOCK, {shop_lock : false});
                sendRequest(game.host, REQ.SHOP_UNLOCK, player.pseudo);
            }, delay)
        }
    }

    lock(game) {
        for (const player of game.active_players()) {
            player.shop_lock = true;
        }
        broadcast(game.players, REQ.GAME_UPDATE, game);
        sendRequest(game.host, REQ.GAME_UPDATE, game);
    }

    find(article_id) {
        for (const article of this.articles) {
            if (article.id === article_id) return article;
        }
        return null;
    }

    buy(player, article_id) {
        var article = this.find(article_id);
        if (article && !player.is_death && !player.shop_lock && player.money >= article.bonus.price && article.stock > 0) {
            if (player.fighter.add_bonus(article.bonus)) {
                article.stock--;
                player.money -= article.bonus.price;
                return true;
            }
        }
        return false;
    }

    sell(player, bonus_id) {
        const existing_bonus = player.fighter.bonus.find(b => b.id === bonus_id);
        if (!existing_bonus) return false;
        player.money += existing_bonus.stock;
        player.fighter.delete_bonus(existing_bonus, existing_bonus.stock);
        return true;
    }
    
    level_up(player) {
        var fighter = player.fighter;
        if (player.money >= fighter.level_price) {
            player.money -= fighter.level_price;
            fighter.level++;
            fighter.level_price = Math.round(fighter.level_price * 1.8);
            return true;
        }
        return false;
    }

    get_rareties(progress) {
        return this.rareties.map((value, i) => {
            return value + (this.rareties_final[i] - value) * progress;
        });
    }
}

export class Article {
    constructor(bonus_id, stock) {
        this.bonus = Bonus.find(bonus_id);
        this.stock = stock;
        this.id = uuidv4();
    }
}