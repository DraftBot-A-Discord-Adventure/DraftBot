const fs = require('fs');

class Command {

  /**
   * @return {Promise<void>}
   */
  static async init() {
    Command.commands = new Map();
    Command.players = new Map();

    let commandsFiles = await fs.promises.readdir('src/commands/player');
    for (const commandFile of commandsFiles) {
      if (!commandFile.endsWith('.js')) continue;
      let commandName = commandFile.split('.')[0];

      let commandKeys = Object.keys(require(`commands/player/${commandName}`));
      for (const commandKey of commandKeys) {
        await Command.commands.set(
            commandKey,
            require(`commands/player/${commandName}`)[commandKey],
        );
      }
    }
  }

  /**
   * @param {String} command - The command to get
   * @return An instance of the command asked
   */
  static getCommand(command) {
    return Command.commands.get(command);
  }

  /**
   * @param {String} id
   */
  static hasBlockedPlayer(id) {
    return Command.players.has(id);
  }

  /**
   * @param {String} id
   * @return {String}
   */
  static getBlockedPlayer(id) {
    return Command.players.get(id);
  }

  /**
   * @param {String} id
   * @param {String} context
   */
  static addBlockedPlayer(id, context) {
    Command.players.set(id, context);
  }

  /**
   * @param {String} id
   */
  static removeBlockedPlayer(id) {
    Command.players.delete(id);
  }

  /**
   * This function analyses the passed message and check if he can be processed
   * @param {module:"discord.js".Message} message - Message from the discord server
   */
  static async handleMessage(message) {
    let server = await getRepository('server')
        .getByIdOrCreate(message.guild.id);

    if (server.prefix === Command.getUsedPrefix(message, server.prefix)) {

      if (message.author.id !== JsonReader.app.BOT_OWNER_ID &&
          JsonReader.app.MODE_MAINTENANCE) {
        return message.channel.send(
            JsonReader.bot.getTranslation(server.language).maitenance);
      }

      // TODO 2.0
      // const diffMinutes = getMinutesBeforeReset();
      // if (resetIsNow(diffMinutes)) {
      //     const embed = await generateResetTopWeekEmbed(message);
      //     return message.channel.send(embed)
      // }

      await Command.launchCommand(server.language, server.prefix, message);
    } else {
      if (this.getUsedPrefix(message, JsonReader.app.BOT_OWNER_PREFIX) ===
          JsonReader.app.BOT_OWNER_PREFIX && message.author.id ===
          JsonReader.app.BOT_OWNER_ID) {
        await Command.launchCommand(server.language,
            JsonReader.app.BOT_OWNER_PREFIX, message);
      }
    }
  }

  /**
   * This function analyses the passed private message and process it
   * @param {module:"discord.js".Message} message - Message from the discord server
   */
  static async handlePrivateMessage(message) {
      // TODO 2.0 Refactor
      // if (Config.BLACKLIST.includes(message.author.id)) {
      //     for (let i = 1; i < 5; i++) {
      //         message.channel.send(":x: Erreur.")
      //     }
      //     if (message.content != "") {
      //         client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.TRASH_DM_CHANNEL_ID).send(Console.dm.quote + message.content);
      //     }
      //     return message.channel.send(":x: Erreur.")
      // }
      // client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(message.author.id);
      // client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.alertBegin + message.author.username + Console.dm.alertId + message.author.id + Console.dm.alertEnd);
      // if (message.content != "") {
      //     client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.quote + message.content);
      // }
      // else {
      //     client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.empty);
      // }
      // message.attachments.forEach(element => {
      //     client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send({
      //         files: [{
      //             attachment: element.url,
      //             name: element.filename
      //         }]
      //     });
      // });
  }

  /**
   * Get the prefix that the user just used to make the command
   * @param {*} message - The message to extract the command from
   * @param {String} prefix - The prefix used by current server
   * @return {String}
   */
  static getUsedPrefix(message, prefix) {
    return message.content.substr(0, prefix.length);
  }

  /**
   *
   * @param {*} message - A command posted by an user.
   * @param {String} prefix - The current prefix in the message content
   * @param {('fr'|'en')} language - The language for the current server
   */
  static async launchCommand(language, prefix, message) {
    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    if (Command.commands.has(command)) {
      if (!message.channel.permissionsFor(client.user)
          .serialize().SEND_MESSAGES ||
          !message.channel.permissionsFor(client.user)
              .serialize().EMBED_LINKS ||
          !message.channel.permissionsFor(client.user)
              .serialize().ADD_REACTIONS ||
          !message.channel.permissionsFor(client.user)
              .serialize().USE_EXTERNAL_EMOJIS) {

        await message.author.send(JsonReader.bot.getTranslation(language).noSpeakPermission);

      } else {
        await Command.commands.get(command)(language, message, args);
      }
    }
  }

}

// /**
//  * Generate the embed that the bot has to send if the top week is curently beeing reset
//  * @param {*} message - the message used to get this embed
//  */
// async function generateResetTopWeekEmbed(message) {
//     const embed = new Discord.RichEmbed();
//     let Text = await Tools.chargeText(message);
//     embed.setColor(DefaultValues.embed.color);
//     embed.setTitle(Text.commandReader.resetIsNowTitle);
//     embed.setDescription(Text.commandReader.resetIsNowFooter);
//     return embed;
// }
//
// /**
//  * True if the reset is now (every sunday at midnight)
//  * @param {*} diffMinutes - The amount of minutes before the next reset
//  */
// function resetIsNow(diffMinutes) {
//     return diffMinutes < 3 && diffMinutes > -1;
// }
//
// /**
//  * Get the amount of minutes before the next reset
//  */
// function getMinutesBeforeReset() {
//     var now = new Date(); //The current date
//     var dateOfReset = new Date(); // The next Sunday
//     dateOfReset.setDate(now.getDate() + (0 + (7 - now.getDay())) % 7); // Calculating next Sunday
//     dateOfReset.setHours(22, 59, 59); // Defining hours, min, sec to 23, 59, 59
//     //Parsing dates to moment
//     var nowMoment = new moment(now);
//     var momentOfReset = new moment(dateOfReset);
//     const diffMinutes = momentOfReset.diff(nowMoment, 'minutes');
//     return diffMinutes;
// }

module.exports = {
  init: Command.init,
};

global.getCommand = Command.getCommand;
global.getBlockedPlayer = Command.getBlockedPlayer;
global.hasBlockedPlayer = Command.hasBlockedPlayer;
global.addBlockedPlayer = Command.addBlockedPlayer;
global.removeBlockedPlayer = Command.removeBlockedPlayer;
global.handleMessage = Command.handleMessage;
global.handlePrivateMessage = Command.handlePrivateMessage;
