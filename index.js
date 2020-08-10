require('colors');
require('core/Constant');
require('core/MessageError');
require('core/Tools');
const Draftbot = require('core/DraftBot');

(async (Drafbot) => {

  /* Console override */
  global.consoleLogs = "";
  const originalConsoleLog = console.log;
  const addConsoleLog = function(message) {
    let now = new Date();
    let dateStr = "[" + now.getFullYear() + "/" + ("0" + (now.getMonth()+1)).slice(-2) + "/" + ("0" + (now.getDate()+1)).slice(-2) + " " + ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2) + "]\n";
    try {
      global.consoleLogs += dateStr + message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '') + "\n"; // Remove terminal colors
    } catch (e) {
      global.consoleLogs += dateStr + message + "\n";
    }
  };
  console.log = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleLog(message, optionalParams === undefined ? "" : optionalParams);
  };
  const originalConsoleWarn = console.warn;
  console.warn = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleWarn(message, optionalParams === undefined ? "" : optionalParams);
  };
  const originalConsoleInfo = console.info;
  console.info = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleInfo(message, optionalParams === undefined ? "" : optionalParams);
  };
  const originalConsoleDebug = console.debug;
  console.debug = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleDebug(message, optionalParams === undefined ? "" : optionalParams);
  };
  const originalConsoleError = console.error;
  console.error = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleError(message, optionalParams === undefined ? "" : optionalParams);
  };
  const originalConsoleTrace = console.trace;
  console.trace = function(message, optionalParams) {
    addConsoleLog(message);
    originalConsoleTrace(message, optionalParams === undefined ? "" : optionalParams);
  };

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

    await require('core/DBL').verifyDBLRoles();
  };

  /**
   * Will be executed each time the bot join a new server
   */
  const onDiscordGuildCreate = async (guild) => {
    let [serv] = await Servers.getOrRegister(JsonReader.app.MAIN_SERVER_ID);
    let msg = getJoinLeaveMessage(guild, true, serv.language);
    (await client.channels.fetch(JsonReader.app.CONSOLE_CHANNEL_ID)).send(msg);
    // if (validation == ":x:") {
    //   sendLeavingMessage(guilde);
    //   //guilde.leave() //temporairement désactivé pour top.gg
    // }
    console.log(msg);
  };

  /**
   * Will be executed each time the bot leave a server
   */
  const onDiscordGuildDelete = async (guild) => {
    let [serv] = await Servers.getOrRegister(JsonReader.app.MAIN_SERVER_ID);
    let msg = getJoinLeaveMessage(guild, false, serv.language);
    (await client.channels.fetch(JsonReader.app.CONSOLE_CHANNEL_ID)).send(msg);
    console.log(msg);
  };

  /**
   * Get the message when the bot joins or leaves a guild
   * @param {module:"discord.js".Guild} guild
   * @param {boolean} join
   * @param {"fr"|"en"} language
   * @return {string}
   */
  const getJoinLeaveMessage = (guild, join, language) => {
    let { validation, humans, bots, ratio } = getValidationInfos(guild);
    return format(join ? JsonReader.bot.getTranslation(language).joinGuild : JsonReader.bot.getTranslation(language).leaveGuild, {
      guild: guild,
      humans: humans,
      robots: bots,
      ratio: ratio,
      validation: validation
    });
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
  client.on('guildCreate', onDiscordGuildCreate);
  client.on('guildDelete', onDiscordGuildDelete);
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
