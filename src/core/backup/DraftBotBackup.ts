import {registerFormat} from "archiver";
import {DropboxBackup} from "./DropboxBackup";
import {LocalBackup} from "./LocalBackup";
import {botConfig} from "../bot";
import archiver = require("archiver");
import fs = require("fs");
import path = require("path");

export interface IDraftBotBackup {
	name: string;

	create: () => Promise<boolean>;

	backup: (zipPath: string, backupName: string, baseName: string) => Promise<void>;

	getAllBackupFiles: () => Promise<IBackupFileSimple[]>;

	availableSpace: () => Promise<number>;

	deleteFile: (path: string) => Promise<void>;
}

export interface IBackupFileSimple {
	path: string;

	size: number;
}

interface IBackupFile {
	path: string;

	size: number;

	date: Date;
}

export class DraftBotBackup {
	private static _backupInterfaces: IDraftBotBackup[] = [];

	private static BACKUP_TPM_FOLDER = "backups/tmp";

	public static async init(): Promise<void> {
		if (!botConfig.ENABLED_BACKUPS || botConfig.ENABLED_BACKUPS === "") {
			return;
		}
		registerFormat("zip-encryptable", require("archiver-zip-encryptable"));
		const enabledBackups = botConfig.ENABLED_BACKUPS.split(",");
		const backupInterfaces = [new DropboxBackup(), new LocalBackup()];
		for (const backupInterface of backupInterfaces) {
			if (enabledBackups.includes(backupInterface.name)) {
				console.log(`${backupInterface.name} backup enabled`);
				await DraftBotBackup.addBackupInterface(backupInterface);
			}
		}
	}

	public static backupFiles(files: string[], interval: number, archiveBasename: string): void {
		if (DraftBotBackup._backupInterfaces.length === 0) {
			return;
		}
		if (archiveBasename.includes("-") || archiveBasename.includes(".")) {
			console.error(`Can't register "${archiveBasename}", archive base name must not contain - or .`);
			return;
		}
		const callback = function(): void {
			try {
				if (!fs.existsSync(DraftBotBackup.BACKUP_TPM_FOLDER)) {
					fs.mkdirSync(DraftBotBackup.BACKUP_TPM_FOLDER);
				}
				const archiveName = `${archiveBasename}-${new Date().toISOString()
					.replace(new RegExp(/[:.]/, "g"), "-")}.zip`;
				const zipPath = `${DraftBotBackup.BACKUP_TPM_FOLDER}/${archiveName}`;
				const outputZip = fs.createWriteStream(zipPath);
				let archive;
				if (!botConfig.BACKUP_ARCHIVE_PASSWORD || botConfig.BACKUP_ARCHIVE_PASSWORD === "") {
					archive = archiver("zip", {
						zlib: {level: 9}
					});
				}
				else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					archive = archiver("zip-encryptable", {
						zlib: {level: 9},
						password: botConfig.BACKUP_ARCHIVE_PASSWORD
					});
				}
				archive.pipe(outputZip);
				for (const file of files) {
					archive.append(fs.createReadStream(file), {name: path.basename(file)});
				}
				outputZip.on("close", async function() {
					console.log(`Backup archive "${archiveName}" created with success`);
					for (const backupInterface of DraftBotBackup._backupInterfaces) {
						try {
							const availableSpace = await backupInterface.availableSpace();
							if (availableSpace < outputZip.bytesWritten) {
								if (!await DraftBotBackup.removeOldBackups(backupInterface, availableSpace, outputZip.bytesWritten)) {
									continue;
								}
							}
							await backupInterface.backup(zipPath, archiveName, archiveBasename);
						}
						catch (err) {
							console.error(`An error occurred while backing up files ${files} with ${backupInterface.name} :\n${err.stack}`);
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
				console.error(`An error occurred while backing up files ${files} :\n${err.stack}`);
				if (err.error) {
					console.error(err.error);
				}
			}
		};
		setInterval(callback, interval);
		callback();
	}

	public static async removeOldBackups(backupInterface: IDraftBotBackup, availableSpace: number, bytesToWrite: number): Promise<boolean> {
		const backupFiles = DraftBotBackup.convertToBackupFiles(await backupInterface.getAllBackupFiles());
		backupFiles.sort((a: IBackupFile, b: IBackupFile) => {
			if (a.date < b.date) {
				return -1;
			}
			if (a.date > b.date) {
				return 1;
			}
			return 0;
		});
		let i = 0;
		const toDeleteFiles: IBackupFile[] = [];
		while (availableSpace < bytesToWrite && i !== backupFiles.length) {
			toDeleteFiles.push(backupFiles[i]);
			availableSpace += backupFiles[i].size;
			i++;
		}
		if (i === backupFiles.length) {
			console.error(`Cannot write backup with size ${bytesToWrite} in backup ${backupInterface.name}: not enough space available`);
			return Promise.resolve(false);
		}
		for (const toDeleteFile of toDeleteFiles) {
			await backupInterface.deleteFile(toDeleteFile.path);
			console.log(`Deleted backup ${toDeleteFile.path} in ${backupInterface.name}`);
		}
		return Promise.resolve(true);
	}

	private static async addBackupInterface(backupInterface: IDraftBotBackup): Promise<void> {
		if (await backupInterface.create()) {
			DraftBotBackup._backupInterfaces.push(backupInterface);
		}
	}

	private static convertToBackupFiles(simpleBackupFiles: IBackupFileSimple[]): IBackupFile[] {
		const backupFiles: IBackupFile[] = [];
		for (const simpleBackupFile of simpleBackupFiles) {
			const filename = path.parse(simpleBackupFile.path).base;
			const splitBaseName = filename.split(/-(.+)/);
			const splitExtension = splitBaseName[1].split(/[.]/);
			const splitDate = splitExtension[0].split(/[-TZ]/);
			backupFiles.push({
				path: simpleBackupFile.path,
				size: simpleBackupFile.size,
				date: new Date(
					parseInt(splitDate[0]),
					parseInt(splitDate[1]),
					parseInt(splitDate[2]),
					parseInt(splitDate[3]),
					parseInt(splitDate[4]),
					parseInt(splitDate[5]),
					parseInt(splitDate[6]))
			});
		}
		return backupFiles;
	}
}