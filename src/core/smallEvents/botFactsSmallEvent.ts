import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {Players} from "../database/game/models/Player";
import {PetEntities} from "../database/game/models/PetEntity";
import {Guilds} from "../database/game/models/Guild";
import {Classes} from "../database/game/models/Class";
import {Constants} from "../Constants";
import {readdir} from "fs/promises";

/**
 * Gives how many players have a random class
 * @param {("fr"|"en")} language
 * @return {Promise<(*)[]>}
 */
const getNbPlayersWithGivenClass = async (language: string): Promise<[string, string]> => {
	const classToCheck = await Classes.getById(parseInt((RandomUtils.draftbotRandom.pick(await readdir("resources/text/classes")) as string)
		.slice(0, -5), 10));
	const nbPlayersWithThisClass = await Players.getNbPlayersWithClass(classToCheck);
	let sentence = Constants.LANGUAGE.FRENCH ? " joueur" : " player";
	sentence += nbPlayersWithThisClass > 1 ? "s" : "";
	return [nbPlayersWithThisClass + sentence, language === Constants.LANGUAGE.FRENCH ? classToCheck.fr : classToCheck.en];
};

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Throw a random, verified, fact to the player
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.botFacts", language);

		const base = seEmbed.data.description + Translations.getModule("smallEventsIntros", language).getRandom("intro");

		const outReceived = RandomUtils.draftbotRandom.pick(tr.getKeys("possiblesInfos"));
		let result;
		let complement = "";
		let array = [];
		switch (outReceived) {
		case "nbMeanPoints":
			result = await Players.getNbMeanPoints();
			break;
		case "meanWeeklyScore":
			result = await Players.getMeanWeeklyScore();
			break;
		case "nbPlayersHaventStartedTheAdventure":
			result = await Players.getNbPlayersHaventStartedTheAdventure();
			break;
		case "levelMean":
			result = await Players.getLevelMean();
			break;
		case "nbMeanMoney":
			result = await Players.getNbMeanMoney();
			break;
		case "sumAllMoney":
			result = await Players.getSumAllMoney();
			break;
		case "richestPlayer":
			result = await Players.getRichestPlayer();
			break;
		case "trainedPets":
			result = await PetEntities.getNbTrainedPets();
			break;
		case "percentMalePets":
			result = Math.round(await PetEntities.getNbPetsGivenSex("m") / await PetEntities.getNbPets() * 10000) / 100;
			break;
		case "percentFemalePets":
			result = Math.round(await PetEntities.getNbPetsGivenSex("f") / await PetEntities.getNbPets() * 10000) / 100;
			break;
		case "guildLevelMean":
			result = await Guilds.getGuildLevelMean();
			break;
		case "feistyPets":
			result = await PetEntities.getNbFeistyPets();
			break;
		case "nbPlayersOnYourMap":
			result = await entity.Player.getNbPlayersOnYourMap();
			break;
		default:
			array = await getNbPlayersWithGivenClass(language);
			result = array[0];
			complement = array[1];
		}
		seEmbed.setDescription(base +
			format(
				tr.getRandom("stories"),
				{
					botFact: format(
						tr.get(`possiblesInfos.${outReceived}`),
						{
							infoNumber: result,
							infoComplement: complement
						}
					)
				}
			)
		);
		await interaction.reply({embeds: [seEmbed]});
	}
};
