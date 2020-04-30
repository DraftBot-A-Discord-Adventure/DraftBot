class DraftBot {

  constructor() {
    this.repositories = new Map();
    this.repository = new (require('core/Repository'))();
    this.command = new (require('core/Command'))();
    this.discord = (require('discord.js'));
    this.client = new (require('discord.js')).Client();

    (async () => {
      await (require('core/JsonReader')).init({
        folders: ['ressources/text/commands'],
        files: [
          'config/app.json',
          'ressources/text/console.json',
          'draftbot/package.json',
        ],
      });

      await this.repository.init();
      await this.command.init();
      await this.client.login(JsonText.app.DISCORD_CLIENT_TOKEN);
    })();
  }

  /**
   * @param {String} repository - The repository to get
   * @return An instance of the repository asked
   */
  getRepository(repository) {
    return this.repositories.get(repository);
  }

  /**
   * @return {Command}
   */
  getCommand() {
    return this.command;
  }

  // TODO 2.1 Question checkEasterEggsFile should be implemented but maybe not here

  /**
   * Checks if the easter eggs file exists and copy the default one if not
   */
  checkEasterEggsFile() {

    // let EasterEggs = require("./src/utils/eastereggs/EasterEggs");
    // EasterEggs.init();

    const fs = require('fs');
    if (!fs.existsSync('./src/utils/eastereggs/EasterEggs.js')) {
      fs.copyFileSync('./src/utils/eastereggs/EasterEggs.js.default',
          './src/utils/eastereggs/EasterEggs.js', (err) => {
            if (err) throw err;
          });
      console.warn(
          './src/utils/eastereggs/EasterEggs.js not found. ./src/utils/eastereggs/EasterEggs.js.default copied to be used.');
      console.warn(
          'Ignore this message if you don\'t have the key to decrypt the file.');
    }
  }

}

module.exports = DraftBot;
