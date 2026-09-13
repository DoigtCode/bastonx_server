import { WebSocketServer } from "ws";
import express from "express";
import { createServer } from "http";
import { server_connection } from "./func_server/server_connection.js";
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { REQ, sendRequest } from "./func_server/request.js";
import { User } from "./src/user.js";
import { Bonus } from "./src/bonus.js";

const PORT = 9090;
const app = express();

const states = new Map();

dotenv.config();

// Routes Express
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Serveur OK !");
});

app.get("/auth/twitch", (req, res) => {
    const { state } = req.query;

    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        redirect_uri: "https://bastonx.com/auth/twitch/callback",
        response_type: "code",
        scope: "openid",
        state: state
    });

    res.redirect(
        "https://id.twitch.tv/oauth2/authorize?" +
        params.toString()
    );
});

app.get("/auth/twitch/callback", async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send("Code Twitch manquant");
    }

    const response = await fetch(
        "https://id.twitch.tv/oauth2/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: "https://bastonx.com/auth/twitch/callback"
            })
        }
    );

    const tokens = await response.json();

    const validateResponse = await fetch(
        "https://id.twitch.tv/oauth2/validate",
        {
            headers: {
                "Authorization": `Bearer ${tokens.access_token}`
            }
        }
    );

    const twitchUser = await validateResponse.json();

    var user = User.find(twitchUser.user_id);
    if (user) {
        console.log("Joueur trouvé dans la DB : " + user.login);
    } else {
        console.log("Inscription du joueur à la DB : " + twitchUser.login);
        User.register(twitchUser.user_id, twitchUser.login);
        user = User.find(twitchUser.user_id);
    }

    states.get(state).logged_in = true;
    states.get(state).user = user;

    res.send("Vous pouvez revenir sur le jeu !");
    console.log(`${twitchUser.login} connecté !`);

    sendRequest(states.get(state), REQ.LOG_CONFIRM, { user : user});
});

app.get("/auth/twitch/confirm", (req, res) => {
    res.send("Vous pouvez revenir sur le jeu !");
});

// Serveur HTTP
const server = createServer(app);

// Serveur WebSocket
const wss = new WebSocketServer({ server });

const games = new Map();

wss.on("connection", (ws) => {
    const state = uuidv4();
    states.set(state, ws);
    sendRequest(ws, REQ.LOG_STATE, { generated_state: state });
    server_connection(ws, games);
});

// Démarrage
server.listen(PORT, () => {
    console.clear();
    console.log(`HTTP + WebSocket sur le port ${PORT}`);
});


