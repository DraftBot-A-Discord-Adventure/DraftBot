import {Express} from "express";
import express = require("express");
import {IPCServer} from "./ipc/IPCServer";

/**
 * Init a web server
 * This web server exposes features to be called from outside the bot
 * @param port
 * @param ipcServer
 */
export function initWebServer(port: number, ipcServer: IPCServer): void {
	const app: Express = express();

	// Set maintenance mode
	app.post("/maintenance", (req, res) => {
		ipcServer.broadcastMaintenance(req.query.enable === "1", false);

		res.status(200);
		res.end("OK");
	});

	// Get the count of blocked players
	app.get("/blocked_players", (req, res) => {
		res.status(200).send(ipcServer.getBlockedPlayersCount().toString(10));

	});

	// Start the web server
	app.listen(port);
	console.log(`Web server running at http://0.0.0.0:${port}`);
}