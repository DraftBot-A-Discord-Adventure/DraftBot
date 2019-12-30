//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseManager = require('./modules/DatabaseManager');
const ServerManager = require('./modules/classes/ServerManager');
const Console = require('./modules/text/Console');

//trigger of change week : Update weeklyScore value to 0 for each player and reset weekly top.
setInterval(function(){ // Set interval for checking
  const date = new Date(); // Create a Date object to find out what time it is
  if(date.getDay() === 0 && date.getHours() === 23 && date.getMinutes() <= 1) { // Check the time (if day returns 0, it's sunday)
    const databaseManager = new DatabaseManager();
    databaseManager.resetWeeklyScoreAndRank();
    console.log("# WARNING # Weekly leaderboard has been reset !");
  }
}, 60000); // Repeat every 60000 milliseconds (1 minute)

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
});

client.on("guildDelete", guilde => {
  let resultat = "";
  let serverManager = new ServerManager;
  let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guilde);
  resultat += Console.guildJoin.beginquit + guilde + Console.guildJoin.persons + nbMembres + Console.guildJoin.bots + nbBot + Console.guildJoin.ratio + ratio + Console.guildJoin.validation + validation;
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(resultat);
});

client.on("ready", () => {
  client.user.setActivity(`!language -> english`);
  console.log(Console.reboot);
  databaseManager.checkDatabaseValidity(sql);
  databaseManager.setEverybodyAsUnOccupied();
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(`:robot: **DraftBot** - v${Config.version}`).catch(err => { })
});

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
  let serverManager = new ServerManager();
  let server = await serverManager.getServer(reaction.message);
  if (reaction.message.channel.id == 639446722845868101) {
    server.language = "en";
  }
  let Text = require('./modules/text/' + server.language)
  if (reaction.message.content.includes("LVL") && reaction.message.author.id == client.user.id) {
    reaction.message.channel.send(Text.badges[reaction.emoji]).then(msg => {
      msg.delete(5000);
    }).catch(err => { });
  }
});

client.login(Config.DISCORD_CLIENT_TOKEN);


/**Z
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

