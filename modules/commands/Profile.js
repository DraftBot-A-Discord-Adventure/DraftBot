const PlayerManager = require('../classes/PlayerManager');
const ServerManager = require('../classes/ServerManager');
const Discord = require("discord.js");
const embed = new Discord.RichEmbed();
const DefaultValues = require('../utils/DefaultValues');

let Text

/**
 * Allow to charge the correct text file
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to get the language the bot has to respond with
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {string} - the code of the server language
 */
const detectLanguage = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    return server.language;
}

/**
 * Display information about the player that sent the command
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} args - arguments typed by the user in addition to the command
 */
const profileCommand = async function (message, args, client) {
    Text = await chargeText(message);
    let language = await detectLanguage(message);
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    if (askForAnotherPlayer(args)) {
        let playerId;
        player = await getAskedPlayer(playerId, player, playerManager, message, args); //recupération de l'id du joueur demandé
        if (askedPlayerIsInvalid(player))
            return message.channel.send(Text.commands.profile.errorMain + "**" + message.author.username + "**" + Text.commands.profile.errorExp)
    }
    let numberOfPlayer = await playerManager.getNumberOfPlayers();
    let messageProfile = generateProfileMessage(message, player, numberOfPlayer, client, language);
    message.channel.send(messageProfile).then(msg => {
        displayBadges(player, msg);
    });

}

/**
 * Returns a string containing the profile message.
 * @returns {String} - A string containing the profile message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the channel of the message.
 * @param {*} player - The player that send the message
 * @param {Integer} numberOfPlayer - The total number of player in the database
 * @param {String} language - The language the answer has to be displayed in
 * @param {*} client - The bot client
 */
const generateProfileMessage = function (message, player, numberOfPlayer, client, language) {
    const embed = new Discord.RichEmbed();
    let playerManager = new PlayerManager();
    let pseudo = getPlayerPseudo(client, player);
    if (player.getEffect() == ":baby:") {
        return profileMessage = player.getEffect() + Text.commands.profile.main + "**" + pseudo + "**" + Text.commands.profile.notAPlayer;
    }
    embed.setColor(DefaultValues.embed.color);
    embed.setTitle(Text.commands.profile.profileOf + pseudo +
        Text.commands.profile.level + player.getLevel());

    let displayTimeLeft = playerManager.displayTimeLeftProfile(player, message, language);
    let desc = "\u200b";
    if (displayTimeLeft != "") {
        console.log(displayTimeLeft)
        if (displayTimeLeft.includes("Reprise du jeu possible") || displayTimeLeft.includes("You can continue playing now")) {
            desc = displayTimeLeft.substr(15).replace("`", "") + "."
        } else {
            desc = `${Text.commands.profile.activeEffect} ${player.getEffect()}\n${Text.commands.profile.timeleft} ${displayTimeLeft}`;
        }
    } else {
        desc = Text.commands.profile.noActiveEffect;
    }

    embed.setDescription(desc);

    embed.addField(Text.commands.profile.stats,
        "• " + player.getAttack() + Text.commands.profile.statsAttack +
        player.getDefense() + Text.commands.profile.statsDefense + player.getSpeed() + Text.commands.profile.statsSpeed, false);

    embed.addField(Text.commands.profile.infos,
        "• " + player.getHealth() + Text.commands.profile.separator + player.getMaxHealth() + Text.commands.profile.health +
        player.getExperience() + Text.commands.profile.separator + player.getExperienceToLevelUp() + Text.commands.profile.xp +
        player.getMoney() + Text.commands.profile.money, false);

    embed.addField(Text.commands.profile.rankAndScore,
        "• " + player.getRank() + Text.commands.profile.separator + numberOfPlayer + Text.commands.profile.rank +
        player.getScore() + Text.commands.profile.score, false);
  
    return embed;
}



/**
 * Allow to recover the asked player if needed
 * @param {*} playerId - The asked id of the player
 * @param {*} player - The player that is asked for
 * @param {*} playerManager - The player manager
 * @param {*} message - The message that initiate the command

 */
async function getAskedPlayer(playerId, player, playerManager, message, args) {
    if (isNaN(args[1])) {
        try {
            playerId = message.mentions.users.last().id;
        } catch (err) { // the input is not a mention or a user rank
            playerId = "0"
        }
    } else {
        playerId = await playerManager.getIdByRank(args[1]);

    }
    player = await playerManager.getPlayerById(playerId, message);
    return player;
}

/**
 * check if the asked player is valid
 * @param {*} player - The player that has been asked for
 */
function askedPlayerIsInvalid(player) {
    return player.getEffect() == ":baby:";
}

/**
 * check if the user ask for its own profile or the one of someone else
 * @param {*} args - The args given by the user that made the command
 */
function askForAnotherPlayer(args) {
    return args[1] != undefined;
}

/**
 * display the badges of the player if he have some
 * @param {*} player - The player that is displayed
 * @param {*} msg - The message that contain the profile of the player
 */
async function displayBadges(player, msg) {
    if (player.getBadges() != "") {
        let str = player.getBadges();
        str = str.split('-');
        for (var i = 0; i < str.length; i++) {
            console.log(i + ":" + str[i])
            await msg.react(str[i]);
        }
    }
}

/**
 * get the username of a player
 * @param {*} client - The instance of the bot
 * @param {*} player - The player that we need the username
 * @returns {String} - The username
 */
function getPlayerPseudo(client, player) {
    let pseudo;
    if (client.users.get(player.discordId) != null) {
        pseudo = client.users.get(player.discordId).username;
    }
    else {
        pseudo = Text.commands.top.unknownPlayer;
    }
    return pseudo;
}

module.exports.ProfileCommand = profileCommand;


