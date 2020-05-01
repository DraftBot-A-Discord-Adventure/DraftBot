const fs = require('fs');

class JsonReader {

  /**
   * @param {String[]} folders - Folders to load
   * @param {String[]} files - Files to load
   * @return {Promise<void>}
   */
  static async init({folders, files}) {
    if (folders !== undefined && typeof folders[Symbol.iterator] === "function") {
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
    let files = await fs.promises.readdir(folder);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      let folderName = folder.split('/')[folder.split('/').length - 1];
      let fileName = (file.split('.')[0]).split('/')[(file.split('.')[0]).split(
          '/').length - 1];
      this[folderName] = {};
      this[folderName][fileName] = (require(`${folder}/${file}`));
      if (this[folderName][fileName].hasOwnProperty('translations')) {
        this[folderName][fileName].getTranslation = this.getTranslation;
      }
    }
  }

  /**
   * @param {String} file
   * @return {Promise<void>}
   */
  static async loadFile(file) {
    if (!file.endsWith('.json')) return;
    let fileName = (file.split('.')[0]).split('/')[(file.split('.')[0]).split(
        '/').length - 1];
    this[fileName] = (require(file));
    if (this[fileName].hasOwnProperty('translations')) {
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

module.exports = {
  init: JsonReader.init
};
global.JsonReader = JsonReader;
