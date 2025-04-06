import {
	Express, Request, Response
} from "express";
import { draftBotMetricsRegistry } from "./DraftBotDiscordMetrics";
import { discordConfig } from "./DraftBotShard";
import { DraftBotLogger } from "../../../Lib/src/logs/Logger";
import express = require("express");

export abstract class DraftBotDiscordWebServer {
	static start(shardId: number): void {
		const app: Express = express();

		app.get("/metrics", async (_req: Request, res: Response) => {
			res.setHeader("Content-Type", draftBotMetricsRegistry.contentType);
			res.end(await draftBotMetricsRegistry.metrics());
		});

		app.post("/log_level", (req: Request, res: Response) => {
			const logger = DraftBotLogger.get();
			if (!req.query.level) {
				res.status(400).send("Missing log level");
				return;
			}
			logger.level = req.query.level.toString();
			logger.info("Log level changed", { logLevel: logger.level });
			res.status(200).send("OK");
		});

		app.listen(discordConfig.WEB_SERVER_PORT + shardId, () => {
			DraftBotLogger.info(`Web server is running on port ${discordConfig.WEB_SERVER_PORT + shardId}`);
		});
	}
}

