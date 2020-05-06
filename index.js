require('colors');
require('core/Constant');
require('core/MessageError');
require('core/Tools');
const Draftbot = require('core/DraftBot');

(async Drafbot => {

  await Drafbot.init();

  // --- SEQUELIZE EXAMPLE START
  let serverSet = await getModel('server').findAll();
  serverSet.forEach(item => {
    console.log(item.echo());
  });
  // --- SEQUELIZE EXAMPLE END

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
  const onDiscordGuildCreate = async guilde => {
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
  const onDiscordGuildDelete = async guilde => {
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
  const onDiscordMessage = async message => {
    if (message.author.bot) return;
    if (message.guild === null) {
      await handlePrivateMessage(message);
    }
    await handleMessage(message);
  };

  /**
   * Will be executed each time the bot see a reaction message
   * @param {module:"discord.js".MessageReaction} reaction
   * @return {Promise<void>}
   */
  const onDiscordMessageReactionAdd = async reaction => {
    //check if the user is a bot before doing anything
    // if (reaction.users.last().bot) return;
    //
    // let Text = await chargeText(reaction);
    // let isUnderAProfileMessage = checkReactionIsUnderAProfileMessage(reaction);
    // if (isUnderAProfileMessage && reaction.me && reaction.message.author.id == client.user.id) {
    //   //only answer if the reaction is a badge under a profile message
    //   reaction.message.channel.send(Text.badges[reaction.emoji]).then(msg => {
    //     msg.delete(5000);
    //   }).catch(err => { });
    // }
  };

  client.on('ready', onDiscordReady);
  client.on('ready', onDiscordGuildCreate);
  client.on('ready', onDiscordGuildDelete);
  client.on('message', onDiscordMessage);
  client.on('messageReactionAdd', onDiscordMessageReactionAdd);

  await client.login(JsonReader.app.DISCORD_CLIENT_TOKEN);

})(Draftbot);

// /**
//  * Returns the ISO week of the date.
//  */
// Date.prototype.getWeek = function () {
//   var date = new Date(this.getTime());
//   date.setHours(0, 0, 0, 0);
//   // Thursday in current week decides the year.
//   date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
//   // January 4 is always in week 1.
//   var week1 = new Date(date.getFullYear(), 0, 4);
//   // Adjust to Thursday in week 1 and count number of weeks from date to week1.
//   return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
//     - 3 + (week1.getDay() + 6) % 7) / 7);
// }
//
// /**
//  * Check if the recieved reaction has been set under a profile message.
//  * @param {*} reaction
//  */
// function checkReactionIsUnderAProfileMessage(reaction) {
//   let isUnderAProfileMessage;
//   try {
//     isUnderAProfileMessage = reaction.message.embeds[0].fields[0].name.includes("Information");
//   }
//   catch (error) { //the reaction was not added on a profile message
//     isUnderAProfileMessage = false;
//   }
//   return isUnderAProfileMessage;
// }
//
// /**
//  * Check if the top week need to be reset and if so, proceed to reset the top week
//  */
// async function checkTopWeek() {
//   let weekNumber = getCurrentWeekNumber();
//   let lastweekNumber = await sql.get(`SELECT * FROM database`);
//   if (lastweekNumber.lastReset !== weekNumber) {
//     await resetTopWeek(weekNumber);
//   }
// }
//
// /**
//  * Get the current week number
//  * @return {Number}
//  */
// function getCurrentWeekNumber() {
//   let date = new Date(); // Create a Date object to find out what time it is
//   date.setHours(date.getHours() + 1);
//   return date.getWeek() + 1;
// }
//
// /**
//  * Reset the topweek
//  * @param {*} weekNumber Current week number used to save the last time the topweek has been reseted
//  */
// async function resetTopWeek(weekNumber) {
//   sql.run(`UPDATE database SET lastReset = ${weekNumber}`).catch(console.error);
//   let gagnant = await sql.get(`select * from player order by weeklyScore desc limit 1`).catch(console.error);
//   if (gagnant != null) {
//     let playerManager = new PlayerManager();
//     let player = await playerManager.getPlayerById(gagnant.discordId);
//     displayAnnouncementsChannel(":trophy: **Le classement de la semaine est terminé ! Le gagnant est :**  <@" + gagnant.discordId + ">", ":trophy: **The weekly ranking has ended! The winner is:**  <@" + gagnant.discordId + ">");
//     giveTopWeekBadge(player);
//     playerManager.updatePlayer(player);
//   }
//  databaseManager.resetWeeklyScoreAndRank();
//   console.log("# WARNING # Weekly leaderboard has been reset !");
// }
//
// /**
//  * Give the winner the badge for leading the topweek
//  * @param {*} player
//  */
// function giveTopWeekBadge(player) {
//   if (player.badges != "") {
//     if (player.badges.includes("🎗️")) {
//       console.log("Le joueur a déjà le badge");
//     }
//     else {
//       player.badges = player.badges + "-🎗️";
//     }
//   }
//   else {
//     player.badges = "🎗️";
//   }
// }
//
// /**
//  * Send a message in the channels "announcements" of the bot main server
//  * @param {String} messagefr the french version of the mssage
//  * @param {String} messageen the english version of the mssage
//  */
// function displayAnnouncementsChannel(messagefr, messageen) {
//   client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.FRENCH_ANNOUNCEMENT_CHANNEL_ID).send(messagefr).catch(err => { });
//   client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.ENGLISH_ANNOUNCEMENT_CHANNEL_ID).send(messageen).catch(err => { });
// }
//
// /**
//  * Send a message to the owner of the guild the bot is leaving
//  * @param {*} guilde - The guild the bot is leaving
//  */
// function sendLeavingMessage(guilde) {
//   guilde.owner.send(Console.departurMessage);
// }
