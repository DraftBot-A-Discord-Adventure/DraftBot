/**
 * Allow to use the potion if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const DrinkCommand = async function (language, message) {
    let entity;
    [entity] = await Entities.getOrRegister(message.author.id);
    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
        return;
    }
    let potion = await entity.Player.Inventory.getPotion();
    let embed = new discord.MessageEmbed();


    if (potion.nature == NATURE.NONE) {
        if (potion.id != JsonReader.models.inventories.potion_id) {
            //there is a potion that do nothing in the inventory
            embed.setColor(JsonReader.bot.embed.error)
                .setAuthor(format(JsonReader.commands.drink.getTranslation(language).noDrinkError, { pseudo: message.author.username }), message.author.displayAvatarURL())
                .setDescription(JsonReader.commands.drink.getTranslation(language).objectDoNothingError);
        } else {
            //there is no potion in the inventory
            embed.setColor(JsonReader.bot.embed.error)
                .setAuthor(format(JsonReader.commands.drink.getTranslation(language).noDrinkError, { pseudo: message.author.username }), message.author.displayAvatarURL())
                .setDescription(JsonReader.commands.drink.getTranslation(language).noActiveObjectdescription);
        }
    }
    if (potion.nature == NATURE.HEALTH) {
        embed.setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.drink.getTranslation(language).healthBonus, { value: potion.power }));
        entity.addHealth(potion.power);
        // TODO clear the potion of the inventory
    }
    if (potion.nature == NATURE.SPEED || potion.nature == NATURE.DEFENSE || potion.nature == NATURE.ATTACK) { //Those objects are active only during fights
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.drink.getTranslation(language).noDrinkError, { pseudo: message.author.username }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.drink.getTranslation(language).objectIsActiveDuringFights);
    }
    if (potion.nature == NATURE.HOSPITAL) {
        embed.setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.drink.getTranslation(language).hospitalBonus, { value: potion.power }));
        // TODO move lastReport to the correct new date
        // TODO clear the potion of the inventory
    }
    if (potion.nature == NATURE.MONEY) {
        embed.setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.drink.getTranslation(language).moneyBonus, { value: potion.power }));
        entity.Player.addMoney(potion.power);
        // TODO clear the potion of the inventory
    }

    await Promise.all([
        entity.save(),
        entity.Player.save(),
        entity.Player.Inventory.save()
    ]);
    return await message.channel.send(embed);
};

module.exports = {
    drink: DrinkCommand,
    dr: DrinkCommand,
};
