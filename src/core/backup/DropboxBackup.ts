import {Dropbox, files, users} from "dropbox";
import {IBackupFileSimple, IDraftBotBackup} from "./DraftBotBackup";
import fs = require("fs");
import ListFolderResult = files.ListFolderResult;
import FileMetadataReference = files.FileMetadataReference;
import SpaceAllocationIndividual = users.SpaceAllocationIndividual;

declare const JsonReader: any;

export class DropboxBackup implements IDraftBotBackup {
	name = "DROPBOX";

	private _dropbox: Dropbox;

	async backup(zipPath: string, backupName: string, baseName: string): Promise<void> {
		console.log("Starting to upload " + backupName + " to dropbox...");
		await this._dropbox.filesUpload({
			path: "/" + backupName,
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

	async getAllBackupFiles(): Promise<IBackupFileSimple[]> {
		let hasMore = true;
		let cursor: string = null;
		const files: IBackupFileSimple[] = [];
		while (hasMore) {
			let listFolderResult: ListFolderResult;
			if (cursor) {
				listFolderResult = (await this._dropbox.filesListFolderContinue({
					cursor
				})).result;
			}
			else {
				listFolderResult = (await this._dropbox.filesListFolder({
					path: ""
				})).result;
			}

			for (const file of listFolderResult.entries) {
				if (file[".tag"] === "file") {
					files.push({
						path: file.name,
						size: (file as FileMetadataReference).size
					});
				}
			}
			hasMore = listFolderResult.has_more;
			cursor = listFolderResult.cursor;
		}
		return files;
	}

	async availableSpace(): Promise<number> {
		const spaceUsage = (await this._dropbox.usersGetSpaceUsage()).result;
		// Let's keep a free space of 50Mo
		return Promise.resolve((spaceUsage.allocation as SpaceAllocationIndividual).allocated - spaceUsage.used - 50 * 1024 * 1024);
	}

	async deleteFile(path: string): Promise<void> {
		await this._dropbox.filesDeleteV2({
			path: "/" + path
		});
		return Promise.resolve();
	}
}