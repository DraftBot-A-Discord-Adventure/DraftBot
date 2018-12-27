//Discord API
const Discord = require("discord.js");
const client = new Discord.Client();

//We just need those modules, CommandReader does all the work.
const Config = require('./modules/utils/Config');
const CommandReader = require('./modules/CommandReader');
const DatabaseCreator = require('./modules/DatabaseCreator');

const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");

let commandReader = new CommandReader();
let databaseCreator = new DatabaseCreator();

client.on("ready", () => {
    console.log(`DraftBot - v${Config.version}`);
    databaseCreator.checkDatabaseValidity(sql);    
});

client.on("message", (message) => {
    //check if the user is a bot before doing anything
    if (message.author.bot) return;
    commandReader.handleMessage(message);
});

client.login(Config.DISCORD_CLIENT_TOKEN);

