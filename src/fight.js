import { broadcast, REQ, sendRequest } from "../func_server/request.js";
import { Game } from "./game.js";

export class Fight {
    constructor() {
        this.groups = [];
        this.group_i = 0.
        this.group_fighter_i = 0;
    }

    create_groups(game, players) {
        var nb_players = players.length;
        var possible_groups = [];

        for (var i = 2; i <= nb_players; i++) {
            if (nb_players % i == 0)
                possible_groups.push(i);
        }

        var i_try = 0;
        var nb_per_group;
        do {
            nb_per_group = possible_groups[
                Math.floor(Math.random() * possible_groups.length)
            ];
            i_try++;
        } while (nb_per_group == game.fight_last_comb && i_try < 10)
        game.fight_last_comb = nb_per_group;

        var shuffled = [...players].sort(() => Math.random() - 0.5);
        var groups = [];

        for (var i = 0; i < nb_players; i += nb_per_group) {
            groups.push({ fighters: shuffled.slice(i, i + nb_per_group), fighters_history: [] });
        }

        this.groups = groups;
    }

    history_verdict(games) {
        console.log("Fin du combat")
        var verdict = [];
        for (var i_group = 0; i_group < this.groups.length; i_group++) { // Un round
            var history_size = this.groups[i_group].fighters_history.length
            for (var i_history = 0; i_history < history_size; i_history++) { // Un joueur
                var history = this.groups[i_group].fighters_history[i_history];
                var player = Game.find_player_by_fighter(history.id, games);
                var game = Game.find_game_by_ws(player.ws, games);

                var place = history.place;

                // Perte de score
                var health_lost = 0;
                var health_lost_max = Math.min(30, game.nb_rounds*5); // dernier
                var health_lost_min = Math.min(5, game.nb_rounds);  // 2e

                var t = Math.max(1, place - 2) / Math.max(1, history_size - 2);
                health_lost = Math.round(health_lost_min + (health_lost_max - health_lost_min) * Math.pow(t, 2));

                if (place == 1)
                    health_lost = 0;

                if (history.winner) {
                    health_lost = -5;
                    player.win_streak = Math.max(1, player.win_streak + 1);
                } else {
                    player.win_streak = Math.min(-1, player.win_streak - 1);
                }

                player.health -= health_lost;

                // Gain de thune
                var money_gain = Math.min(5, game.nb_rounds); // Base
                money_gain += (player.win_streak > 0 ? player.win_streak * 3 : -player.win_streak); // Streaks
                money_gain += Math.min(10, (game.player_health - player.health) / game.player_health * 5) // Bonus classement
                money_gain += Math.floor(player.money / 10); // Intérêts
                money_gain = Math.round(money_gain);

                player.money += money_gain;

                /*console.log(`Joueur ${player.pseudo} - Place ${place}
                    Score : ${player.health} (${-health_lost})
                    Money : ${player.money} (+${money_gain})`)*/
            }
        }
        broadcast(game.players, REQ.GAME_UPDATE, game);
        sendRequest(game.host, REQ.FIGHT_RESULTS, game);
    }


}