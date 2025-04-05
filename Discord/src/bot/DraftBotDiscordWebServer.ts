import {
	Express, Request, Response
} from "express";
import { draftBotMetricsRegistry } from "./DraftBotDiscordMetrics";
import { discordConfig } from "./DraftBotShard";
import express = require("express");

export abstract class DraftBotDiscordWebServer {
	static start(shardId: number): void {
		const app: Express = express();

		app.get("/metrics", async (_req: Request, res: Response) => {
			res.setHeader("Content-Type", draftBotMetricsRegistry.contentType);
			res.end(await draftBotMetricsRegistry.metrics());
		});

		app.listen(discordConfig.WEB_SERVER_PORT + shardId, () => {
			console.log(`Web server is running on port ${discordConfig.WEB_SERVER_PORT + shardId}`);
		});
	}
}

