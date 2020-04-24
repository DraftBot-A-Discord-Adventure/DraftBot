const Discord = require("discord.js");
const moment = require("moment");
const DefaultValues = require('../utils/DefaultValues');
const PlayerManager = require('../classes/PlayerManager');
const Tools = require('../utils/Tools');

let Text

/**
 * Allow to display the rankings of the players
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const TopServCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let playerManager = new PlayerManager();
    let actualPlayer = await playerManager.getCurrentPlayer(message);
    let idList = Tools.getIdListServMember(message);
    actualPlayer.rank = await playerManager.getServRank(idList,actualPlayer.discordId)
    totalJoueur = await playerManager.getNumberOfServPlayers(idList);
    let pageMax = Math.ceil(totalJoueur / DefaultValues.TopServ.playersByPage);
    let page = getRequiredPageNumber(args);
    let erreur = testAbsurdsPages(message, page, pageMax);
    if (erreur == 0) {
        let bornesup = page * DefaultValues.TopServ.playersByPage
        let borneinf = bornesup - (DefaultValues.TopServ.playersByPage - 1);
        let data = await playerManager.getTopServData(borneinf, bornesup, idList)
        const messageTop = generateTopMessage(message, borneinf, bornesup, pageMax, page, actualPlayer, totalJoueur, data, client);
        message.channel.send(messageTop);
    }
}


/**
 * /**
 * Returns a string containing the nodrink message.
 * @returns {String} - A string containing the nodrink message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {Integer} borneinf -The upper limit of the page
 * @param {Integer} bornesup  - The lower limit of the page
 * @param {Integer} pageMax - The number of pages that are available on the top
 * @param {Integer} page - The number of the actual page that is displayed
 * @param {*} actualPlayer - The player instant of the perso who asked for the top
 * @param {Integer} totalJoueur - The account of player in the game
 * @param {*} data - The data of the page that has been required
 * @param {*} client - The bot client, used to retrieve the username of the players
 */
const generateTopMessage = function (message, borneinf, bornesup, pageMax, page, actualPlayer, totalJoueur, data, client) {
    let messageTop = Text.commands.topServ.introDebut + borneinf + Text.commands.top.pageNumberSeparator + bornesup + Text.commands.top.introFin;
    let classementJoueur = actualPlayer.rank;
    const embed = new Discord.RichEmbed();
    embed.setColor(DefaultValues.embed.color);
    embed.setTitle(messageTop);
    embed.setThumbnail("https://i.imgur.com/qwECDVq.png");
    if (data === null) {
        embed.setDescription(Text.commands.top.noPlayersInTop);
    } else {
        embed.setDescription("\u200b\n" + generateTopDataText(data, totalJoueur, messageTop, message, client) + "\u200b");
        embed.addField(Text.commands.top.ranked, getEndSentence(classementJoueur, actualPlayer, message, totalJoueur, page, pageMax), false)
    }
    return embed;
}


/**
 * @param {*} data - The data of the page that has been required
 * @param {*} totalJoueur - The count of player in the game
 * @param {*} messageTop - Text
 * @param {*} message - The message that query this commannd.
 * @param {*} client - The bot client.
 */

function generateTopDataText(data, totalJoueur, messageTop, message, client) {
    messageTop = "";
    messageTop = checkPotentialDatabaseError(totalJoueur, messageTop, message);
    data.forEach(function (player) { //for each player that the bot have to display
        messageTop = getPlacementEmoji(player, messageTop, message);
        let pseudo = player.getPseudo(client);
        if(pseudo == null){
            pseudo = Text.player.unknownPlayer
        }
        messageTop = displayPlayerInfos(messageTop, player, pseudo, message);
    });
    return messageTop;
}


/**
 * Allow to test if there is a mistake in the page number that the user required
 * @param {Integer} page - The number of the page the user want
 * @param {Integer} pageMax - The number of the last page
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @return {Integer} - The error code. 0 if all was ok
 */
const testAbsurdsPages = function (message, page, pageMax) {
    if (isNaN(page)) {
        message.channel.send(Text.commands.top.errorDebut + message.author.username + Text.commands.top.invalidNumber);
        return 1;
    }
    if (page <= 0) {
        message.channel.send(Text.commands.top.errorDebut + message.author.username + Text.commands.top.invalidNumber);
        return 1;
    }
    if (page > pageMax) {
        message.channel.send(Text.commands.top.errorDebut + message.author.username + Text.commands.top.tooMuchError + pageMax);
        return 1;
    }
    return 0;
}

/**
 * Check if the top can be displayed without any problem
 * @param {Integer} totalJoueur - The count of player in the game
 * @param {String} messageTop - The string that will be displayed to the player
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @returns {String} - The eventually corrected topMessage
 */
function checkPotentialDatabaseError(totalJoueur, messageTop, message) {
    if (totalJoueur < 1) {
        messageTop = Text.commands.top.errorDebut + message.author.username + Text.commands.top.noUserError;
    }
    else {
        if (messageTop.length > 2000) {
            messageTop = Text.commands.top.errorDebut + message.author.username + Text.commands.top.tooMuchUserError;
        }
    }
    return messageTop;
}


/**
 * Allow to display information to the player about his position in the ranking
 * @param {Integer} classementJoueur - The weeklyRank of the player that asked for the top
 * @param {*} actualPlayer - The player that asked for the top
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @param {Integer} totalJoueur - The count of player in the game
 * @param {Integer} page - The current page number
 * @param {Integer} pageMax - The last page number
 * @returns {String} - The end sentence
 */
function getEndSentence(classementJoueur, actualPlayer, message, totalJoueur, page, pageMax) {
    let endSentence = "";
    if (classementJoueur != 1) {
        endSentence = getYourPlacementEmoji(classementJoueur);
        if (actualPlayer.score > 100) {
            endSentence += "**" + message.author.username + "**" + Text.commands.top.endSentenceStart + "**" + classementJoueur + Text.commands.top.endSentenceMiddle + totalJoueur + Text.commands.top.endSentenceEnd;
            let pajejoueur = Math.ceil(classementJoueur / DefaultValues.top.playersByPage);
            if (page != pajejoueur) {
                endSentence += Text.commands.top.pageSentenceStart + pajejoueur + Text.commands.top.separatorSlash + pageMax + Text.commands.top.pageSentenceEnd;
            }
        }
        else {
            endSentence += message.author.username + Text.commands.top.errorNotRanked;
        }
    }
    else {
        endSentence += Text.commands.top.winningIntro + message.author.username + Text.commands.top.winningOutro + totalJoueur + Text.commands.top.endSentenceEnd;
    }
    return endSentence;
}


/**
 * Display a player in the top
 * @param {String} messageTop - The string that will be displayed to the player
 * @param {*} player - The player that is displayed
 * @param {String} pseudo - The username of the player
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @returns {String} - The player infos
 */
function displayPlayerInfos(messageTop, player, pseudo, message) {
    messageTop += player.rank + Text.commands.top.boldEnd + pseudo;
    let temps = Math.floor((message.createdTimestamp - player.lastReport) / (1000 * 60)); //temps en minutes depuis le dernier rapport
    if (temps > 1440 * DefaultValues.top.daysBeforeInnactive) {
        messageTop += Text.commands.top.innactive;
    } else {
        if (temps > 60) {
            messageTop += Text.commands.top.availableReport;
        } else {
            if (player.effect != ":smiley:") {
                messageTop += Text.commands.top.separator + player.effect;
            }
        }
    }


    messageTop += Text.commands.top.scoreDisplayDebut + player.score + Text.commands.top.scoreDisplayFin;
    messageTop += Text.commands.top.levelDisplayDebut + player.level + Text.commands.top.levelDisplayFin;

    messageTop += Text.commands.top.endOfLineWBold;
    return messageTop;
}


/**
 * Allow to get an emoji that depend on the ranking of the player
 * @param {*} classementJoueur - The ranking of the player
 */
function getYourPlacementEmoji(classementJoueur) {
    let emoji = ""
    if (classementJoueur == 2) {
        emoji += Text.commands.top.endOfLine + Text.commands.top.secondPlaceEmoji;
    }
    else {
        if (classementJoueur == 3) {
            emoji += Text.commands.top.endOfLine + Text.commands.top.thirdPlaceEmoji;
        }
        else {
            if (classementJoueur <= 5) {
                emoji += Text.commands.top.endOfLine + Text.commands.top.top5Emoji;
            }
            else {
                if (classementJoueur <= 10) {
                    emoji += Text.commands.top.endOfLine + Text.commands.top.tada;
                }
                else {
                    emoji += Text.commands.top.endOfLine + Text.commands.top.otherEmoji;
                }
            }
        }
    }
    return emoji;
}

/**
 * Allow to display an emoji corresponding to the ranking of a player
 * @param {*} player - The player that is displayed
 * @param {String} messageTop - The string where the emoji has to be put
 * @param {*} message - The message that generated the command, used to retrieve the guild of the author of the command
 */
function getPlacementEmoji(player, messageTop, message) {
    if (player.rank == 1) {
        messageTop += Text.commands.top.firstPlaceEmoji;
    }
    else {
        if (player.rank == 2) {
            messageTop += Text.commands.top.secondPlaceEmoji;
        }
        else {
            if (player.rank == 3) {
                messageTop += Text.commands.top.thirdPlaceEmoji;
            }
            else {
                if (player.rank <= 5) {
                    messageTop += Text.commands.top.top5Emoji;
                }
                else {
                    if (message.author.id == player.discordId) {
                        messageTop += Text.commands.top.youEmoji;
                    }
                    else {
                        messageTop += Text.commands.top.otherEmoji;
                    }
                }
            }
        }
    }
    return messageTop;
}

/**
 * Allow to retrieve the page number the user want to see
 * @param {*} args - The args sent by the user
 * @returns {Integer} - The page number
 */
function getRequiredPageNumber(args) {
    let page = args[1];
    if (page == null) {
        page = 1;
    }
    page = parseInt(page, 10);
    return page;
}


module.exports.TopServCommand = TopServCommand;