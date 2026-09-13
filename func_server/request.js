import { Game } from "../src/game.js";

export const REQ = {
    LOG_STATE: 0,
    LOG_CONFIRM: 1,
    GAME_CREATE:2,
    GAME_JOIN: 3,
    GAME_START: 4,
    GAME_ELIMINATED: 5,
    GAME_UPDATE: 6,
    GAME_END: 7,
    FIGHT_START: 8,
    FIGHT_RESULTS: 9,
    FIGHT_BONUS_DELETE: 10,
    FIGHT_STATS_CHANGE: 11,
    SHOP_START: 12,
    SHOP_BUY: 13,
    SHOP_UNLOCK: 14,
    SHOP_LEVEL_UP: 15,
    SHOP_SELL: 16,
    SHOP_SWAP: 17,
    SHOP_MOVE: 18,
    PLAYER_KICK: 19
}

export function sendRequest(ws, req_id, data = {}) {
    if (ws && ws.readyState === ws.OPEN && !ws.isBot) {
        ws.send(JSON.stringify({
            req_id,  // identifiant de la requête
            data     // données associées
        }));
    } else {
        //console.warn("Impossible d'envoyer, ws fermé ou non ouvert");
    }
}

export function broadcast(players, req_id, data = {}) {
    try {
        for (const player of players) {
            sendRequest(player.ws, req_id, data);
        }
    } catch (err) {
        console.log(`Broadcast échoué : ${err}`);
    }
}