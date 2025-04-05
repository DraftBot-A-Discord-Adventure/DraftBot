import {
	createLogger, format, Logger, transports
} from "winston";
import "winston-daily-rotate-file";
import { Constants } from "../constants/Constants";

const myFormatWithLabel = format.printf(({
	level, message, label, timestamp
}) =>
	`${timestamp} [${label}] [${level.toUpperCase()}]: ${message}`);

const myFormat = format.printf(({
	level, message, timestamp
}) =>
	`${timestamp} [${level.toUpperCase()}]: ${message}`);

export abstract class DraftBotLogger {
	private static logger: Logger;

	public static init(level: string, locations: string[], label?: string): void {
		const transportsList = [];
		for (const location of locations) {
			switch (location) {
				case "console":
					transportsList.push(new transports.Console());
					break;
				case "file":
					transportsList.push(new transports.DailyRotateFile({
						filename: `${Constants.LOGS.FILE_BASE_PATH}/%DATE%.log`,
						datePattern: "YYYY-MM-DD",
						zippedArchive: Constants.LOGS.FILE_ZIPPED_ARCHIVE,
						maxSize: Constants.LOGS.FILE_MAX_SIZE,
						maxFiles: Constants.LOGS.FILE_RETENTION
					}));
					break;
				default:
					throw new Error(`Unknown log location: ${location}`);
			}
		}

		const formatToUse = label
			? format.combine(
				format.label({ label }),
				format.timestamp({
					format: "YYYY-MM-DD HH:mm:ss.SSS"
				}),
				myFormatWithLabel
			)
			: format.combine(
				format.timestamp({
					format: "YYYY-MM-DD HH:mm:ss.SSS"
				}),
				myFormat
			);

		this.logger = createLogger({
			level,
			format: formatToUse,
			transports: transportsList
		});
	}

	public static get(): Logger {
		if (!this.logger) {
			throw new Error("Logger not initialized");
		}
		return this.logger;
	}

	public static isInitialized(): boolean {
		return Boolean(this.logger);
	}
}
