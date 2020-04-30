const fs = require('fs');

class JsonText {

  /**
   * @param {String[]} folders - Folders to load
   * @param {String[]} files - Files to load
   * @return {Promise<JsonText>}
   */
  async init({folders, files}) {
    for (const folder of folders) {
      await this.loadFolder(folder);
    }
    for (const file of files) {
      await this.loadFile(file);
    }

    return this;
  }

  /**
   * @param {String} folder
   * @return {Promise<void>}
   */
  async loadFolder(folder) {
    let files = await fs.promises.readdir(folder);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      let folderName = folder.split('/')[folder.split('/').length - 1];
      let fileName = (file.split('.')[0]).split('/')[(file.split('.')[0]).split('/').length - 1];
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
  async loadFile(file) {
    if (!file.endsWith('.json')) return;
    let fileName = (file.split('.')[0]).split('/')[(file.split('.')[0]).split('/').length - 1];
    this[fileName] = (require(file));
    if (this[fileName].hasOwnProperty('translations')) {
      this[fileName].getTranslation = this.getTranslation;
    }
  }

  /**
   * @param {String} language
   * @return {Object}
   */
  getTranslation(language) {
    return this.translations[language];
  }

}

module.exports.JsonText = JsonText;
