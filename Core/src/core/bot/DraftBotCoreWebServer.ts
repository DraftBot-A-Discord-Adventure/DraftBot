import {
	Express, Request, Response
} from "express";
import { botConfig } from "../../index";
import { draftBotMetricsRegistry } from "./DraftBotCoreMetrics";
import express = require("express");

export abstract class DraftBotCoreWebServer {
	static start(): void {
		const app: Express = express();

		app.get("/metrics", async (_req: Request, res: Response) => {
			res.setHeader("Content-Type", draftBotMetricsRegistry.contentType);
			res.end(await draftBotMetricsRegistry.metrics());
		});

		app.listen(botConfig.WEB_SERVER_PORT, () => {
			console.log(`Web server is running on port ${botConfig.WEB_SERVER_PORT}`);
		});
	}
}

