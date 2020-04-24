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
const TopWeekCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let playerManager = new PlayerManager();
    let actualPlayer = await playerManager.getCurrentPlayer(message);
    totalJoueur = await playerManager.getNumberOfWeeklyPlayers();
    let pageMax = Math.ceil(totalJoueur / DefaultValues.TopWeek.playersByPage);
    let page = getRequiredPageNumber(args);
    let erreur = testAbsurdsPages(message, page, pageMax);
    if (erreur == 0) {
        let bornesup = page * DefaultValues.TopWeek.playersByPage
        let borneinf = bornesup - (DefaultValues.TopWeek.playersByPage - 1);
        let data = await playerManager.getTopWeekData(borneinf, bornesup)
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
 * @param {Integer} pageMax - The number of pages that are available on the TopWeek
 * @param {Integer} page - The number of the actual page that is displayed
 * @param {*} actualPlayer - The player instant of the perso who asked for the TopWeek
 * @param {Integer} totalJoueur - The account of player in the game
 * @param {*} data - The data of the page that has been required
 * @param {*} client - The bot client, used to retrieve the username of the players
 */
const generateTopMessage = function (message, borneinf, bornesup, pageMax, page, actualPlayer, totalJoueur, data, client) {
    let messageTop = Text.commands.TopWeek.introDebut + borneinf + Text.commands.TopWeek.pageNumberSeparator + bornesup + Text.commands.TopWeek.introFin;
    let classementJoueur = actualPlayer.weeklyRank;
    const embed = new Discord.RichEmbed();
    embed.setColor(DefaultValues.embed.color);
    embed.setTitle(messageTop);
    embed.setThumbnail("https://i.imgur.com/qwECDVq.png");
    if (data === null) {
        embed.setDescription(Text.commands.TopWeek.noPlayersInTop);
    } else {
        embed.setDescription("\u200b\n" + generateTopDataText(data, totalJoueur, message, client) + "\u200b");
        embed.addField(Text.commands.TopWeek.ranked, getEndSentence(classementJoueur, actualPlayer, message, totalJoueur, page, pageMax), false)
        embed.setFooter(Text.commands.TopWeek.footer + `${getResetDate()}`, "https://i.imgur.com/OpL9WpR.png");
    }
    return embed;
}

/**
 * @param {*} data - The data of the page that has been required
 * @param {*} totalJoueur - The count of player in the game
 * @param {*} message - The message that query this commannd.
 * @param {*} client - The bot client.
 */

function generateTopDataText(data, totalJoueur, message, client) {
    let messageTop = "";
    messageTop = checkPotentialDatabaseError(totalJoueur, messageTop, message);
    data.forEach(function (player) { //for each player that the bot have to display
        messageTop = getPlacementEmoji(player, messageTop, message);
        let pseudo = player.getPseudo(client);
        if (pseudo == null) {
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
        message.channel.send(Text.commands.TopWeek.errorDebut + message.author.username + Text.commands.TopWeek.invalidNumber);
        return 1;
    }
    if (page <= 0) {
        message.channel.send(Text.commands.TopWeek.errorDebut + message.author.username + Text.commands.TopWeek.invalidNumber);
        return 1;
    }
    if (page > pageMax) {
        message.channel.send(Text.commands.TopWeek.errorDebut + message.author.username + Text.commands.TopWeek.tooMuchError + pageMax);
        return 1;
    }
    return 0;
}

/**
 * Check if the TopWeek can be displayed without any problem
 * @param {Integer} totalJoueur - The count of player in the game
 * @param {String} messageTop - The string that will be displayed to the player
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @returns {String} - The eventually corrected topMessage
 */
function checkPotentialDatabaseError(totalJoueur, messageTop, message) {
    if (totalJoueur < 1) {
        messageTop = Text.commands.TopWeek.errorDebut + message.author.username + Text.commands.TopWeek.noUserError;
    }
    else {
        if (messageTop.length > 2000) {
            messageTop = Text.commands.TopWeek.errorDebut + message.author.username + Text.commands.TopWeek.tooMuchUserError;
        }
    }
    return messageTop;
}


/**
 * Allow to display information to the player about his position in the ranking
 * @param {Integer} classementJoueur - The weeklyRank of the player that asked for the TopWeek
 * @param {String} messageTop - The string that will be displayed to the player
 * @param {*} actualPlayer - The player that asked for the TopWeek
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @param {Integer} totalJoueur - The count of player in the game
 * @param {Integer} page - The current page number
 * @param {Integer} pageMax - The last page number
 * @returns {String} - The end sentence
 */
function getEndSentence(classementJoueur, actualPlayer, message, totalJoueur, page, pageMax) {
    let endSentence = ""
    if (classementJoueur != 1) {
        endSentence = getYourPlacementEmoji(classementJoueur, endSentence);
        if (actualPlayer.weeklyScore > 0) {
            endSentence += "**" + message.author.username + "**" + Text.commands.TopWeek.endSentenceStart + "**" + classementJoueur + Text.commands.TopWeek.endSentenceMiddle + totalJoueur + Text.commands.TopWeek.endSentenceEnd;
            let pajejoueur = Math.ceil(classementJoueur / DefaultValues.TopWeek.playersByPage);
            if (page != pajejoueur) {
                endSentence += Text.commands.TopWeek.pageSentenceStart + pajejoueur + Text.commands.TopWeek.separatorSlash + pageMax + Text.commands.TopWeek.pageSentenceEnd;
            }
        }
        else {
            endSentence += message.author.username + Text.commands.TopWeek.errorNotRanked;
        }
    }
    else {
        endSentence += Text.commands.TopWeek.winningIntro + message.author.username + Text.commands.TopWeek.winningOutro + totalJoueur + Text.commands.TopWeek.endSentenceEnd;
    }
    return endSentence;
}


/**
 * Display a player in the TopWeek
 * @param {String} messageTop - The string that will be displayed to the player
 * @param {*} player - The player that is displayed
 * @param {String} pseudo - The username of the player
 * @param {*} message - The original command message, used to retrieve the author and the channel
 * @returns {String} - The player infos
 */
function displayPlayerInfos(messageTop, player, pseudo, message) {
    messageTop += player.weeklyRank + Text.commands.TopWeek.boldEnd + pseudo;
    let temps = Math.floor((message.createdTimestamp - player.lastReport) / (1000 * 60)); //temps en minutes depuis le dernier rapport
    if (temps > 1440 * DefaultValues.top.daysBeforeInnactive) {
        messageTop += Text.commands.TopWeek.innactive;
    } else {
        if (temps > 60) {
            messageTop += Text.commands.TopWeek.availableReport;
        } else {
            if (player.effect != ":smiley:") {
                messageTop += Text.commands.TopWeek.separator + player.effect;
            }
        }
    }


    messageTop += Text.commands.TopWeek.scoreDisplayDebut + player.weeklyScore + Text.commands.TopWeek.scoreDisplayFin;
    messageTop += Text.commands.TopWeek.levelDisplayDebut + player.level + Text.commands.TopWeek.levelDisplayFin;

    messageTop += Text.commands.TopWeek.endOfLineWBold;
    return messageTop;
}

/**
 * Allow to get an emoji that depend on the ranking of the player
 * @param {*} classementJoueur - The ranking of the player
 * @param {*} messageTop - The string that has to be returned
 */
function getYourPlacementEmoji(classementJoueur, messageTop) {
    let emoji = ""
    if (classementJoueur == 2) {
        emoji += Text.commands.TopWeek.endOfLine + Text.commands.TopWeek.secondPlaceEmoji;
    }
    else {
        if (classementJoueur == 3) {
            emoji += Text.commands.TopWeek.endOfLine + Text.commands.TopWeek.thirdPlaceEmoji;
        }
        else {
            if (classementJoueur <= 5) {
                emoji += Text.commands.TopWeek.endOfLine + Text.commands.TopWeek.top5Emoji;
            }
            else {
                if (classementJoueur <= 10) {
                    emoji += Text.commands.TopWeek.endOfLine + Text.commands.TopWeek.tada;
                }
                else {
                    emoji += Text.commands.TopWeek.endOfLine + Text.commands.TopWeek.otherEmoji;
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
    if (player.weeklyRank == 1) {
        messageTop += Text.commands.TopWeek.firstPlaceEmoji;
    }
    else {
        if (player.weeklyRank == 2) {
            messageTop += Text.commands.TopWeek.secondPlaceEmoji;
        }
        else {
            if (player.weeklyRank == 3) {
                messageTop += Text.commands.TopWeek.thirdPlaceEmoji;
            }
            else {
                if (player.weeklyRank <= 5) {
                    messageTop += Text.commands.TopWeek.top5Emoji;
                }
                else {
                    if (message.author.id == player.discordId) {
                        messageTop += Text.commands.TopWeek.youEmoji;
                    }
                    else {
                        if (message.guild.members.find(val => val.id === player.discordId) != null) {
                            messageTop += Text.commands.TopWeek.sameGuild;
                        }
                        else {
                            messageTop += Text.commands.TopWeek.otherEmoji;
                        }
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

/**
 * Allow to retrieve the time before the leaderboard reset.
 * @returns {String} - The time formatted in a string.
 */
function getResetDate() {
    //Creating Dates
    var now = new Date(); //The current date
    var dateOfReset = new Date(); // The next Sunday
    dateOfReset.setDate(now.getDate() + (0 + (7 - now.getDay())) % 7); // Calculating next Sunday
    dateOfReset.setHours(22, 59, 59); // Defining hours, min, sec to 23, 59, 59
    //Parsing dates to moment
    var nowMoment = new moment(now);
    var momentOfReset = new moment(dateOfReset);
    //Creating the date difference string.
    const diffDays = momentOfReset.diff(nowMoment, 'days');
    const diffHours = momentOfReset.diff(nowMoment, 'hours');
    const diffMinutes = momentOfReset.diff(nowMoment, 'minutes');
    //Converting into a String
    var parsedTime = " " + diffDays + Text.commands.TopWeek.days + " " +
        (diffHours - diffDays * 24) + Text.commands.TopWeek.hours + " " +
        (diffMinutes - diffHours * 60) + Text.commands.TopWeek.minutes + ".";
    return parsedTime;
}


module.exports.TopWeekCommand = TopWeekCommand;