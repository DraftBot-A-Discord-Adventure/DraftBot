import {generateRandomRarity} from "../../../../core/utils/ItemUtils";
import {format} from "../../../../core/utils/StringFormatter";

module.exports.commandInfo = {
	name: "rarityshot",
	aliases: ["rs"],
	commandFormat: "<nbTirages> <rarityMin = 1> <rarityMax = 8>",
	typeWaited: {
		nbTirages: typeVariable.INTEGER,
		rarityMin: typeVariable.INTEGER,
		rarityMax: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez tiré {nbTirages} objets, vous avez obtenu {common} communs ({commonPercent}%), {uncommon} peu communs ({uncommonPercent}%), {exotic} exotiques ({exoticPercent}%), {rare} rares ({rarePercent}%), {special} spéciaux ({specialPercent}%), {epic} épiques ({epicPercent}%), {legendary} légendaires ({legendaryPercent}%) et {mythic} mythiques ({mythicPercent}%)",
	description: "Fait nbTirages tirages de rareté d'objets entre les raretés rarityMin et rarityMax."
};

/**
 * Do random rarity tries
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const RarityShotTestCommand = async (language, message, args) => {
	if (args[0] < 0) {
		throw new Error("Erreur rarityshot : nbTirages négatif !");
	}
	if (args[1]>args[2]) {
		throw new Error("Erreur rarityshot : borne min inférieure à borne max !");
	}
	if (args[1]>8 || args[1]<1) {
		throw new Error("Erreur rarityshot : borne min hors valeur (valeurs autorisées : 1 à 8) !");
	}
	if (args[2]>8 || args[2]<1) {
		throw new Error("Erreur rarityshot : borne max hors valeur (valeurs autorisées : 1 à 8) !");
	}
	let tab = [0,0,0,0,0,0,0,0]
	for (let i = 0; i < parseInt(args[0],10); i++) {
		tab[generateRandomRarity(parseInt(args[1],10),parseInt(args[2],10))-1]++;
	}
	return format(module.exports.commandInfo.messageWhenExecuted, {
		nbTirages: args[0],
		common: tab[0],
		commonPercent: Math.round((tab[0]/parseInt(args[0],10))*10000)/100,
		uncommon: tab[1],
		uncommonPercent: Math.round((tab[1]/parseInt(args[0],10))*10000)/100,
		exotic: tab[2],
		exoticPercent: Math.round((tab[2]/parseInt(args[0],10))*10000)/100,
		rare: tab[3],
		rarePercent: Math.round((tab[3]/parseInt(args[0],10))*10000)/100,
		special: tab[4],
		specialPercent: Math.round((tab[4]/parseInt(args[0],10))*10000)/100,
		epic: tab[5],
		epicPercent: Math.round((tab[5]/parseInt(args[0],10))*10000)/100,
		legendary: tab[6],
		legendaryPercent: Math.round((tab[6]/parseInt(args[0],10))*10000)/100,
		mythic: tab[7],
		mythicPercent: Math.round((tab[7]/parseInt(args[0],10))*10000)/100
	});
};

module.exports.execute = RarityShotTestCommand;