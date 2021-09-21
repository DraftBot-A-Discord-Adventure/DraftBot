import {registerFormat} from "archiver";
import archiver = require("archiver");
import fs = require("fs");
import path = require("path");
import {DropboxBackup} from "./DropboxBackup";
import {LocalBackup} from "./LocalBackup";

declare const JsonReader: any;

export interface IDraftBotBackup {
	name: string;

	create: () => Promise<boolean>;

	backup: (zipPath: string, backupName: string, baseName: string) => Promise<void>;
}

export class DraftBotBackup {
	private static _backupInterfaces: IDraftBotBackup[] = [];

	private static BACKUP_TPM_FOLDER = "backups/tmp";

	public static async init() {
		if (!JsonReader.app.ENABLED_BACKUPS || JsonReader.app.ENABLED_BACKUPS === "") {
			return;
		}
		registerFormat("zip-encryptable", require("archiver-zip-encryptable"));
		const enabledBackups = JsonReader.app.ENABLED_BACKUPS.split(",");
		const backupInterfaces = [new DropboxBackup(), new LocalBackup()];
		for (const backupInterface of backupInterfaces) {
			if (enabledBackups.includes(backupInterface.name)) {
				console.log(backupInterface.name + " backup enabled");
				await DraftBotBackup.addBackupInterface(backupInterface);
			}
		}
	}

	private static async addBackupInterface(backupInterface: IDraftBotBackup) {
		if (await backupInterface.create()) {
			DraftBotBackup._backupInterfaces.push(backupInterface);
		}
	}

	public static backupFiles(files: string[], interval: number, archiveBasename: string) {
		if (DraftBotBackup._backupInterfaces.length === 0) {
			return;
		}
		const callback = function() {
			try {
				if (!fs.existsSync(DraftBotBackup.BACKUP_TPM_FOLDER)) {
					fs.mkdirSync(DraftBotBackup.BACKUP_TPM_FOLDER);
				}
				const archiveName = archiveBasename + "-" + new Date().toISOString()
					.replace(new RegExp(/[:.]/, "g"), "-") + ".zip";
				const zipPath = DraftBotBackup.BACKUP_TPM_FOLDER + "/" + archiveName;
				const outputZip = fs.createWriteStream(zipPath);
				let archive;
				if (!JsonReader.app.BACKUP_ARCHIVE_PASSWORD || JsonReader.app.BACKUP_ARCHIVE_PASSWORD === "") {
					archive = archiver("zip", {
						zlib: {level: 9}
					});
				}
				else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					archive = archiver("zip-encryptable", {
						zlib: {level: 9},
						password: JsonReader.app.BACKUP_ARCHIVE_PASSWORD
					});
				}
				archive.pipe(outputZip);
				for (const file of files) {
					archive.append(fs.createReadStream(file), {name: path.basename(file)});
				}
				outputZip.on("close", async function() {
					console.log("Backup archive \"" + archiveName + "\" created with success");
					for (const backupInterface of DraftBotBackup._backupInterfaces) {
						try {
							await backupInterface.backup(zipPath, archiveName, archiveBasename);
						}
						catch (err) {
							console.error("An error occurred while backing up files " + files + " with " + backupInterface.name + " :\n" + err.stack);
							if (err.error) {
								console.error(err.error);
							}
						}
					}
					fs.unlinkSync(zipPath);
				});
				archive.finalize();
			}
			catch (err) {
				console.error("An error occurred while backing up files " + files + " :\n" + err.stack);
				if (err.error) {
					console.error(err.error);
				}
			}
		};
		setInterval(callback, interval);
		callback();
	}
}