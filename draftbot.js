//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseManager = require('./modules/DatabaseManager');

//database loading : I use sqlite because it is a promise based system like discord.js so it make sense
const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");

let commandReader = new CommandReader();
let databaseManager = new DatabaseManager();

client.on("guildCreate", guilde => {
    let resultat = "";
    let { validation, nbMembres, nbBot, ratio } = getValidationInfos(guilde);
    if (config.gidexception.includes(guilde.id)) {
      validation = ":newspaper:";
    }
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
    let { validation, nbMembres, nbBot, ratio } = getValidationInfos(guilde);
    resultat += ` **:outbox_tray: Serveur discord quitté :** \`${guilde}\` | :bust_in_silhouette: : \`${nbMembres}\`  | :robot: : \`${nbBot}\` | Ratio bot/Humain : \`${ratio}\` % | Validation : ${validation}\n`;
    client.guilds.get("429765017332613120").channels.get("433541702070960128").send(resultat);
  });

client.on("ready", () => {
    console.log(`DraftBot - v${Config.version}`);
    databaseManager.checkDatabaseValidity(sql); 
    databaseManager.setEverybodyAsUnOccupied();  
    client.guilds.get("429765017332613120").channels.get("433541702070960128").send(`:robot: **DraftBot** - v${Config.version}`)  
});

client.on("message", (message) => {
    //check if the user is a bot before doing anything
    if (message.author.bot) return;
    commandReader.handleMessage(message,client);
});

client.login(Config.DISCORD_CLIENT_TOKEN);

function getValidationInfos(guilde) {
    let nbMembres = guilde.members.filter(member => !member.user.bot).size;
    let nbBot = guilde.members.filter(member => member.user.bot).size;
    let ratio = Math.round((nbBot / nbMembres) * 100);
    let validation = ":white_check_mark:";
    if (ratio > 30 || nbMembres < 30 || (nbMembres < 100 && ratio > 20)) {
        validation = ":x:";
    }
    else {
        if (ratio > 20 || nbBot > 15 || nbMembres < 100) {
            validation = ":warning:";
        }
    }
    return { validation, nbMembres, nbBot, ratio };
}

