const fs = require("fs");

/**
 * @class
 */
class JsonReader {
	/**
	 * @param {String[]} folders - Folders to load
	 * @param {String[]} files - Files to load
	 * @return {Promise<void>}
	 */
	static async init({folders, files}) {
		if (folders !== undefined && typeof folders[Symbol.iterator] ===
			"function") {
			for (const folder of folders) {
				await JsonReader.loadFolder(folder);
			}
		}
		if (files !== undefined && typeof files[Symbol.iterator] === "function") {
			for (const file of files) {
				await JsonReader.loadFile(file);
			}
		}
	}

	/**
	 * @param {String} folder
	 * @return {Promise<void>}
	 */
	static async loadFolder(folder) {
		const files = await fs.promises.readdir(folder);
		for (const file of files) {
			if (!file.endsWith(".json")) {continue;}
			const folderName = folder.split("/")[folder.split("/").length - 1];
			const fileName = file.split(".")[0].split("/")[file.split(
				".")[0].split(
				"/").length - 1];
			if (this[folderName] === undefined) {
				this[folderName] = {};
			}
			this[folderName][fileName] = require(`${folder}/${file}`);
			if (Object.prototype.hasOwnProperty.call(this[folderName][fileName], "translations")) {
				this[folderName][fileName].getTranslation = JsonReader.getTranslation;
			}
		}
	}

	/**
	 * @param {String} file
	 * @return {Promise<void>}
	 */
	static loadFile(file) {
		if (!file.endsWith(".json")) {return;}
		const fileName = file.split(".")[0].split("/")[file.split(".")[0].split(
			"/").length - 1];
		this[fileName] = require(file);
		if (Object.prototype.hasOwnProperty.call(this[fileName], "translations")) {
			this[fileName].getTranslation = JsonReader.getTranslation;
		}
	}

	/**
	 * @param {("fr"|"en")} language
	 * @return {Object}
	 */
	static getTranslation(language) {
		return this.translations[language];
	}
}

/**
 * @type {{init: JsonReader.init}}
 */
module.exports = {
	init: JsonReader.init,
};
/**
 * @type {JsonReader}
 */
global.JsonReader = JsonReader;
