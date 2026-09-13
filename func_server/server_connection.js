import { v4 as uuidv4 } from 'uuid';
import { server_message } from './server_message.js';
import { server_disconnect } from './server_disconnect.js';

export function server_connection(ws, games) {
    ws.id = uuidv4();
    ws.is_bot = false;
    ws.logged_in = false;

    console.log("Nouveau client connecté : " + ws.id);

    ws.on("message", (data) => {
        try {
            server_message(ws, data, games);
        } catch (err) {
            console.error(`Erreur dans server_message pour la data ${data}\n\n${err}`);
        }
    });
    ws.on("close", () => { server_disconnect(ws, games) });
}