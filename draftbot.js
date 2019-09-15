//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseManager = require('./modules/DatabaseManager');
const ServerManager = require('./modules/classes/ServerManager');
const Text = require('./modules/text/Francais');

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
  resultat += `**:inbox_tray: Serveur discord rejoint :** \`${guilde}\` | :bust_in_silhouette: : \`${nbMembres}\`  | :robot: : \`${nbBot}\` | Ratio bot/Humain : \`${ratio}\` % | Validation : ${validation}\n`;
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(resultat);
  if (validation == ":x:") {
    guilde.owner.send(`:warning:  Bonjour ! 
      
  Vous recevez ce message car je ne peux pas rester sur votre serveur : \`${guilde}\`
          
  Malheureusement votre serveur ne remplit pas certaines des conditions d'utilisation du bot qui ont été mises en place pour maintenir un minimum de confort aux joueurs en garantissant des performances normales. C'est pourquoi il est demandé aux serveurs souhaitant utiliser le bot d'avoir au minimum 150 êtres humains et de posséder moins de 20% de bot.
      
  Si vous avez des questions sur le fonctionnement du bot ou si vous souhaiter contester ce départ je vous invite à visiter le site internet : http://draftbot.tk où vous pourrez trouver un lien vers le discord de support du bot !
      
  Cordialement - DraftBot`);
    guilde.leave()
  } else {
    guilde.owner.send(`:tada:  Bonjour ! 
      
  Vous recevez ce message car je viens de rejoindre votre serveur : \`${guilde}\`
          
  Comme vous êtes le propriétaire d'un serveur hébergeant le DraftBot vous obtenez le droit à un grade sur le serveur du bot : https://discord.gg/AP3Wmzb
      
  Si vous avez des questions sur le fonctionnement du bot je vous invite à visiter le site internet : http://draftbot.tk
      
  Cordialement - DraftBot`);
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
  console.log(`DraftBot - v${Config.version}`);
  databaseManager.checkDatabaseValidity(sql);
  databaseManager.setEverybodyAsUnOccupied();
  client.guilds.get("429765017332613120").channels.get("433541702070960128").send(`:robot: **DraftBot** - v${Config.version}`).catch(err => { })
});

client.on("message", (message) => {
  //check if the user is a bot before doing anything
  if (message.author.bot) return;
  if (message.guild == null){
    return commandReader.handlePrivateMessage(message, client,talkedRecently);
  }
  commandReader.handleMessage(message, client,talkedRecently);
});

client.on("messageReactionAdd", (reaction) => {
  //check if the user is a bot before doing anything
  if (reaction.users.last().bot) return;
  if (reaction.message.content.includes("LVL") && reaction.message.author.id == client.user.id) {
    reaction.message.channel.send(Text.badges[reaction.emoji]).then(msg => {
      msg.delete(5000);
    }).catch(err => { });
  }
});

client.login(Config.DISCORD_CLIENT_TOKEN);



