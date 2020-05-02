class DraftBot {

  static async init() {
    await (require('core/JsonReader')).init({
      folders: ['ressources/text/commands', 'ressources/text/entities'],
      files: [
        'config/app.json',
        'draftbot/package.json',
        'ressources/text/error.json',
        'ressources/text/bot.json',
        'ressources/text/values.json',
        'ressources/text/effect.json',
      ],
    });
    await (require('core/Repository')).init();
    await (require('core/Command')).init();

    // TODO 2.1
    // draftbot.checkEasterEggsFile();

    return this;
  }

  // TODO 2.0
  // //trigger of change week : Update weeklyScore value to 0 for each player and reset weekly top.
  // setInterval(async function () { // Set interval for checking
  //   await checkTopWeek();
  // }, 50000);

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

global.discord = (require('discord.js'));
global.client = new (require('discord.js')).Client();
