const PlayerManager = require('../classes/PlayerManager');
const Text = require('../text/Francais');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues');
const PotionManager = require('../classes/PotionManager');

/**
 * Give a random thing to a player in exchange for 100 coins
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const ShopCommand = async function (message, args, client) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    if (Tools.isANegativeNumber(player.money)) {
        let ShopMessage = Text.commands.shop.errorEmoji + message.author.username + Text.commands.shop.noMoney;
        return message.channel.send(ShopMessage);
    }
    let potionManager = new PotionManager();
    let dailyPotion = generateDailyPotion();
    let ShopMessage = generateShopMessage(dailyPotion, potionManager);
    message.channel.send(ShopMessage);

}

/**
 * Generate a random potion depending on the date
 * @returns {potion} - a random potion
 */
const generateDailyPotion = function () {
    let potionManager = new PotionManager();
    let dailyPotionSeed = Math.round(Date.now() / (1000 * 60 * 60 * 24));
    let dailyPotion = potionManager.getPotionById(dailyPotionSeed % (DefaultValues.raritiesGenerator.numberOfPotion - 1) + 1);
    while (dailyPotion.rareness == 8 || dailyPotion.natureEffect == 0) {
        dailyPotionSeed = Math.round(dailyPotionSeed/7);
        dailyPotion = potionManager.getPotionById(dailyPotionSeed % DefaultValues.raritiesGenerator.numberOfPotion);
    }
    return dailyPotion;
}

/**
 * Display the list of item that is available to buy
 * @param {*} dailyPotion - The potion that has to be displayed
 * @param {*} potionManager - The potion manager
 */
function generateShopMessage(dailyPotion, potionManager) {
    let potionPrice = dailyPotion.getValue() + parseInt(DefaultValues.shop.addedValue);
    let ShopMessage = Text.commands.shop.intro + potionManager.displayPotion(dailyPotion) + Text.commands.shop.priceTagStart + potionPrice + Text.commands.shop.priceTagEnd + Text.commands.shop.outro;
    return ShopMessage;
}

module.exports.ShopCommand = ShopCommand;





