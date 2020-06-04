/**
 * Allow an admin to list all items
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const listItemsCommand = async function (language, message, args) {
    if ((await canPerformCommand(message, language, PERMISSION.ROLE.BOTOWNER)) !== true) {
        return;
      }
    var fs = require('fs');
    let embed = new discord.MessageEmbed();
    let embedArmor = new discord.MessageEmbed();
    embed.setColor(JsonReader.bot.embed.default)
    .setAuthor(format(JsonReader.commands.listItems.getTranslation(language).title, { pseudo: message.author.username }), message.author.displayAvatarURL())
    await message.channel.send(embed);

    //Delete all old list
    try {
        fs.statSync('allArmors.txt');
        fs.unlinkSync('allArmors.txt');
    }catch (err) {}
    try {
        fs.statSync('allWeapons.txt');
        fs.unlinkSync('allWeapons.txt');
    }catch (err) {}
    try {
        fs.statSync('allPotions.txt');
        fs.unlinkSync('allPotions.txt');
    }catch (err) {}
    try {
        fs.statSync('allItems.txt');
        fs.unlinkSync('allItems.txt');
    }catch (err) {}
    try {
        fs.statSync('allObjects.txt');
        fs.unlinkSync('allObjects.txt');
    }catch (err) {}

    //List armors
    files = fs.readdirSync("ressources/text/armors");
    fs.appendFileSync('allItems.txt', "ALL ARMORS :\n");
    files.forEach(function(file) {
        if(file!="0.json"){
            let data = fs.readFileSync("ressources/text/armors/"+file);
            let armor = JSON.parse(data);
            if(language=="fr"){
                var string = armor.translations[language] + ' - Rareté: ' + armor.rarity + ' - Défense brute: ' + armor.rawDefense;
            }
            if(language=="en"){
                var string = armor.translations[language] + ' - Rarity: ' + armor.rarity + ' - Raw defense: ' + armor.rawDefense;
            }
            fs.appendFileSync('allArmors.txt', string+"\n");
            fs.appendFileSync('allItems.txt', string+"\n");
        }
    });
    fs.appendFileSync('allItems.txt', "\n");
    message.channel.send({
        files: [{
            attachment: 'allArmors.txt',
            name: 'allArmors.txt',
            }],
    });

    //List weapons
    files = fs.readdirSync("ressources/text/weapons");
    fs.appendFileSync('allItems.txt', "ALL WEAPONS :\n");
    files.forEach(function(file) {
        if(file!="0.json"){
            let data = fs.readFileSync("ressources/text/weapons/"+file);
            let weapons = JSON.parse(data);
            if(language=="fr"){
                var string = weapons.translations[language] + ' - Rareté: ' + weapons.rarity + ' - Attaque brute: ' + weapons.rawAttack;
            }
            if(language=="en"){
                var string = weapons.translations[language] + ' - Rarity: ' + weapons.rarity + ' - Raw attack: ' + weapons.rawAttack;
            }
            fs.appendFileSync('allWeapons.txt', string+"\n");
            fs.appendFileSync('allItems.txt', string+"\n");
        }
    });
    fs.appendFileSync('allItems.txt', "\n");
    message.channel.send({
        files: [{
            attachment: 'allWeapons.txt',
            name: 'allWeapon.txt',
            }],
    });

    //List potions
    files = fs.readdirSync("ressources/text/potions");
    fs.appendFileSync('allItems.txt', "ALL POTIONS :\n");
    files.forEach(function(file) {
        if(file!="0.json"){
            let data = fs.readFileSync("ressources/text/potions/"+file);
            let Potions = JSON.parse(data);
            if(language=="fr"){
                var string = Potions.translations[language] + ' - Rareté: ' + Potions.rarity + ' - Pouvoir: ' + Potions.power + ' - Nature: ' + Potions.nature;
            }
            if(language=="en"){
                var string = Potions.translations[language] + ' - Rarity: ' + Potions.rarity + ' - Power: ' + Potions.power + ' - Nature: ' + Potions.nature;
            }
            fs.appendFileSync('allPotions.txt', string+"\n");
            fs.appendFileSync('allItems.txt', string+"\n");
        }
    });
    fs.appendFileSync('allItems.txt', "\n");
    message.channel.send({
        files: [{
            attachment: 'allPotions.txt',
            name: 'allPotions.txt',
            }],
    });

    //List Objects
    files = fs.readdirSync("ressources/text/objects");
    fs.appendFileSync('allItems.txt', "ALL OBJECTS :\n");
    files.forEach(function(file) {
        if(file!="0.json"){
            let data = fs.readFileSync("ressources/text/objects/"+file);
            let Objects = JSON.parse(data);
            if(language=="fr"){
                var string = Objects.translations[language] + ' - Rareté: ' + Objects.rarity + ' - Pouvoir: ' + Objects.power + ' - Nature: ' + Objects.nature;
            }
            if(language=="en"){
                var string = Objects.translations[language] + ' - Rarity: ' + Objects.rarity + ' - Power: ' + Objects.power + ' - Nature: ' + Objects.nature;
            }
            fs.appendFileSync('allObjects.txt', string+"\n");
            fs.appendFileSync('allItems.txt', string+"\n");
        }
    });
    fs.appendFileSync('allItems.txt', "\n");
    message.channel.send({
        files: [{
            attachment: 'allObjects.txt',
            name: 'allObjects.txt',
            }],
    });

    message.channel.send({
        files: [{
            attachment: 'allItems.txt',
            name: 'allItems.txt',
            }],
    });
};

module.exports = {
    'list': listItemsCommand,
  };