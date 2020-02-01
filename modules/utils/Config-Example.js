const packageJson = require('../../package.json');

const DISCORD_CLIENT_TOKEN = ""; //put your token here
const BOT_OWNER_ID = ""; //the bot will use this to check if you can use admins commands
const BADGE_MANAGER_ID = ""; // put ids of the persons that will be able to manage badges separated by a comma 
const SUPPORT_ID = ""; // put ids of the persons that will be able to send dms with the bot separated by a comma 
const BOT_OWNER_PREFIX = "p"; // the prefix only the bot owner can use
const PREFIXLENGTH = 1; // please keep this value to 1 otherwise some stuff may have problems
const PART_OF_SCORE_REMOVED_DURING_RESPAWN = 0.1; //equals to 10 % by default

exports.DISCORD_CLIENT_TOKEN = DISCORD_CLIENT_TOKEN;
exports.BOT_OWNER_ID = BOT_OWNER_ID;
exports.BADGE_MANAGER_ID = BADGE_MANAGER_ID;
exports.SUPPORT_ID = SUPPORT_ID;
exports.BOT_OWNER_PREFIX = BOT_OWNER_PREFIX;
exports.PART_OF_SCORE_REMOVED_DURING_RESPAWN = PART_OF_SCORE_REMOVED_DURING_RESPAWN;
exports.PREFIXLENGTH = PREFIXLENGTH;
exports.version = packageJson.version;