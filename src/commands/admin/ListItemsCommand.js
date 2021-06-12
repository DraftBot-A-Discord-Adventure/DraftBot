/**
 * Allow an admin to list all items
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const listItemsCommand = async function(language, message) {
	if (await canPerformCommand(message, language, PERMISSION.ROLE.BOT_OWNER) !== true) {
		return;
	}
	const fs = require("fs");
	await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.listItems.getTranslation(language).title, message.author));

	// Delete all old list
	try {
		fs.statSync("allArmors.txt");
		fs.unlinkSync("allArmors.txt");
	}
	catch (err) {
		log("Cannot send allArmors.txt: " + err);
	}
	try {
		fs.statSync("allWeapons.txt");
		fs.unlinkSync("allWeapons.txt");
	}
	catch (err) {
		log("Cannot send allWeapons.txt: " + err);
	}
	try {
		fs.statSync("allPotions.txt");
		fs.unlinkSync("allPotions.txt");
	}
	catch (err) {
		log("Cannot send allPotions.txt: " + err);
	}
	try {
		fs.statSync("allItems.txt");
		fs.unlinkSync("allItems.txt");
	}
	catch (err) {
		log("Cannot send allItems.txt: " + err);
	}
	try {
		fs.statSync("allObjects.txt");
		fs.unlinkSync("allObjects.txt");
	}
	catch (err) {
		log("Cannot send allObjects.txt: " + err);
	}

	// List armors
	let files = fs.readdirSync("resources/text/armors");
	fs.appendFileSync("allItems.txt", "ALL ARMORS :\n");
	files.forEach(function(file) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/armors/" + file);
			const armor = JSON.parse(data);
			let string;
			if (language === LANGUAGE.FRENCH) {
				string = armor.translations[language] + " - Rareté: " + armor.rarity + " - Défense brute: " + armor.rawDefense;
			}
			if (language === LANGUAGE.ENGLISH) {
				string = armor.translations[language] + " - Rarity: " + armor.rarity + " - Raw defense: " + armor.rawDefense;
			}
			fs.appendFileSync("allArmors.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	message.channel.send({
		files: [{
			attachment: "allArmors.txt",
			name: "allArmors.txt"
		}]
	});

	// List weapons
	files = fs.readdirSync("resources/text/weapons");
	fs.appendFileSync("allItems.txt", "ALL WEAPONS :\n");
	files.forEach(function(file) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/weapons/" + file);
			const weapons = JSON.parse(data);
			let string;
			if (language === LANGUAGE.FRENCH) {
				string = weapons.translations[language] + " - Rareté: " + weapons.rarity + " - Attaque brute: " + weapons.rawAttack;
			}
			if (language === LANGUAGE.ENGLISH) {
				string = weapons.translations[language] + " - Rarity: " + weapons.rarity + " - Raw attack: " + weapons.rawAttack;
			}
			fs.appendFileSync("allWeapons.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	message.channel.send({
		files: [{
			attachment: "allWeapons.txt",
			name: "allWeapon.txt"
		}]
	});

	// List potions
	files = fs.readdirSync("resources/text/potions");
	fs.appendFileSync("allItems.txt", "ALL POTIONS :\n");
	files.forEach(function(file) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/potions/" + file);
			const Potions = JSON.parse(data);
			let string;
			if (language === LANGUAGE.FRENCH) {
				string = Potions.translations[language] + " - Rareté: " + Potions.rarity + " - Pouvoir: " + Potions.power + " - Nature: " + Potions.nature;
			}
			if (language === LANGUAGE.ENGLISH) {
				string = Potions.translations[language] + " - Rarity: " + Potions.rarity + " - Power: " + Potions.power + " - Nature: " + Potions.nature;
			}
			fs.appendFileSync("allPotions.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	message.channel.send({
		files: [{
			attachment: "allPotions.txt",
			name: "allPotions.txt"
		}]
	});

	// List Objects
	files = fs.readdirSync("resources/text/objects");
	fs.appendFileSync("allItems.txt", "ALL OBJECTS :\n");
	files.forEach(function(file) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/objects/" + file);
			const Objects = JSON.parse(data);
			let string;
			if (language === LANGUAGE.FRENCH) {
				string = Objects.translations[language] + " - Rareté: " + Objects.rarity + " - Pouvoir: " + Objects.power + " - Nature: " + Objects.nature;
			}
			if (language === LANGUAGE.ENGLISH) {
				string = Objects.translations[language] + " - Rarity: " + Objects.rarity + " - Power: " + Objects.power + " - Nature: " + Objects.nature;
			}
			fs.appendFileSync("allObjects.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	message.channel.send({
		files: [{
			attachment: "allObjects.txt",
			name: "allObjects.txt"
		}]
	});

	message.channel.send({
		files: [{
			attachment: "allItems.txt",
			name: "allItems.txt"
		}]
	});
};

module.exports = {
	commands: [
		{
			name: "list",
			func: listItemsCommand
		}
	]
};
