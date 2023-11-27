import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {SmallEventBoatAdvicePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBoatAdvicePacket";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {Players} from "../database/game/models/Player";
import {PetEntities} from "../database/game/models/PetEntity";
import {Guilds} from "../database/game/models/Guild";
import {ClassDataController} from "../../data/Class";
import {readdir, readdirSync} from "fs";
import {SmallEventBotFactsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBotFactsPacket";

type BotFactsProperties = {
    "possibleInfos": string[]
}

const getNbPlayersWithGivenClass = async (): Promise<[number, number]> => {
    const classToCheck = ClassDataController.instance.getById(parseInt(RandomUtils.draftbotRandom.pick(readdirSync("resources/text/classes"))
        .slice(0, -5), 10));
    return [await Players.getNbPlayersWithClass(classToCheck), classToCheck.id];
};

export const smallEventFuncs: SmallEventFuncs = {
    canBeExecuted: (player) => SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent(player),
    executeSmallEvent: async (response, player): Promise<void> => {
        const botFactsProperties = SmallEventDataController.instance.getById("botFacts").getProperties<BotFactsProperties>();
        const information = RandomUtils.draftbotRandom.pick(Object.keys(botFactsProperties.possibleInfos));
        let infoResult = 0;
        let infoComplement: number = -1;

        let array = [];
        switch (information) {
            case "nbMeanPoints":
                infoResult = await Players.getNbMeanPoints();
                break;
            case "meanWeeklyScore":
                infoResult = await Players.getMeanWeeklyScore();
                break;
            case "nbPlayersHaventStartedTheAdventure":
                infoResult = await Players.getNbPlayersHaventStartedTheAdventure();
                break;
            case "levelMean":
                infoResult = await Players.getLevelMean();
                break;
            case "nbMeanMoney":
                infoResult = await Players.getNbMeanMoney();
                break;
            case "sumAllMoney":
                infoResult = await Players.getSumAllMoney();
                break;
            case "richestPlayer":
                infoResult = await Players.getRichestPlayer();
                break;
            case "trainedPets":
                infoResult = await PetEntities.getNbTrainedPets();
                break;
            case "percentMalePets":
                infoResult = Math.round(await PetEntities.getNbPetsGivenSex("m") / await PetEntities.getNbPets() * 10000) / 100;
                break;
            case "percentFemalePets":
                infoResult = Math.round(await PetEntities.getNbPetsGivenSex("f") / await PetEntities.getNbPets() * 10000) / 100;
                break;
            case "guildLevelMean":
                infoResult = await Guilds.getGuildLevelMean();
                break;
            case "feistyPets":
                infoResult = await PetEntities.getNbFeistyPets();
                break;
            case "nbPlayersOnYourMap":
                infoResult = await player.getNbPlayersOnYourMap();
                break;
            default:
                array = await getNbPlayersWithGivenClass();
                infoResult = array[0];
                infoComplement = array[1];
        }

        response.push(makePacket<SmallEventBotFactsPacket>({information, infoResult, infoComplement}));
    }
};