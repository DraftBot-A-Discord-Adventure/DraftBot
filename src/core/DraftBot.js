/**
 * @class
 */
class DraftBot {
    /**
     * @return {Promise<DraftBot>}
     */
    static async init() {
        await (require('core/JsonReader')).init({
            folders: ['ressources/text/commands', 'ressources/text/models'],
            files: [
                'config/app.json',
                'draftbot/package.json',
                'ressources/text/error.json',
                'ressources/text/bot.json',
                'ressources/text/values.json',
                'ressources/text/items.json',
            ],
        });
        await (require('core/Database')).init();
        await (require('core/Command')).init();

        // TODO 2.1
        // draftbot.checkEasterEggsFile();

        DraftBot.programTopWeekTimeout();
        setTimeout(DraftBot.fightPowerRegenerationLoop, FIGHT.POINTS_REGEN_MINUTES*60*1000);

        require('core/DBL').startDBLWebhook();

        return this;
    }

    /**
     * Programs a timeout for the next sunday midnight
     */
    static programTopWeekTimeout() {
        let millisTill = getNextSundayMidnight() - new Date();
        if (millisTill === 0) { //Case at 0:00:00
            setTimeout(DraftBot.programTopWeekTimeout, 1);
            return;
        }
        setTimeout(DraftBot.topWeekEnd, millisTill);
    }

    /**
     * Handle the top week reward and reset
     * @return {Promise<void>}
     */
    static async topWeekEnd() {
        let winner = await Entities.findOne({
            defaults: {
                Player: {
                    Inventory: {}
                }
            },
            include: [{
                model: Players,
                as: 'Player',
                where: {
                    weeklyScore: {
                        [(require('sequelize/lib/operators')).gt]: 100,
                    },
                },
            }],
            order: [
                [{ model: Players, as: 'Player' }, 'weeklyScore', 'DESC'],
                [{ model: Players, as: 'Player' }, 'level', 'DESC']
            ],
            limit: 1
        });
        if (winner !== null) {
            (await client.channels.fetch(JsonReader.app.FRENCH_ANNOUNCEMENT_CHANNEL_ID)).send(format(JsonReader.bot.getTranslation("fr").topWeekAnnouncement, { mention: winner.getMention() }));
            (await client.channels.fetch(JsonReader.app.ENGLISH_ANNOUNCEMENT_CHANNEL_ID)).send(format(JsonReader.bot.getTranslation("en").topWeekAnnouncement, { mention: winner.getMention() }));
            winner.Player.addBadge("🎗️");
            winner.Player.save();
        }
        Players.update({ weeklyScore: 0 }, { where: {} });
        console.log("# WARNING # Weekly leaderboard has been reset !");
        DraftBot.programTopWeekTimeout();
    }

    static async fightPowerRegenerationLoop() {
        const sequelize = require('sequelize');
        await Entities.update({ fightPointsLost: sequelize.literal(`CASE WHEN fightPointsLost - ${FIGHT.POINTS_REGEN_AMOUNT} < 0 THEN 0 ELSE fightPointsLost - ${FIGHT.POINTS_REGEN_AMOUNT} END`)}, {where: { fightPointsLost: {[sequelize.Op.not]: 0}}});
        setTimeout(DraftBot.fightPowerRegenerationLoop, FIGHT.POINTS_REGEN_MINUTES*60*1000);
    }

    /**
     * TODO 2.1
     * Checks if the easter eggs file exists and copy the default one if not
     */
    // checkEasterEggsFile() {
    //
    //   let EasterEggs = require("./src/utils/eastereggs/EasterEggs");
    //   EasterEggs.init();
    //
    //   const fs = require('fs');
    //   if (!fs.existsSync('./src/utils/eastereggs/EasterEggs.js')) {
    //     fs.copyFileSync('./src/utils/eastereggs/EasterEggs.js.default',
    //         './src/utils/eastereggs/EasterEggs.js', (err) => {
    //           if (err) throw err;
    //         });
    //     console.warn(
    //         './src/utils/eastereggs/EasterEggs.js not found. ./src/utils/eastereggs/EasterEggs.js.default copied to be used.');
    //     console.warn(
    //         'Ignore this message if you don\'t have the key to decrypt the file.');
    //   }
    // }
}

/**
 * @type {{init: (function(): DraftBot)}}
 */
module.exports = {
    init: DraftBot.init,
};
/**
 * @type {module:"discord.js"}
 */
global.discord = (require('discord.js'));
/**
 * @type {module:"discord.js".Client}
 */
global.client = new(require('discord.js')).Client({ restTimeOffset: 0 });