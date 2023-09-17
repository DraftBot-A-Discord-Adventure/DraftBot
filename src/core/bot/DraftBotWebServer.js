"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebServer = void 0;
var express = require("express");
/**
 * Init a web server
 * This web server exposes features to be called from outside the bot
 * @param port
 * @param ipcServer
 */
function initWebServer(port, ipcServer) {
    var app = express();
    // Set maintenance mode
    app.post("/maintenance", function (req, res) {
        ipcServer.broadcastMaintenance(req.query.enable === "1", false);
        res.status(200);
        res.end("OK");
    });
    // Get the count of blocked players
    app.get("/blocked_players", function (req, res) {
        res.status(200).send(ipcServer.getBlockedPlayersCount().toString(10));
    });
    // Start the web server
    app.listen(port);
    console.log("Web server running at http://0.0.0.0:".concat(port));
}
exports.initWebServer = initWebServer;
