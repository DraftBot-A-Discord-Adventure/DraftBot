import {IDraftBotBackup} from "./DraftBotBackup";
import fs = require("fs");

export class LocalBackup implements IDraftBotBackup {
	name = "LOCAL";

	private static LOCAL_PATH = "backups";

	backup(zipPath: string, backupName: string, baseName: string): Promise<void> {
		const folder = LocalBackup.LOCAL_PATH + "/" + baseName;
		if (!fs.existsSync(folder)) {
			fs.mkdirSync(folder);
		}
		fs.copyFileSync(zipPath, folder + "/" + backupName);
		console.log("Local backup of \"" + backupName + "\" done");
		return Promise.resolve();
	}

	create(): Promise<boolean> {
		if (!fs.existsSync(LocalBackup.LOCAL_PATH)) {
			fs.mkdirSync(LocalBackup.LOCAL_PATH);
		}
		return Promise.resolve(true);
	}
}