class DraftBot {

  static async init() {
    await (require('core/JsonReader')).init({
      folders: ['ressources/text/commands'],
      files: [
        'config/app.json',
        'draftbot/package.json',
        'ressources/text/values.json',
        'ressources/text/console.json',
        'ressources/text/effect.json',
      ],
    });
    await (require('core/Repository')).init();

    // TODO 2.1
    // draftbot.checkEasterEggsFile();

    // this.command = new (require('core/Command'))(); // TODO 2.0
    this.discord = (require('discord.js'));
    this.client = new (require('discord.js')).Client();

    // await this.command.init(); // TODO 2.0
    await this.client.login(JsonReader.app.DISCORD_CLIENT_TOKEN);
    return this;
  }

  /**
   * TODO 2.1
   * Checks if the easter eggs file exists and copy the default one if not
   */
  // checkEasterEggsFile() {
  //
  //   let EasterEggs = require("./src/utils/eastereggs/EasterEggs");
  //   EasterEggs.init();
  //
  //   const fs = require('fs');
  //   if (!fs.existsSync('./src/utils/eastereggs/EasterEggs.js')) {
  //     fs.copyFileSync('./src/utils/eastereggs/EasterEggs.js.default',
  //         './src/utils/eastereggs/EasterEggs.js', (err) => {
  //           if (err) throw err;
  //         });
  //     console.warn(
  //         './src/utils/eastereggs/EasterEggs.js not found. ./src/utils/eastereggs/EasterEggs.js.default copied to be used.');
  //     console.warn(
  //         'Ignore this message if you don\'t have the key to decrypt the file.');
  //   }
  // }

}

module.exports = {
  init: DraftBot.init
};
