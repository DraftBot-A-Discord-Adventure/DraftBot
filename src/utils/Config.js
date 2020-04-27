const appConfig = require("config/app.json");
const packageConfig = require("draftbot/package.json");
const DefaultValues = require('data/text/DefaultValues');
const Console = require('data/text/Console');
const textEn = require('data/text/en');
const textFr = require('data/text/fr');

/**
 *
 * @type {any}
 */
module.exports = Object.assign(appConfig, {version: packageConfig.version}, DefaultValues, Console, {
    text: {
        "en": textEn,
        "fr": textFr
    }
});
