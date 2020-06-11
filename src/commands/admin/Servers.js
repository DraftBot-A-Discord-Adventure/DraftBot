// const Config = require('../../utils/Config');
// const ServerManager = require('../../core/ServerManager');

/**
 * Allow an admin to check the server list
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ServersCommand = async (language, message, args) => {

    if ((await canPerformCommand(message, language,
        PERMISSION.ROLE.BOTOWNER)) !== true) {
        return;
    }

    function getInfos(guild) {
        let nbMembres = guild.members.cache.filter(member => !member.user.bot).size;
        let nbBots = guild.members.cache.filter(member => member.user.bot).size;
        let ratio = Math.round((nbBots / nbMembres) * 100);
        let validation = (ratio > 30 || nbMembres < 30 || (nbMembres < 100 && ratio > 20) ? `:white_check_mark:` : `:x:`);
        return { validation, nbMembres, nbBots, ratio };
    }

    let compteur = 0;
    let total = 0;
    let resultat = "";
    function logMapElements(guild) {
        compteur++;
        //let { validation, nbMembres, nbBot, ratio } = serverManager.getValidationInfos(guild);
        let { validation, nbMembres, nbBot, ratio } = getInfos(guild);
        total += nbMembres;
        resultat += `${validation} Server ${compteur} : **${guild}** | :bust_in_silhouette: : \`${nbMembres}\`  | :robot: : \`${nbBots}\` | Ratio bot/Humain : \`${ratio}\` %\n`;
        if (resultat.length > 1800) {
            message.channel.send(resultat);
            resultat = "";
        }
    }
    client.guilds.cache.forEach(logMapElements);
    resultat += JsonReader.commands.servs.getTranslation(language).total + ` \`${total}\``
    await message.channel.send(resultat);
};

module.exports = {
    'servs': ServersCommand
};

