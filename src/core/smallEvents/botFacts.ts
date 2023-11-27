import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {Players} from "../database/game/models/Player";
import {PetEntities} from "../database/game/models/PetEntity";
import {Guilds} from "../database/game/models/Guild";
import {ClassDataController} from "../../data/Class";
import {readdirSync} from "fs";
import {SmallEventBotFactsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBotFactsPacket";

type BotFactsProperties = {
    "properties": {
		"possibleInfos": string[]
	}
}

const getNbPlayersWithGivenClass = async (): Promise<[number, number]> => {
	const classToCheck = ClassDataController.instance.getById(parseInt(RandomUtils.draftbotRandom.pick(readdirSync("resources/text/classes")) // TODO: Rework, We musn't
		.slice(0, -5), 10));
	return [await Players.getNbPlayersWithClass(classToCheck), classToCheck.id];
};

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent(player),
	executeSmallEvent: async (response, player): Promise<void> => {
		const botFactsProperties = SmallEventDataController.instance.getById("botFacts").getProperties<BotFactsProperties>();
		const information = RandomUtils.draftbotRandom.pick(Object.keys(botFactsProperties.properties.possibleInfos));
		const packet: SmallEventBotFactsPacket = {information, infoResult: 0};

		let array = [];
		switch (information) {
		case "nbMeanPoints":
			packet.infoResult = await Players.getNbMeanPoints();
			break;
		case "meanWeeklyScore":
			packet.infoResult = await Players.getMeanWeeklyScore();
			break;
		case "nbPlayersHaventStartedTheAdventure":
			packet.infoResult = await Players.getNbPlayersHaventStartedTheAdventure();
			break;
		case "levelMean":
			packet.infoResult = await Players.getLevelMean();
			break;
		case "nbMeanMoney":
			packet.infoResult = await Players.getNbMeanMoney();
			break;
		case "sumAllMoney":
			packet.infoResult = await Players.getSumAllMoney();
			break;
		case "richestPlayer":
			packet.infoResult = await Players.getRichestPlayer();
			break;
		case "trainedPets":
			packet.infoResult = await PetEntities.getNbTrainedPets();
			break;
		case "percentMalePets":
			packet.infoResult = Math.round(await PetEntities.getNbPetsGivenSex("m") / await PetEntities.getNbPets() * 10000) / 100;
			break;
		case "percentFemalePets":
			packet.infoResult = Math.round(await PetEntities.getNbPetsGivenSex("f") / await PetEntities.getNbPets() * 10000) / 100;
			break;
		case "guildLevelMean":
			packet.infoResult = await Guilds.getGuildLevelMean();
			break;
		case "feistyPets":
			packet.infoResult = await PetEntities.getNbFeistyPets();
			break;
		case "nbPlayersOnYourMap":
			packet.infoResult = await player.getNbPlayersOnYourMap();
			break;
		default:
			array = await getNbPlayersWithGivenClass();
			packet.infoResult = array[0];
			packet.infoComplement = array[1];
		}

		response.push(makePacket<SmallEventBotFactsPacket>(packet));
	}
};