import express from "express";
import http from 'http';
import cors from 'cors'

import { matchRouter } from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commantry.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:3000', // Allow only requests from this origin
    methods: 'GET,POST', // Allow only these methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow only these headers
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send('Hello from express server!');
});

app.use(securityMiddleware())

app.use('/matches/:id/commentary', commentaryRouter);
app.use('/matches', matchRouter);

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`

    console.log(`Server is running on ${baseUrl}`);
    console.log(`Websocket is running on ${baseUrl.replace('http', 'ws')}/ws`);

});