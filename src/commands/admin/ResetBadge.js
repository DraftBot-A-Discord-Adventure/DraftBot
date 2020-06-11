// const Config = require('../../utils/Config');
// const PlayerManager = require('../../core/PlayerManager');

/**
 * Allow an admin to reset the badges of somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ResetBadgeCommand = async (language, message, args) => {
    if ((await canPerformCommand(message, language,
        PERMISSION.ROLE.BADGEMANAGER)) !== true) {
        return;
    }

    //A TESTER

    let [entity] = await Entities.getOrRegister(message.mentions.users.last().id);

    //let playerManager = new PlayerManager();
    //let playerId = message.mentions.users.last().id;
    //let player = await playerManager.getPlayerById(playerId, message);
    entity.Player.badges = "";
    //playerManager.updatePlayer(player);
    await Promise.all([
        entity.save(),
        entity.Player.save()
    ]);
    await message.channel.send(":white_check_mark: | " + JsonReader.commands.resetb.getTranslation(language).res_ok);

};

module.exports = {
    'resetb': ResetBadgeCommand
};
