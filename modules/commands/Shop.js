const PlayerManager = require('../classes/PlayerManager');
const ServerManager = require('../classes/ServerManager');
let Text;
let language;
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues');
const PotionManager = require('../classes/PotionManager');
const InventoryManager = require('../classes/InventoryManager');


/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to get the language the bot has to respond with
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {string} - the code of the server language
 */
const detectLanguage = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    return server.language;
}

/**
 * Give a random thing to a player in exchange for 100 coins
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const ShopCommand = async function (message, args, client, talkedRecently) {
    Text = await chargeText(message);
    language = await detectLanguage(message);
    if (talkedRecently.has(message.author.id)) {
        message.channel.send(Text.commands.shop.cancelStart + message.author + Text.commands.shop.tooMuchShop);
    } else {
        let playerManager = new PlayerManager();
        let player = await playerManager.getCurrentPlayer(message);
        if (playerManager.checkState(player, message, ":dizzy_face::sick::zzz::head_bandage::snowflake::confounded::clock2::smiley:", language)) {
            if (Tools.isANegativeNumber(player.money)) {
                let ShopMessage = Text.commands.shop.errorEmoji + message.author.username + Text.commands.shop.noMoney;
                return message.channel.send(ShopMessage);
            }
            talkedRecently.add(message.author.id);
            let potionManager = new PotionManager();
            let dailyPotion = generateDailyPotion();
            let ShopMessage = generateShopMessage(dailyPotion, potionManager, language);
            message.channel.send(ShopMessage).then(async msg => {
                await addShopReactions(dailyPotion, msg);

                let shopmenu = false;

                const filter = (reaction, user) => {
                    return (choiceReactionIsCorrect(reaction, dailyPotion, shopmenu) && user.id === message.author.id);
                };
                const collector = msg.createReactionCollector(filter, {
                    time: 120000
                });
                //execute this if a user answer to the event
                collector.on('collect', async (reaction) => {
                    shopmenu = true;
                    let choice = 0;
                    let messageChoice = Text.commands.shop.emojiIntro + message.author + Text.commands.shop.confirmIntro;
                    let potionPrice = dailyPotion.getValue() + parseInt(DefaultValues.shop.addedValue);
                    switch (reaction.emoji.name) {
                        case Text.commands.shop.emojis.a:
                            choice = "a";
                            messageChoice += Text.commands.shop.choices[choice] + Text.commands.shop.infos[choice];
                            break;
                        case Text.commands.shop.emojis.b:
                            choice = "b";
                            messageChoice += Text.commands.shop.choices[choice] + Text.commands.shop.infos[choice];
                            break;
                        case Text.commands.shop.emojis.c:
                            choice = "c";
                            messageChoice += Text.commands.shop.choices[choice] + Text.commands.shop.infos[choice];
                            break;
                        case Text.commands.shop.emojis.d:
                            choice = "d";
                            messageChoice += Text.commands.shop.choices[choice] + Text.commands.shop.infos[choice];
                            break;
                        default:
                            choice = "aa";
                            messageChoice += potionManager.displayPotion(dailyPotion, language) + Text.commands.shop.priceTagStart + potionPrice + Text.commands.shop.priceTagEnd + Text.commands.shop.infos.aa;
                            break;
                    }
                    let messageconfirm = await displayConfirmMessage(message, messageChoice);
                    let confirmIsOpen = true;
                    const filterConfirm = (reaction, user) => {
                        return (confirmReactionIsCorrect(reaction) && user.id === message.author.id);
                    };
                    const collectorConfirm = messageconfirm.createReactionCollector(filterConfirm, {
                        time: 120000
                    });
                    //execute this if a user answer to the event
                    collectorConfirm.on('collect', async (reaction) => {
                        if (confirmIsOpen) {
                            confirmIsOpen = false;
                            talkedRecently.delete(message.author.id);
                            if (reaction.emoji.name == "✅") {
                                switch (choice) {
                                    case "aa":
                                        if (player.money >= potionPrice) {
                                            await sellDailyPotion(player, dailyPotion, potionPrice, playerManager);
                                        } else {
                                            return notEnoughMoney(message);
                                        }
                                        break;
                                    case "a":
                                        if (player.money >= DefaultValues.shop.priceItem) {
                                            player = await playerManager.giveRandomItem(message, player);
                                            player.money -= DefaultValues.shop.priceItem;
                                            playerManager.updatePlayer(player);
                                        } else {
                                            return notEnoughMoney(message);
                                        }
                                        break;
                                    case "b":
                                        if (player.money >= DefaultValues.shop.priceStatus) {
                                            player.updateLastReport(message.createdTimestamp, 0, ":smiley:");
                                            player.money -= DefaultValues.shop.priceStatus;
                                            player.effect = ":smiley:";
                                            console.log(player)
                                            playerManager.updatePlayer(player);
                                        } else {
                                            return notEnoughMoney(message);
                                        }
                                        break;
                                    case "c":
                                        if (player.money >= DefaultValues.shop.priceHeal) {
                                            player.money -= DefaultValues.shop.priceHeal;
                                            player.restoreHealthCompletely()
                                            playerManager.updatePlayer(player);
                                        } else {
                                            return notEnoughMoney(message);
                                        }
                                        break;
                                    case "d":
                                        if (player.money >= DefaultValues.shop.priceBadge) {
                                            message.author.send(Text.commands.shop.badgeWarning);
                                            client.users.get('375334479306293260').send(Text.commands.shop.dmIntro + message.author + Text.commands.shop.dm + message.author.id);
                                            player.money -= DefaultValues.shop.priceBadge;
                                            playerManager.updatePlayer(player);
                                        } else {
                                            return notEnoughMoney(message);
                                        }
                                        break;

                                    default:
                                        break;
                                }
                                message.channel.send(Text.commands.shop.confirmStart + message.author + Text.commands.shop.confirmEnd);
                            } else {
                                message.channel.send(Text.commands.shop.cancelStart + message.author + Text.commands.shop.cancelEnd);
                            }
                        }
                    });
                    //end of the time the user have to answer to the event
                    collectorConfirm.on('end', () => {
                        if (confirmIsOpen) {
                            talkedRecently.delete(message.author.id);
                            message.channel.send(Text.commands.shop.cancelStart + message.author + Text.commands.shop.cancelEnd);
                        }
                    });
                });

                //end of the time the user have to answer to the event
                collector.on('end', () => {
                    if (!shopmenu) {
                        talkedRecently.delete(message.author.id);
                    }
                });
            });
        }
    }
}

/**
 * send a confirmation and display reactions
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} confirmMessage - The string of the confirmation message
 */
const displayConfirmMessage = function (message, confirmMessage) {
    return message.channel.send(confirmMessage).then(async msg => {
        let valid = "✅"
        await msg.react(valid);
        let notValid = "❌"
        msg.react(notValid);
        return msg;
    })
};

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @param {Boolean} shopmenu - An option has not already been selected
* @param {*} dailyPotion - the potion of the day
* @returns {Boolean} - true is the reaction is correct
*/
const choiceReactionIsCorrect = function (reaction, dailyPotion, shopmenu) {
    let contains = false;
    if (!shopmenu && (reaction.emoji.name == dailyPotion.getEmoji().split(':')[1] || reaction.emoji.name == dailyPotion.getEmoji() || reaction.emoji.name == Text.commands.shop.emojis.a || reaction.emoji.name == Text.commands.shop.emojis.b || reaction.emoji.name == Text.commands.shop.emojis.c || reaction.emoji.name == Text.commands.shop.emojis.d)) {
        contains = true;
    }
    return contains
}

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @returns {Boolean} - true is the reaction is correct
*/
const confirmReactionIsCorrect = function (reaction) {
    let contains = false;
    if (reaction.emoji.name == "✅" || reaction.emoji.name == "❌") {
        contains = true;
    }
    return contains
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
        dailyPotionSeed = Math.round(dailyPotionSeed / 7);
        dailyPotion = potionManager.getPotionById(1+(dailyPotionSeed % (DefaultValues.raritiesGenerator.numberOfPotion-1)));
    }
    return dailyPotion;
}

/**
 * Give the daily potion to the player in exchange of the value of the potion
 * @param {*} player - The player that will pay for the potion
 * @param {*} dailyPotion - The potion that has to be given
 * @param {*} potionPrice - The value of the potion
 * @param {*} playerManager - The player Manager
 */
async function sellDailyPotion(player, dailyPotion, potionPrice, playerManager) {
    let inventoryManager = new InventoryManager();
    let inventory = await inventoryManager.getInventoryById(player.id);
    inventory["potionId"] = dailyPotion.id;
    inventoryManager.updateInventory(inventory);
    player.money -= potionPrice;
    playerManager.updatePlayer(player);
}

/**
 * Send a message to warn the user he doesnt have enough money
 * @param {*} message - The message that launched the command
 */
function notEnoughMoney(message) {
    return message.channel.send(Text.commands.shop.cancelStart + message.author + Text.commands.shop.notEnoughEnd);
}

/**
 * Allow to add the reactions under the shop message
 * @param {*} dailyPotion - The potion of the day
 * @param {*} msg - The message that contain the shop message
 */
async function addShopReactions(dailyPotion, msg) {
    try {
        await msg.react(dailyPotion.getEmoji(dailyPotion));
    } catch (err) {
        let emojiId = dailyPotion.getEmoji(dailyPotion).split(':')[2];
        emojiId = emojiId.substring(0, emojiId.length - 1);
        await msg.react(emojiId);
    }
    for (reac in Text.commands.shop.emojis) {
        await msg.react(Text.commands.shop.emojis[reac]);
    }
}

/**
 * Display the list of item that is available to buy
 * @param {*} dailyPotion - The potion that has to be displayed
 * @param {*} potionManager - The potion manager
 */
function generateShopMessage(dailyPotion, potionManager, language) {
    let potionPrice = dailyPotion.getValue() + parseInt(DefaultValues.shop.addedValue);
    let ShopMessage = Text.commands.shop.intro + potionManager.displayPotion(dailyPotion, language) + Text.commands.shop.priceTagStart + potionPrice + Text.commands.shop.priceTagEnd + Text.commands.shop.outro;
    return ShopMessage;
}

module.exports.ShopCommand = ShopCommand;





