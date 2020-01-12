const Discord = require("discord.js");
const client = new Discord.Client();
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseManager = require('./modules/DatabaseManager');
const ServerManager = require('./modules/classes/ServerManager');
const Console = require('./modules/text/Console');
const PlayerManager = require('./modules/classes/PlayerManager');

//database loading : I use sqlite because it is a promise based system like discord.js so it make sense
const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");
const talkedRecently = new Set();
let commandReader = new CommandReader();
let databaseManager = new DatabaseManager();

client.on("guildCreate", guilde => {
  let resultat = "";
  let serverManager = new ServerManager;
  let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
  resultat += Console.guildJoin.begin + guilde + Console.guildJoin.persons + nbMembres + Console.guildJoin.bots + nbBot + Console.guildJoin.ratio + ratio + Console.guildJoin.validation + validation;
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(resultat);
  if (validation == ":x:") {
    sendLeavingMessage(guilde);
    guilde.leave()
  } else {
    sendArrivalMessage(guilde);
  }
  console.log(resultat);
});

client.on("guildDelete", guilde => {
  let resultat = "";
  let serverManager = new ServerManager;
  let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
  resultat += Console.guildJoin.beginquit + guilde + Console.guildJoin.persons + nbMembres + Console.guildJoin.bots + nbBot + Console.guildJoin.ratio + ratio + Console.guildJoin.validation + validation;
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(resultat);
  console.log(resultat);
});

client.on("ready", () => {
  console.log(Console.reboot);
  databaseManager.checkDatabaseValidity(sql);
  databaseManager.setEverybodyAsUnOccupied();
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(`:robot: **DraftBot** - v${Config.version}`).catch(err => { })
  //trigger of change week : Update weeklyScore value to 0 for each player and reset weekly top.
  setInterval(async function () { // Set interval for checking
    let date = new Date(); // Create a Date object to find out what time it is
    let weekNumber = date.getWeek() + 1;
    let lastweekNumber = await sql.get(`SELECT lastReset FROM database`);
    lastweekNumber = lastweekNumber.lastReset;
    if (lastweekNumber.lastReset == null) {
      sql.run(`UPDATE database SET lastReset = ${weekNumber}`).catch(console.error);
    }
    if (lastweekNumber != weekNumber) {
      sql.run(`UPDATE database SET lastReset = ${weekNumber}`).catch(console.error);
      let gagnant = await sql.get(`SELECT * FROM player WHERE weeklyRank=1`).catch(console.error);
      if (gagnant != null) {
        let playerManager = new PlayerManager();
        let player = await playerManager.getPlayerById(gagnant.discordId);
        client.guilds.get("429765017332613120").channels.get("433541702070960128").send(":trophy: **Le classement de la semaine est terminé ! Le gagnant est :**  <@" + gagnant.discordId + ">");
        if (player.badges != "") {
          if (player.badges.includes("🎗️")) {
            console.log("Le joueur a déjà le badge")
          } else {
            player.badges = player.badges + "-🎗️"
          }
        } else {
          player.badges = "🎗️"
        }
        playerManager.updatePlayer(player);
      }
      databaseManager.resetWeeklyScoreAndRank();
      console.log("# WARNING # Weekly leaderboard has been reset !");
    }
  }, 1000); // Repeat every 10000 milliseconds (10 seconds)
});

// Returns the ISO week of the date.
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
    - 3 + (week1.getDay() + 6) % 7) / 7);
}

client.on("message", (message) => {
  //check if the user is a bot before doing anything
  if (message.author.bot) return;
  if (message.guild == null) {
    return commandReader.handlePrivateMessage(message, client, talkedRecently);
  }
  commandReader.handleMessage(message, client, talkedRecently);
});

client.on("messageReactionAdd", async (reaction) => {
  //check if the user is a bot before doing anything
  if (reaction.users.last().bot) return;
  let Text = await chargeText(reaction);
  let test;
  try {
    test = reaction.message.embeds[0].fields[0].name.includes("Information");
  } catch (error) { //the reaction was not added on a profile message
    test = false
  }
  if (test && reaction.me && reaction.message.author.id == client.user.id) {
    reaction.message.channel.send(Text.badges[reaction.emoji]).then(msg => {
      msg.delete(5000);
    }).catch(err => { });
  }
});

client.login(Config.DISCORD_CLIENT_TOKEN);

async function chargeText(reaction) {
  let serverManager = new ServerManager();
  let server = await serverManager.getServer(reaction.message);
  if (reaction.message.channel.id == 639446722845868101) {
    server.language = "en";
  }
  let Text = require('./modules/text/' + server.language);
  return Text;
}

/**
 * Send a message to the owner of a guild when the bot is added to its server
 * @param {*} guilde 
 */
function sendArrivalMessage(guilde) {
  guilde.owner.send(Console.arrivalMessage);
}

/**
 * Send a message to the owner of the guild the bot is leaving
 * @param {*} guilde - The guild the bot is leaving
 */
function sendLeavingMessage(guilde) {
  guilde.owner.send(Console.departurMessage);
}

