/**
 * Displays the inventory of a player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InventoryCommand = async (language, message, args) => {

    let player = undefined;
    if (args.length === 0) {
        player = await getRepository('player').getByMessageOrCreate(message);
    }
    else {
        //TODO 2.0 other player inventory
    }

    if (player.effect === ":baby:") {
        await message.channel.send(format(JsonReader.commands.inventory.getTranslation(language).playerNotFound, {author: message.author}));
        return;
    }

    let inv = await getRepository('inventory').getByPlayerId(player.discordId);
    let embedList = await inv.embedInventory(language, player.getPseudo(language));
    let embed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.color)
        .setTitle(embedList.shift())
        .addFields(embedList);
    await message.channel.send(embed);
};

module.exports = {
    'inventory': InventoryCommand,
    'inv': InventoryCommand
};
