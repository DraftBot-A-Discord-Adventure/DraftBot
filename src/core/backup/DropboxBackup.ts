import {Dropbox} from "dropbox";
import {IDraftBotBackup} from "./DraftBotBackup";
import fs = require("fs");

declare const JsonReader: any;

export class DropboxBackup implements IDraftBotBackup {
	name = "DROPBOX";

	private _dropbox: Dropbox;

	async backup(zipPath: string, backupName: string, baseName: string): Promise<void> {
		console.log("Starting to upload " + backupName + " to dropbox...");
		await this._dropbox.filesUpload({
			path: "/" + baseName + "/" + backupName,
			contents: fs.readFileSync(zipPath)
		});
		console.log("Dropbox backup of \"" + backupName + "\" done");
	}

	async create(): Promise<boolean> {
		if (!JsonReader.app.DROPBOX_TOKEN || JsonReader.app.DROPBOX_TOKEN === "") {
			console.log("Dropbox access token not set so there will not be any database remote backup");
			return Promise.resolve(false);
		}
		const dropbox = new Dropbox({
			accessToken: JsonReader.app.DROPBOX_TOKEN
		});
		try {
			await dropbox.usersGetSpaceUsage();
		}
		catch (err) {
			console.error("Unable to connect to Dropbox. Your token may be wrong or the bot is unable to reach the dropbox api : \n" + err.stack);
			return Promise.resolve(false);
		}
		this._dropbox = dropbox;
		return Promise.resolve(true);
	}
}