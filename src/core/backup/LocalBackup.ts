import {IBackupFileSimple, IDraftBotBackup} from "./DraftBotBackup";
import fs = require("fs");
import {Constants} from "../Constants";

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

	getAllBackupFiles(): Promise<IBackupFileSimple[]> {
		const backupFiles: IBackupFileSimple[] = [];
		const directories = fs.readdirSync(LocalBackup.LOCAL_PATH).filter(function(file) {
			return fs.statSync(LocalBackup.LOCAL_PATH + "/" + file).isDirectory() && file !== "tmp";
		});
		for (const backupDirectory of directories) {
			for (const file of fs.readdirSync(LocalBackup.LOCAL_PATH + "/" + backupDirectory)) {
				const path = LocalBackup.LOCAL_PATH + "/" + backupDirectory + "/" + file;
				const stat = fs.statSync(path);
				if (stat.isFile()) {
					backupFiles.push({
						path,
						size: stat.size
					});
				}
			}
		}
		return Promise.resolve(backupFiles);
	}

	async availableSpace(): Promise<number> {
		const backupFiles = await this.getAllBackupFiles();
		let size = 0;
		for (const backupFile of backupFiles) {
			size += backupFile.size;
		}
		return Constants.BACKUP.LOCAL_SPACE_LIMIT - size;
	}

	deleteFile(path: string): Promise<void> {
		fs.unlinkSync(path);
		return Promise.resolve();
	}
}