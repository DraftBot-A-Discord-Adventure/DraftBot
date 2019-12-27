//Discord API
const Discord = require("discord.js");

const Config = require('../../utils/Config');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    let address = '../../text/' + server.language;
    return require(address);
}


/**
 * Allow an user to change the bot display type to embed or classic.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const changeDisplayStyle = async function (message, args, client, talkedRecently, displaystyle) {
    const playerManager = new PlayerManager();

    if (displaystyle !== "embed" && displaystyle !== "classic") displaystyle = "classic";

    console.log(args[1])

    const Text = await chargeText(message);
    let player = await playerManager.getCurrentPlayer(message);

    if (args[1] !== undefined) {
        if (args[1] === "embed") 
        {
            setDisplayStyleToEmbed(Text, player, message);
        } else if (args[1] === "classic") 
        {
            setDisplayStyleToClassic(Text, player, message);
        }
    } else {
        //Creating Embed
        const embed = new Discord.RichEmbed();
        embed.setColor(Config.EMBED_COLOR);
        embed.setTitle(Text.settings.displaystyle.title2);
        embed.setDescription(Text.settings.displaystyle.description + "\n" + Text.settings.displaystyle.currentStyle + displaystyle + Text.settings.displaystyle.point);
        embed.addField(Text.settings.displaystyle.help, Text.settings.displaystyle.endSentence, false);

        //Sending it
        message.channel.send(embed);
    }

    playerManager.updatePlayer(player);
}

function setDisplayStyleToClassic(Text, player, message) {
    player.setDisplayStyle("classic")
    message.channel.send(Text.settings.displaystyle.setToClassic);

    console.log(player.getName() + " has changed his display type to classic !")
}

function setDisplayStyleToEmbed(Text, player, message) {
    player.setDisplayStyle("embed")
    message.channel.send(Text.settings.displaystyle.setToEmbed);

    console.log(player.getName() + " has changed his display type to embed !")
}

module.exports.changeDisplayStyle = changeDisplayStyle;


