//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those two modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');

let commandReader = new CommandReader();

client.on("ready", () => {
    console.log(`DraftBot - v${Config.version}`);
});

client.on("message", (message) => {
     //check if the user is a bot before doing anything
    if (message.author.bot) return;
    commandReader.handleMessage(message);
});

client.login(Config.DISCORD_CLIENT_TOKEN);

