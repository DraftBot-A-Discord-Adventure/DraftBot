const PlayerManager = require('../classes/PlayerManager');
const Discord = require("discord.js");
const DefaultValues = require('../utils/DefaultValues');
const Tools = require('../utils/Tools');

let Text;

/**
 * Display information about the player that sent the command
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} args - arguments typed by the user in addition to the command
 */
const profileCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let playerManager = new PlayerManager();
    let language = await Tools.detectLanguage(message);
    let player = await playerManager.getCurrentPlayer(message);
    if (askForAnotherPlayer(args)) {
        let playerId;
        player = await getAskedPlayer(playerId, player, playerManager, message, args); //recupération de l'id du joueur demandé
        if (askedPlayerIsInvalid(player))
            return message.channel.send(Text.commands.profile.errorMain + "**" + message.author.username + "**" + Text.commands.profile.errorExp)
    }
    let numberOfPlayer = await playerManager.getNumberOfPlayers();
    await Tools.seeItemBonus(player)
    let messageProfile = generateProfileMessage(message, player, numberOfPlayer, client, language);
    message.channel.send(messageProfile).then(msg => {
        displayBadges(player, msg);
    });

}

/**
 * Returns a string containing the profile message.
 * @returns {String} - A string containing the profile message.
 * @param {*} message - The message that caused the command to be triggered
 * @param {*} player - The player that send the message
 * @param {Integer} numberOfPlayer - The total number of player in the database
 * @param {*} client - The bot client
 * @param {String} language - The language the answer has to be displayed in
 */
const generateProfileMessage = function (message, player, numberOfPlayer, client, language) {
    const embed = new Discord.RichEmbed();
    let pseudo = player.getPseudo(client);
        if(pseudo == null){
            pseudo = Text.player.unknownPlayer
        }
    let playerManager = new PlayerManager();
    if (player.getEffect() == ":baby:") {
        return player.getEffect() + Text.commands.profile.main + "**" + pseudo + "**" + Text.commands.profile.notAPlayer;
    }
    embed.setColor(DefaultValues.embed.color);

    embed.setTitle(player.getEffect() + Text.commands.profile.main + pseudo +
        Text.commands.profile.level + player.getLevel());

    embed.addField(Text.commands.profile.infos,
        Text.commands.profile.health + player.getHealth() + Text.commands.profile.separator + player.getMaxHealth() +
        Text.commands.profile.xp + player.getExperience() + Text.commands.profile.separator + player.getExperienceToLevelUp() +
        Text.commands.profile.money + player.getMoney(), false);

    embed.addField(Text.commands.profile.stats,
        Text.commands.profile.statsAttack + player.getAttack() + Text.commands.profile.statsDefense +
        player.getDefense() + Text.commands.profile.statsSpeed + player.getSpeed()+ Text.commands.profile.statsFightPower + player.getFightPower(), false); 

    embed.addField(Text.commands.profile.rankAndScore,
        Text.commands.profile.rank + player.getRank() + Text.commands.profile.separator + numberOfPlayer +
        Text.commands.profile.score + player.getScore(), false);


    if (playerManager.displayTimeLeftProfile(player, message, language) != "") {
        let timeLeftMessage;
        if (!playerManager.displayTimeLeftProfile(player, message, language).includes(":hospital:")) { //the player is not cured
            timeLeftMessage = player.getEffect() + " " + playerManager.displayTimeLeftProfile(player, message, language);
        } else {
            timeLeftMessage = playerManager.displayTimeLeftProfile(player, message, language);
        }
        embed.addField(Text.commands.profile.timeleft, timeLeftMessage)
    }

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
            await msg.react(str[i]);
        }
    }
}

module.exports.ProfileCommand = profileCommand;
