//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseManager = require('./modules/DatabaseManager');
const ServerManager = require('./modules/classes/ServerManager');
const Console = require('./modules/text/Console');

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
  resultat += ` **:outbox_tray: Serveur discord quitté :** \`${guilde}\` | :bust_in_silhouette: : \`${nbMembres}\`  | :robot: : \`${nbBot}\` | Ratio bot/Humain : \`${ratio}\` % | Validation : ${validation}\n`;
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

/**
 * Send a message to the owner of a guild when the bot is added to its server
 * @param {*} guilde 
 */
function sendArrivalMessage(guilde) {

  guilde.owner.send(`:flag_fr:  Bonjour ! 
      
Vous recevez ce message car je viens de rejoindre votre serveur : \`${guilde}\`
          
Comme vous êtes le propriétaire d'un serveur hébergeant le DraftBot vous obtenez le droit à un grade sur le serveur du bot : https://discord.gg/AP3Wmzb
      
Si vous avez des questions sur le fonctionnement du bot je vous invite à visiter le wiki :  https://draftbot.fandom.com/fr/wiki/Commandes
      
Cordialement - DraftBot`);
  guilde.owner.send(`:flag_fr:  Hello ! 
      
You're receiving this message because I just joined your server: \`${guilde}\`
          
Since you're the owner of the server, you get to get a role on the bot's official server: https://discord.gg/AP3Wmzb

If you have any questions on how the bot works, please visit our wiki:  https://draftbot.fandom.com/fr/wiki/Commandes
      
Sincerely - DraftBot`);
}

/**
 * Send a message to the owner of the guild the bot is leaving
 * @param {*} guilde - The guild the bot is leaving
 */
function sendLeavingMessage(guilde) {
  guilde.owner.send(`:flag_fr:  Bonjour ! 
      
Vous recevez ce message car je ne peux pas rester sur votre serveur : \`${guilde}\`
          
Malheureusement votre serveur ne remplit pas certaines des conditions d'utilisation du bot qui ont été mises en place pour maintenir un minimum de confort aux joueurs en garantissant des performances normales. Pour plus de détails sur ces limitations, consultez https://draftbot.fandom.com/fr/wiki/Restrictions.
      
Si vous avez des questions sur le fonctionnement du bot ou si vous souhaiter contester ce départ je vous invite à visiter le site internet : http://draftbot.tk où vous pourrez trouver un lien vers le discord de support du bot !
      
Cordialement - DraftBot`);
  guilde.owner.send(`:flag_gb:  Hello! 
      
You received this message because I can't stay on your server: \`${guilde}\`
          
Unfortunately, your server doesn't fulfill some of the bot's requirements. These requirements are put in place to guarantee normal performance. For more details on these limitations, see https://draftbot.fandom.com/en/wiki/Restrictions.
      
If you have questions about how the bot works, or if you want to discuss this, visit http://draftbot.tk where you can find a link to the bot’s support Discord!
      
Cordialement - DraftBot`);
}

