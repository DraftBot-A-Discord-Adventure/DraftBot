import {generateRandomRarity} from "../../../../core/utils/ItemUtils";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Do random rarity tries
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const RarityShotTestCommand = (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const nbShots = parseInt(args[0], 10);
	if (nbShots < 0) {
		throw new Error("Erreur rarityshot : nbTirages négatif !");
	}
	const min = parseInt(args[1], 10);
	const max = parseInt(args[2], 10);
	if (min > max) {
		throw new Error("Erreur rarityshot : borne min inférieure à borne max !");
	}
	if (min > 8 || min < 1) {
		throw new Error("Erreur rarityshot : borne min hors valeur (valeurs autorisées : 1 à 8) !");
	}
	if (max > 8 || max < 1) {
		throw new Error("Erreur rarityshot : borne max hors valeur (valeurs autorisées : 1 à 8) !");
	}
	const tab = [0, 0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < nbShots; i++) {
		tab[generateRandomRarity(min, max) - 1]++;
	}
	return Promise.resolve(format(commandInfo.messageWhenExecuted, {
		nbTirages: nbShots,
		common: tab[0],
		commonPercent: Math.round(tab[0] / nbShots * 10000) / 100,
		uncommon: tab[1],
		uncommonPercent: Math.round(tab[1] / nbShots * 10000) / 100,
		exotic: tab[2],
		exoticPercent: Math.round(tab[2] / nbShots * 10000) / 100,
		rare: tab[3],
		rarePercent: Math.round(tab[3] / nbShots * 10000) / 100,
		special: tab[4],
		specialPercent: Math.round(tab[4] / nbShots * 10000) / 100,
		epic: tab[5],
		epicPercent: Math.round(tab[5] / nbShots * 10000) / 100,
		legendary: tab[6],
		legendaryPercent: Math.round(tab[6] / nbShots * 10000) / 100,
		mythic: tab[7],
		mythicPercent: Math.round(tab[7] / nbShots * 10000) / 100
	}));
};

export const commandInfo: ITestCommand = {
	name: "rarityshot",
	aliases: ["rs"],
	commandFormat: "<nbTirages> <rarityMin = 1> <rarityMax = 8>",
	typeWaited: {
		nbTirages: Constants.TEST_VAR_TYPES.INTEGER,
		rarityMin: Constants.TEST_VAR_TYPES.INTEGER,
		rarityMax: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez tiré {nbTirages} objets, vous avez obtenu {common} communs ({commonPercent}%)," +
		" {uncommon} peu communs ({uncommonPercent}%), {exotic} exotiques ({exoticPercent}%)," +
		" {rare} rares ({rarePercent}%), {special} spéciaux ({specialPercent}%), {epic} épiques ({epicPercent}%)," +
		" {legendary} légendaires ({legendaryPercent}%) et {mythic} mythiques ({mythicPercent}%)",
	description: "Fait nbTirages tirages de rareté d'objets entre les raretés rarityMin et rarityMax.",
	commandTestShouldReply: true,
	execute: RarityShotTestCommand
};