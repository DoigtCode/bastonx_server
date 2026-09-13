import { Fight } from "../src/fight.js";
import { Game, GAME_PHASE } from "../src/game.js";
import { Shop } from "../src/shop.js";
import { broadcast, REQ, sendRequest } from "./request.js";

export function server_message(ws, _data, games) {
    let data_struct;
    let data;
    _data = _data.toString().replace(/\0/g, "");
    
    try {
        data_struct = JSON.parse(_data);
        data = data_struct.data;
    } catch (err) {
        return console.warn("JSON invalide : " + err);
    }

    if (!ws) return console.warn("Message reçu par un websocket null");

    switch (data_struct.req_id) {
        case REQ.GAME_CREATE:
            var new_game = Game.create_game(ws, games, data.host_id, data.host_key);
            sendRequest(ws, REQ.GAME_CREATE, new_game);
            break;
        case REQ.GAME_JOIN:
            var join_game = Game.join_game(ws, games, ws.user.login, data.code, data.host_key)
            if (join_game) {
                broadcast(join_game.players, REQ.GAME_JOIN, join_game);
                sendRequest(join_game.host, REQ.GAME_JOIN, {join_game : join_game, join_player : Game.find_player_by_player(ws.id, games)});
            } else {
                sendRequest(ws, REQ.GAME_JOIN, join_game);
            }
            break;
        case REQ.GAME_START:
            var game = Game.find_game_by_ws(ws, games);
            game.start_game();
            break;
        case REQ.FIGHT_START:
            var game = Game.find_game_by_ws(ws, games);
            game.phase_fight();
            break;
        case REQ.FIGHT_RESULTS:
            var game = Game.find_game_by_ws(ws, games);
            var fight = new Fight();

            game.phase = GAME_PHASE.WAITING;

            fight.groups = data.groups;
            fight.group_i = data.group_i;
            fight.group_fighter_i = data.group_fighter_i;
            fight.history_verdict(games);
            game.eliminate_players();
            if (game.active_players().length == 1) {
                game.end_game(games);
            }
            break;
        case REQ.FIGHT_BONUS_DELETE:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_fighter(data.fighter_id, games);
            player.fighter.delete_bonus(data.bonus);
            break;
        case REQ.FIGHT_STATS_CHANGE:
            var player = Game.find_player_by_fighter(data.fighter_id, games);
            player.fighter.stat_up(data.stat_name, data.value, data.is_percent);
            break;
        case REQ.SHOP_START:
            var game = Game.find_game_by_ws(ws, games);
            game.phase_shop();
            break;
        case REQ.SHOP_BUY:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_player(ws.id, games);
            var is_buy = game.shop.buy(player, data.article_id);

            if (!is_buy) {
                sendRequest(ws, REQ.SHOP_BUY, { is_buy: false, game: game });
            } else {
                broadcast(game.players, REQ.SHOP_BUY, { is_buy: true, player_buy: player, article_id: data.article_id, game: game });
                sendRequest(game.host, REQ.SHOP_BUY, { player_buy: player, article_id: data.article_id, game: game });
            }
            break;
        case REQ.SHOP_SELL:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_player(ws.id, games);
            var is_sell = game.shop.sell(player, data.bonus_id);

            if (!is_sell) {
                sendRequest(ws, REQ.SHOP_SELL, { is_sell: false, game: game });
            } else {
                broadcast(game.players, REQ.SHOP_SELL, { is_sell: true, player_sell: player, bonus_id: data.bonus_id, game: game });
                sendRequest(game.host, REQ.SHOP_SELL, { player_sell: player, bonus_id: data.bonus_id, bonus_index: data.bonus_index, game: game });
            }
            break;
        case REQ.SHOP_LEVEL_UP:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_player(ws.id, games);
            var is_level_up = game.shop.level_up(player);

            if (!is_level_up) {
                sendRequest(ws, REQ.SHOP_LEVEL_UP, { is_level_up: false, game: game });
            } else {
                broadcast(game.players, REQ.SHOP_LEVEL_UP, { is_level_up: true, player_level_up: player, game: game });
                sendRequest(game.host, REQ.SHOP_LEVEL_UP, { player_level_up: player, game: game });
            }
            break;
        case REQ.SHOP_SWAP:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_player(ws.id, games);
            var is_swap = player.fighter.swap_bonus(data.bonus_id_1, data.bonus_id_2);

            if (!is_swap) {
                sendRequest(ws, REQ.SHOP_SWAP, { is_swap: false, game: game });
            } else {
                broadcast(game.players, REQ.SHOP_SWAP, { is_swap: true, swap_player: player, game: game });
                sendRequest(game.host, REQ.SHOP_SWAP, { swap_player: player, game: game });
            }
            break;
        case REQ.SHOP_MOVE:
            var game = Game.find_game_by_ws(ws, games);
            var player = Game.find_player_by_player(ws.id, games);
            var is_move = player.fighter.move_bonus(data.bonus_id, data.target_index);

            if (!is_move) {
                sendRequest(ws, REQ.SHOP_MOVE, { is_move: false, game: game });
            } else {
                broadcast(game.players, REQ.SHOP_MOVE, { is_move: true, move_player: player, game: game });
                sendRequest(game.host, REQ.SHOP_MOVE, { move_player: player, game: game });
            }
            break;
    }
}