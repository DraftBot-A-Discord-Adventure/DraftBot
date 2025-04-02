import * as fs from "fs";
import { WriteStream } from "fs";
import { Constants } from "../constants/Constants";

enum LogWritingState {
	BUILDING,
	READY,
	ERROR
}

export class Logger {
	private static instances: Map<string, Logger> = new Map<string, Logger>();

	public mode: "file" | "console" = "file";

	private readonly suffix: string;

	private creationDate: Date | null = null;

	private fileStream: & WriteStream | null = null;

	private lineCount: number = 0;

	private currentListener: ((err: Error) => void) | null = null;

	private canWrite: LogWritingState | null = null;

	private constructor(suffix: string) {
		this.suffix = suffix;
		if (!fs.existsSync(Constants.LOGS.BASE_PATH)) {
			fs.mkdirSync(Constants.LOGS.BASE_PATH);
		}
		this.buildNewFileStream();
	}

	static getInstance(suffix: string): Logger {
		if (!Logger.instances.has(suffix)) {
			Logger.instances.set(suffix, new Logger(suffix));
		}
		return Logger.instances.get(suffix)!;
	}

	public log(loggedText: string): void {
		if (this.canWrite === LogWritingState.ERROR) {
			return;
		}
		if (this.canWrite === LogWritingState.BUILDING || !this.fileStream!.writable) {
			console.error("Can't write to log file (the file is not ready or the permission is denied)");
			console.error(`Logged text : ${loggedText}`);
			return;
		}
		const toSave = `${loggedText}\n----------------------------------------`;
		if (this.mode === "console") {
			console.log(`[${new Date().toLocaleString()}] {${this.suffix}} ${toSave}`);
			return;
		}
		this.lineCount++;
		if (this.lineCount > Constants.LOGS.LOG_COUNT_LINE_LIMIT) {
			this.lineCount = 0;
			process.removeListener("uncaughtException", this.currentListener!);
			this.fileStream!.end();
			this.buildNewFileStream();
			this.log(loggedText);
			return;
		}
		this.fileStream!.write(`[${new Date().toLocaleString()}] ${toSave}\n`, err => {
			if (err) {
				const eString = err.toString();
				if (eString.includes("ERR_STREAM_WRITE_AFTER_END") || eString.includes("ERR_STREAM_DESTROYED")) {
					setTimeout(() => {
						this.log(loggedText);
					}, 1000);
					return;
				}
				console.error(`LOGGER ERROR : ${err}`);
			}
		});
	}

	private buildNewFileStream(): void {
		this.canWrite = LogWritingState.BUILDING;
		this.creationDate = new Date();
		try {
			this.fileStream = fs.createWriteStream(this.getName(), { flags: "w" });
			this.fileStream.write(this.getLogStart());
		}
		catch (e) {
			console.error(`LOGGER INIT ERROR : ${e}`);
			this.canWrite = LogWritingState.ERROR;
		}
		finally {
			const newListener = (err: Error): void => {
				this.log(`Uncaught exception : ${err.stack}`);
			};
			process.on("uncaughtException", newListener);
			this.currentListener = newListener;
			this.canWrite = LogWritingState.READY;
		}
	}

	private getLogStart(): string {
		const center = `###  ${this.suffix} - ${this.creationDate!.toLocaleString()}  ###`;
		const inBetween = `###${" ".repeat(center.length - 6)}###`;
		const top = "#".repeat(center.length);
		return `${top}\n${top}\n${inBetween}\n${inBetween}\n${center}\n${inBetween}\n${inBetween}\n${top}\n${top}\n\n`;
	}

	private getName(): string {
		return `${Constants.LOGS.BASE_PATH}/${
			this.suffix}_${
			this.creationDate!.getFullYear()}-${this.creationDate!.getMonth() + 1}-${this.creationDate!.getDate()}_${
			this.creationDate!.getHours()}-${this.creationDate!.getMinutes()}-${this.creationDate!.getSeconds()}.log`;
	}
}
