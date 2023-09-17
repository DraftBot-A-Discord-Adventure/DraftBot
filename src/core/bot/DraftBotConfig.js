"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
var toml_1 = require("toml");
var fs_1 = require("fs");
/**
 * Loads the config from the config file
 */
function loadConfig() {
    var config = (0, toml_1.parse)((0, fs_1.readFileSync)(process.cwd() + "/config/config.toml", "utf-8"));
    return {
        BADGE_MANAGER_ROLE: config.discord.roles.badge_manager_ids,
        BOT_OWNER_ID: config.discord.users.owner_id,
        CONSOLE_CHANNEL_ID: config.discord.channels.console_channel_id,
        CONTRIBUTORS_CHANNEL: config.discord.channels.contributor_channel,
        CONTRIBUTOR_ROLE: config.discord.roles.contributor_role_id,
        DBL_LOGS_CHANNEL: config.discord_bot_list.channel_id,
        DBL_TOKEN: config.discord_bot_list.token,
        DBL_VOTE_ROLE: config.discord_bot_list.vote_role_id,
        DBL_WEBHOOK_PORT: config.discord_bot_list.webhook_port,
        DBL_WEBHOOK_URL: config.discord_bot_list.webhook_url,
        DISCORD_CLIENT_TOKEN: config.discord.general.token,
        DM_MANAGER_ID: config.discord.users.dm_manager_id,
        ENGLISH_ANNOUNCEMENT_CHANNEL_ID: config.discord.channels.english_announcements_channel_id,
        ENGLISH_CHANNEL_ID: config.discord.channels.english_channel_id,
        FRENCH_ANNOUNCEMENT_CHANNEL_ID: config.discord.channels.french_announcements_channel_id,
        MAIN_SERVER_ID: config.discord.general.main_server_id,
        MODE_MAINTENANCE: config.bot.maintenance,
        NASA_API_KEY: config.others.nasa_api_key,
        TEST_MODE: config.bot.test_mode,
        MARIADB_HOST: config.database.host,
        MARIADB_USER: config.database.user,
        MARIADB_PASSWORD: config.database.password,
        MARIADB_ROOT_PASSWORD: config.database.root_password,
        MARIADB_PORT: config.database.port,
        MARIADB_PREFIX: config.database.prefix,
        WEBSERVER_PORT: config.others.webserver_port
    };
}
exports.loadConfig = loadConfig;
