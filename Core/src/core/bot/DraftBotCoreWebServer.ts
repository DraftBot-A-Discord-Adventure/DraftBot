import {
	Express, Request, Response
} from "express";
import {
	botConfig, draftBotInstance
} from "../../index";
import {
	DraftBotCoreMetrics, draftBotMetricsRegistry
} from "./DraftBotCoreMetrics";
import { DraftBotLogger } from "../../../../Lib/src/logs/DraftBotLogger";
import { BlockingUtils } from "../utils/BlockingUtils";
import express = require("express");

export abstract class DraftBotCoreWebServer {
	static start(): void {
		const app: Express = express();

		app.get("/metrics", async (_req: Request, res: Response) => {
			DraftBotCoreMetrics.computeSporadicMetrics();
			res.setHeader("Content-Type", draftBotMetricsRegistry.contentType);
			res.end(await draftBotMetricsRegistry.metrics());
		});

		app.post("/maintenance", (req: Request, res: Response) => {
			const enabled = req.query.enabled === "1";
			draftBotInstance.setMaintenance(enabled, false);
			DraftBotLogger.info("Maintenance mode changed", { enabled });
			res.status(200).send("OK");
		});

		app.get("/blocked_players", (_req: Request, res: Response) => {
			res.status(200).send(BlockingUtils.getBlockedPlayersCount().toString(10));
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

		app.listen(botConfig.WEB_SERVER_PORT, () => {
			DraftBotLogger.info(`Web server is running on port ${botConfig.WEB_SERVER_PORT}`);
		});
	}
}

