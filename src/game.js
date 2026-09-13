import { v4 as uuidv4 } from 'uuid';
import "dotenv/config";
import { Player } from './player.js';
import { broadcast, REQ, sendRequest } from '../func_server/request.js';
import { Fight } from './fight.js';
import { Shop } from './shop.js';
import { Bonus } from './bonus.js';
import { choose } from '../func/util.js';

export const GAME_PHASE = {
    LOBBY: 0,
    TIRAGE: 1,
    FIGHT: 2,
    SHOP: 3,
    END: 4,
    WAITING: 5
}

export class Game {
    constructor(host) {
        this.host = host
        this.players = [];
        this.scoreboard = [];

        this.shop = new Shop();

        this.fight_last_comb = -1;

        this.has_started = false;
        this.host_afk = false;

        this.player_limit = 12;
        this.player_health = 100;

        this.phase = GAME_PHASE.LOBBY;
        this.nb_rounds = 0;

        this.id = uuidv4();
        this.code = Game.generate_code();
    }

    toJSON() {
        return {
            players : this.players,
            has_started: this.has_started,
            host_afk: this.host_afk,
            player_limit: this.player_limit,
            player_health: this.player_health,
            code: this.code,
            phase: this.phase,
            shop: this.shop
        }
    }

    static generate_code() {
        const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
        let code = "";
        for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    static find_game_by_player(id, games) {
        for (const game of games.values()) {
            if (game.players.some(p => p.ws.id === id))
                return game;
        }
        return null;
    }

    static find_game_by_ws(ws, games) {
        for (const game of games.values()) {
            if (game.players.some(p => p.ws === ws)) return game;
            if (game.host.id === ws.id) return game;
        }
        return null;
    }

    static find_player_by_player(id, games) {
        for (const game of games.values()) {
            const player = game.players.find(p => p.ws.id === id);
            if (player) return player;
        }
        return null;
    }

    static find_player_by_fighter(fighter_id, games) {
        for (const game of games.values()) {
            const player = game.players.find(p => p.fighter?.id === fighter_id);
            if (player) return player;
        }
        return null;
    }

    static create_game(ws, games, host_id, host_key) {
        if (process.env.HOST_KEY !== host_key) {
            console.log("Clé de HOST invalide");
            exit;
        }

        ws.id = host_id;
        const game = new Game(ws);
        games.set(game.id, game);
        console.log(`Game créée : ${JSON.stringify(game.code)}`);
        return game;
    }

    static join_game(ws, games, join_pseudo = "", code = "", host_key = "") {
        let join_game = -1;
        const player = new Player(ws);
        player.pseudo = join_pseudo;

        for (const game of games.values()) {
            if (game.code === code) {
                if (game.players.some(p => (p.ws.id === ws.id || p.ws.user.user_id === ws.user.user_id)))
                    return -1;

                join_game = game;
            } 
        }

        if (join_game == -1 || this.has_started)
            return -1;

        join_game.players.push(player);
        console.log(`${join_pseudo} a rejoint une game : ${JSON.stringify(join_game.code)}`);
        return join_game;
    }

    start_game() {
        var not_selected = [];
        this.phase = GAME_PHASE.TIRAGE;

        if (this.players.length <= 1)
            for (let index = 0; index < this.player_limit; index++) {
                this.players.push(new Player({ id: uuidv4(), isBot: true }));
            }
        
        while (this.players.length > this.player_limit) {
            const index = Math.floor(Math.random() * this.players.length);
            not_selected.push(this.players[index]);
            this.players.splice(index, 1);
        }
        
        for (let index = 0; index < this.players.length; index++) { // Variables transmises
            this.players[index].index = index;
            this.players[index].fighter.index = index;
            this.players[index].fighter.team = this.players[index].team;

            //this.players[index].fighter.add_bonus(Bonus.find_random());
        }
        //SUPPRIMER
        //this.players[0].pseudo = "doigt"
        //this.players[0].fighter.add_bonus(Bonus.find("rune_warrior"));
                
        this.has_started = true; 

        broadcast(this.players, REQ.GAME_START, this);
        sendRequest(this.host, REQ.GAME_START, this)
        broadcast(not_selected, REQ.GAME_ELIMINATED);

        console.log("Game lancée");

        setTimeout(() => {
            this.phase_fight();
        }, 500)
    }

    phase_fight() {
        this.phase = GAME_PHASE.FIGHT;
        this.nb_rounds++;
        var fight = new Fight();
        fight.create_groups(this, this.active_players());
        sendRequest(this.host, REQ.FIGHT_START, fight);
        broadcast(this.players, REQ.FIGHT_START);
        console.log("Phase de combat");
    }

    phase_shop() {
        this.phase = GAME_PHASE.SHOP;
        this.shop.refresh(this);

        sendRequest(this.host, REQ.SHOP_START, this);
        broadcast(this.players, REQ.SHOP_START, this);

        this.shop.unlock(this);

        setTimeout(() => {
            this.phase = GAME_PHASE.WAITING;
            this.shop.lock(this);
        }, this.shop.duration)

        console.log("Phase de boutique");
    }

    end_game(games) {
        broadcast(this.players, REQ.GAME_END, {});
        sendRequest(this.host, REQ.GAME_END, { scoreboard: this.scoreboard, winner: this.active_players() });
        games.delete(this.id);
        
        console.log("Partie terminée ! Suppression de la room " + this.code);
    }

    active_players() {
        return this.players.filter(player => !player.is_death);
    }

    eliminate_players() {
        const players_sorted = [...this.active_players()].sort((a, b) => a.health - b.health);
        for (const player of players_sorted) {
            if (player.health <= 0) {
                player.is_death = true;
                this.scoreboard.push(player);
                sendRequest(player.ws, REQ.PLAYER_KICK, {});
                player.ws = null;
            }
        }
    }
}