require('colors');
require('core/Constant');
require('core/MessageError');
require('core/Tools');
const Draftbot = require('core/DraftBot');

(async (Drafbot) => {
  await Drafbot.init();

  /**
   * Will be executed whenever the bot has started
   * @return {Promise<void>}
   */
  const onDiscordReady = async () => {
    (require('figlet'))(JsonReader.bot.reboot, (err, data) => {
      console.log(data.red);
      console.log(JsonReader.bot.br.grey);
    });

    await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID)
        .channels
        .cache
        .get(JsonReader.app.CONSOLE_CHANNEL_ID)
        .send(JsonReader.bot.startStatus + JsonReader.package.version)
        .catch(console.error);

    await client.user
        .setActivity(JsonReader.bot.activity)
        .catch(console.error);
  };

  /**
   * Will be executed each time the bot join a new server
   */
  const onDiscordGuildCreate = async (guilde) => {
    // let string = "";
    // let serverManager = new ServerManager();
    // let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
    // string += Console.guildJoin.begin + guilde + Console.guildJoin.persons + nbMembres + Console.guildJoin.bots + nbBot + Console.guildJoin.ratio + ratio + Console.guildJoin.validation + validation;
    // displayConsoleChannel(string);
    // if (validation == ":x:") {
    //   sendLeavingMessage(guilde);
    //   //guilde.leave() //temporairement désactivé pour top.gg
    // }
    // console.log(string);
  };

  /**
   * Will be executed each time the bot leave a server
   */
  const onDiscordGuildDelete = async (guilde) => {
    // let string = "";
    // let serverManager = new ServerManager();
    // let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
    // string += Console.guildJoin.beginquit + guilde + Console.guildJoin.persons + nbMembres + Console.guildJoin.bots + nbBot + Console.guildJoin.ratio + ratio + Console.guildJoin.validation + validation;
    // displayConsoleChannel(string);
    // console.log(string);
  };

  /**
   * Will be executed each time the bot see a message
   * @param {module:"discord.js".Message} message
   * @return {Promise<void>}
   */
  const onDiscordMessage = async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === 'dm') {
      await handlePrivateMessage(message);
    } else {
      await handleMessage(message);
    }
  };

  client.on('ready', onDiscordReady);
  client.on('ready', onDiscordGuildCreate);
  client.on('ready', onDiscordGuildDelete);
  client.on('message', onDiscordMessage);

  await client.login(JsonReader.app.DISCORD_CLIENT_TOKEN);
})(Draftbot);

// /**
//  * Send a message to the owner of the guild the bot is leaving
//  * @param {*} guilde - The guild the bot is leaving
//  */
// function sendLeavingMessage(guilde) {
//   guilde.owner.send(Console.departurMessage);
// }
