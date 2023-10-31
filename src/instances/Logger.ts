import * as fs from "fs";
import {WriteStream} from "fs";

export class Logger {
	private static instances: Map<string, Logger> = new Map<string, Logger>();

	public mode: "file" | "console" = "file";

	private readonly suffix: string;

	private readonly canWrite: boolean = null;

	private creationDate: Date;

	private fileStream: WriteStream;

	private constructor(suffix: string) {
		this.creationDate = new Date();
		this.suffix = suffix;
		if (!fs.existsSync("./logs")) {
			fs.mkdirSync("./logs");
		}
		try {
			this.fileStream = fs.createWriteStream(this.getName(), {flags: "w"});
			this.fileStream.write(this.getLogStart());
		}
		catch (e) {
			console.error(`LOGGER INIT ERROR : ${e}`);
			this.canWrite = false;
		}
		finally {
			this.canWrite = true;
			process.on("uncaughtException", (err) => {
				this.log(`Uncaught exception : ${err.stack}`);
			});
		}
	}

	static getInstance(suffix: string): Logger {
		if (!Logger.instances.has(suffix)) {
			Logger.instances.set(suffix, new Logger(suffix));
		}
		return Logger.instances.get(suffix);
	}

	public log(loggedText: string): void {
		if (this.canWrite === null) {
			// The logger is not ready yet, wait 1 second and try again
			setTimeout(() => {
				this.log(loggedText);
			}, 1000);
			return;
		}
		if (!this.canWrite) {
			// The logger can't write to file cause of an error
			console.log(`LOGGER ERROR : Can't write to file ${this.getName()}`);
			return;
		}
		const toSave = `${loggedText}\n----------------------------------------`;
		if (this.mode === "console") {
			console.log(`[${new Date().toLocaleString()}] {${this.suffix}} ${toSave}`);
			return;
		}
		this.fileStream.write( `[${new Date().toLocaleString()}] ${toSave}\n`, (err) => {
			if (err) {
				console.error(`LOGGER ERROR : ${err}`);
			}
		});
	}

	private getLogStart(): string {
		const center = `###  ${this.suffix} - ${this.creationDate.toLocaleString()}  ###`;
		const inBetween = `###${" ".repeat(center.length - 6)}###`;
		const top = "#".repeat(center.length);
		return `${top}\n${top}\n${inBetween}\n${inBetween}\n${center}\n${inBetween}\n${inBetween}\n${top}\n${top}\n\n`;
	}

	private getName(): string {
		return `./logs/${
			this.suffix}_${
			this.creationDate.getFullYear()}-${this.creationDate.getMonth() + 1}-${this.creationDate.getDate()}_${
			this.creationDate.getHours()}-${this.creationDate.getMinutes()}-${this.creationDate.getSeconds()}.log`;
	}
}