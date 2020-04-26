const appConfig = require("config/app.json");
const packageConfig = require("draftbot/package.json");

/**
 *
 * @type {{DISCORD_CLIENT_TOKEN: string, BOT_OWNER_ID: string, BADGE_MANAGER_IDS: string, SUPPORT_IDS: string, BOT_OWNER_PREFIX: string, PART_OF_SCORE_REMOVED_DURING_RESPAWN: number, MAIN_SERVER_ID: string, CONSOLE_CHANNEL_ID: string, FRENCH_ANNOUNCEMENT_CHANNEL_ID: string, ENGLISH_ANNOUNCEMENT_CHANNEL_ID: string, SUPPORT_CHANNEL_ID: string, BLACKLIST: string, TRASH_DM_CHANNEL_ID: string, ENGLISH_CHANNEL_ID: string} & {version: string}}
 */
module.exports = Object.assign(appConfig, {version: packageConfig.version});
