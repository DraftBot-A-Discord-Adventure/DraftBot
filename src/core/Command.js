const fs = require('fs');

/**
 * @class
 */
class Command {
  /**
   * @return {Promise<void>}
   */
  static async init() {
    Command.commands = new Map();
    Command.aliases = new Map();
    Command.players = JsonReader.app.BLACKLIST_IDS.split('-');

    const folders = [
      'src/commands/admin',
      'src/commands/guild',
      'src/commands/player'];
    for (let folder of folders) {
      const commandsFiles = await fs.promises.readdir(folder);
      for (const commandFile of commandsFiles) {
        if (!commandFile.endsWith('.js')) continue;
        folder = folder.replace('src/', '');
        const commandName = commandFile.split('.')[0];

        const commands = require(`${folder}/${commandName}`).commands;
        if (commands !== undefined) {
          for (let i = 0; i < commands.length; ++i) {
            const cmd = commands[i];
            Command.commands.set(
                cmd.name,
                cmd.func,
            );
            Command.aliases.set(
                cmd.name,
                cmd.name,
            );
            if (cmd.aliases !== undefined) {
              for (let j = 0; j < cmd.aliases.length; ++j) {
                Command.commands.set(
                    cmd.aliases[j],
                    cmd.func,
                );
                Command.aliases.set(
                    cmd.aliases[j],
                    cmd.name,
                );
              }
            }
          }
        }
      }
    }
  }

  /**
   * @param {String} alias - The alias
   * @returns {String} The command
   */
  static getMainCommandFromAlias(alias) {
    if (Command.aliases.has(alias))
      return Command.aliases.get(alias);
    return alias;
  }

  /**
   * @param {String} cmd - The command
   * @returns {String[]} The aliases
   */
  static getAliasesFromCommand(cmd) {
    let aliases = [];
    for (const alias of Command.aliases.entries()) {
      if (alias[1] === cmd && alias[0] !== cmd) {
        aliases.push(alias[0]);
      }
    }
    return aliases;
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
    return Object.keys(Command.players).includes(id);
  }

  /**
   * @param {String} id
   * @return {String}
   */
  static getBlockedPlayer(id) {
    return Command.players[id];
  }

  /**
   * @param {String} id
   * @param {String} context
   */
  static addBlockedPlayer(id, context) {
    Command.players[id] = context;
  }

  /**
   * @param {String} id
   */
  static removeBlockedPlayer(id) {
    delete Command.players[id];
  }

  /**
   * This function analyses the passed message and check if he can be processed
   * @param {module:"discord.js".Message} message - Message from the discord server
   */
  static async handleMessage(message) {
    const [server] = await Servers.findOrCreate({
      where: {
        discordGuild_id: message.guild.id,
      },
    });

    let language = server.language;
    if (message.channel.id === JsonReader.app.ENGLISH_CHANNEL_ID) {
      language = "en";
    }

    if (message.content.startsWith("<@!" + client.user.id + ">")) {
      await message.channel.send(format(
          JsonReader.bot.getTranslation(language).mentionHelp,
          { prefix: server.prefix }
      ));
      return;
    }

    if (server.prefix === Command.getUsedPrefix(message, server.prefix)) {
      if (message.author.id !== JsonReader.app.BOT_OWNER_ID &&
        JsonReader.app.MODE_MAINTENANCE) {
        return message.channel.send(
          JsonReader.bot.getTranslation(language).maintenance);
      }

      await Command.launchCommand(language, server.prefix, message);
    } else {
      if (Command.getUsedPrefix(message, JsonReader.app.BOT_OWNER_PREFIX) ===
        JsonReader.app.BOT_OWNER_PREFIX && message.author.id ===
        JsonReader.app.BOT_OWNER_ID) {
        await Command.launchCommand(language,
          JsonReader.app.BOT_OWNER_PREFIX, message);
      }
    }
  }

  /**
   * This function analyses the passed private message and process it
   * @param {module:"discord.js".Message} message - Message from the discord user
   */
  static async handlePrivateMessage(message) {
    await Command.sendSupportMessage(message,
      Command.hasBlockedPlayer(message.author.id));
  }

  /**
   * Send a message to the support channel of the main server
   * @param {module:"discord.js".Message} message - Message from the discord user
   * @param {Boolean} isBlacklisted - Define if the user is blacklisted from the bot private messages
   */
  static async sendSupportMessage(message, isBlacklisted = false) {
    if (message.content === '') return;
    const mainServer = client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID);
    const supportChannel = mainServer.channels.cache.get(
      JsonReader.app.SUPPORT_CHANNEL_ID);
    const trashChannel = mainServer.channels.cache.get(
      JsonReader.app.TRASH_DM_CHANNEL_ID);
    const channel = isBlacklisted ? trashChannel : supportChannel;
    const language = message.author.locale === 'fr' ? 'fr' : 'en';

    const sentence = format(JsonReader.bot.dm.supportAlert, {
      roleMention: isBlacklisted ? '' : idToMention(
        JsonReader.app.SUPPORT_ROLE),
      username: message.author.username,
      id: message.author.id,
      isBlacklisted: isBlacklisted ? JsonReader.bot.dm.blacklisted : '',
    });

    channel.send(message.author.id)
      .catch(JsonReader.bot.getTranslation(language).noSpeakPermission);
    channel.send(sentence + message.content.substr(0, 1800) + (message.content.length > 1800 ? "..." : ""))
      .catch(JsonReader.bot.getTranslation(language).noSpeakPermission);
    if (message.attachments.size > 0) {
      await sendMessageAttachments(message,
        channel);
    }
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

    if (resetIsNow()) {
      return await sendErrorMessage(message.author, message.channel, language, JsonReader.bot.getTranslation(language).resetIsNow);
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (Command.commands.has(command)) {
      if (!message.channel.permissionsFor(client.user)
        .serialize().SEND_MESSAGES ||
        !message.channel.permissionsFor(client.user)
          .serialize().EMBED_LINKS ||
        !message.channel.permissionsFor(client.user)
          .serialize().ADD_REACTIONS ||
        !message.channel.permissionsFor(client.user)
          .serialize().USE_EXTERNAL_EMOJIS) {
        await message.author.send(
          JsonReader.bot.getTranslation(language).noSpeakPermission);
      } else {
        await Command.commands.get(command)(language, message, args);
      }
    }
  }
}

/**
 * @type {{init: Command.init}}
 */
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
global.getMainCommandFromAlias = Command.getMainCommandFromAlias;
global.getAliasesFromCommand = Command.getAliasesFromCommand;
