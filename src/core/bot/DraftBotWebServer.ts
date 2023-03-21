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
	app.post("/maintenance", function requestHandler(req, res) {
		ipcServer.broadcastMaintenance(req.query.enable === "1");

		res.status(200);
		res.end("OK");
	});

	// Start the web server
	app.listen(port);
	console.log(`Web server running at http://0.0.0.0:${port}`);
}