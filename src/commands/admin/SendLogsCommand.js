/**
 * Allow a contributor to get the console logs
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const SendLogsCommand = async function(language, message, args) {
  if ((await canPerformCommand(message, language,
      PERMISSION.ROLE.CONTRIBUTORS)) !== true) {
    return;
  }

  if (message.channel.id !== JsonReader.app.CONTRIBUTORS_CHANNEL && message.author.id !== JsonReader.app.BOT_OWNER_ID) {
    return sendErrorMessage(message.author, message.channel, language, JsonReader.error.getTranslation(language).notContributorsChannel);
  }

  const fs = require('fs');
  fs.writeFileSync('logs.txt', global.consoleLogs);
  await message.author.send({
    files: [{
      attachment: 'logs.txt',
      name: 'logs.txt',
    }],
  });
};

module.exports = {
  commands: [
    {
      name: 'sendlogs',
      func: SendLogsCommand
    }
  ]
};
