import {ICommand} from "../ICommand";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import * as fs from "fs";

/**
 * Allow an admin to list all items
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const listItemsModule = Translations.getModule("commands.listItems", language);
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(listItemsModule.get("title"), interaction.user)
		]
	});

	// Delete all old list
	try {
		fs.statSync("allArmors.txt");
		fs.unlinkSync("allArmors.txt");
	}
	catch (err) {
		console.log("Cannot send allArmors.txt: " + err);
	}
	try {
		fs.statSync("allWeapons.txt");
		fs.unlinkSync("allWeapons.txt");
	}
	catch (err) {
		console.log("Cannot send allWeapons.txt: " + err);
	}
	try {
		fs.statSync("allPotions.txt");
		fs.unlinkSync("allPotions.txt");
	}
	catch (err) {
		console.log("Cannot send allPotions.txt: " + err);
	}
	try {
		fs.statSync("allItems.txt");
		fs.unlinkSync("allItems.txt");
	}
	catch (err) {
		console.log("Cannot send allItems.txt: " + err);
	}
	try {
		fs.statSync("allObjects.txt");
		fs.unlinkSync("allObjects.txt");
	}
	catch (err) {
		console.log("Cannot send allObjects.txt: " + err);
	}

	// List armors
	let files = fs.readdirSync("resources/text/armors");
	fs.appendFileSync("allItems.txt", "ALL ARMORS :\n");
	files.forEach(function(file: string) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/armors/" + file);
			const armor = JSON.parse(data.toString());
			let string;
			if (language === Constants.LANGUAGE.FRENCH) {
				string = armor.translations[language] + " - Rareté: " + armor.rarity + " - Défense brute: " + armor.rawDefense;
			}
			if (language === Constants.LANGUAGE.ENGLISH) {
				string = armor.translations[language] + " - Rarity: " + armor.rarity + " - Raw defense: " + armor.rawDefense;
			}
			fs.appendFileSync("allArmors.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	await interaction.followUp({
		files: [{
			attachment: "allArmors.txt",
			name: "allArmors.txt"
		}]
	});

	// List weapons
	files = fs.readdirSync("resources/text/weapons");
	fs.appendFileSync("allItems.txt", "ALL WEAPONS :\n");
	files.forEach(function(file: string) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/weapons/" + file);
			const weapons = JSON.parse(data.toString());
			let string;
			if (language === Constants.LANGUAGE.FRENCH) {
				string = weapons.translations[language] + " - Rareté: " + weapons.rarity + " - Attaque brute: " + weapons.rawAttack;
			}
			if (language === Constants.LANGUAGE.ENGLISH) {
				string = weapons.translations[language] + " - Rarity: " + weapons.rarity + " - Raw attack: " + weapons.rawAttack;
			}
			fs.appendFileSync("allWeapons.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	await interaction.followUp({
		files: [{
			attachment: "allWeapons.txt",
			name: "allWeapon.txt"
		}]
	});

	// List potions
	files = fs.readdirSync("resources/text/potions");
	fs.appendFileSync("allItems.txt", "ALL POTIONS :\n");
	files.forEach(function(file: string) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/potions/" + file);
			const Potions = JSON.parse(data.toString());
			let string;
			if (language === Constants.LANGUAGE.FRENCH) {
				string = Potions.translations[language] + " - Rareté: " + Potions.rarity + " - Pouvoir: " + Potions.power + " - Nature: " + Potions.nature;
			}
			if (language === Constants.LANGUAGE.ENGLISH) {
				string = Potions.translations[language] + " - Rarity: " + Potions.rarity + " - Power: " + Potions.power + " - Nature: " + Potions.nature;
			}
			fs.appendFileSync("allPotions.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	await interaction.followUp({
		files: [{
			attachment: "allPotions.txt",
			name: "allPotions.txt"
		}]
	});

	// List Objects
	files = fs.readdirSync("resources/text/objects");
	fs.appendFileSync("allItems.txt", "ALL OBJECTS :\n");
	files.forEach(function(file: string) {
		if (file !== "0.json") {
			const data = fs.readFileSync("resources/text/objects/" + file);
			const Objects = JSON.parse(data.toString());
			let string;
			if (language === Constants.LANGUAGE.FRENCH) {
				string = Objects.translations[language] + " - Rareté: " + Objects.rarity + " - Pouvoir: " + Objects.power + " - Nature: " + Objects.nature;
			}
			if (language === Constants.LANGUAGE.ENGLISH) {
				string = Objects.translations[language] + " - Rarity: " + Objects.rarity + " - Power: " + Objects.power + " - Nature: " + Objects.nature;
			}
			fs.appendFileSync("allObjects.txt", string + "\n");
			fs.appendFileSync("allItems.txt", string + "\n");
		}
	});
	fs.appendFileSync("allItems.txt", "\n");
	await interaction.followUp({
		files: [{
			attachment: "allObjects.txt",
			name: "allObjects.txt"
		}]
	});

	await interaction.followUp({
		files: [{
			attachment: "allItems.txt",
			name: "allItems.txt"
		}]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.listItems", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.listItems", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		}),
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};