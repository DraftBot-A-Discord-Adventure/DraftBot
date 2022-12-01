import {collectDefaultMetrics, Registry} from "prom-client";
import express = require("express");
import {Express} from "express";

export const prometheusRegistry: Registry = new Registry();

export function initPrometheus(defaultPort: number, shardId: number): void {
	// Collect default prometheus data
	collectDefaultMetrics({ register: prometheusRegistry });

	// Expose metrics on port default + shardId with express
	const server: Express = express();
	const serverPort = defaultPort + shardId;
	server.get("/metrics", async (req, res) => {
		try {
			res.set("Content-Type", prometheusRegistry.contentType);
			res.end(await prometheusRegistry.metrics());
		}
		catch (ex) {
			res.status(500).end(ex);
		}
	});
	server.listen(serverPort);
	console.log("Prometheus metrics exposed on port " + serverPort);
}