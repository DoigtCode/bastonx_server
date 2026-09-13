import { Game } from "../src/game.js";

export function server_disconnect(ws, games) {
    const game = Game.find_game_by_ws(ws, games);
    const player = Game.find_player_by_player(ws.id, games);

    if (!game) {
        console.log("Client déconnecté des ws (room non rejointe)");
        return;
    }

    if (ws.id === game.host.id) {
        console.log(`Le host ${ws.id} a quitté la game ${game.code}`);
        game.host_afk = true;
    } else {
        console.log(`Le joueur ${ws.id} a quitté la game ${game.code}`);

        if (!game.has_started) {
            game.players = game.players.filter(p => p.ws !== ws);
            if (game.players.length <= 0 && game.host_afk) {
                games.delete(game.ID);
                console.log(`Game ${game.code} supprimée (vide)`);
            }
        } else {
            player.isAfk = true;
        }
    }
}