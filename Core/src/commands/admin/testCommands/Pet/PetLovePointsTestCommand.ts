import { NumberChangeReason } from "../../../../../../Lib/src/constants/LogsConstants";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { PetEntities } from "../../../../core/database/game/models/PetEntity";

export const commandInfo: ITestCommand = {
	name: "petlovepoints",
	aliases: ["petlp"],
	commandFormat: "<lovePoints>",
	typeWaited: {
		lovePoints: TypeKey.INTEGER
	},
	description: "Mets le niveau d'amour de votre pet au niveau donné"
};

/**
 * Set the lovePoints of your pet
 */
const petLovePointsTestCommand: ExecuteTestCommandLike = async (player, args, response) => {
	const pet = await PetEntities.getById(player.petId);
	if (!pet) {
		throw new Error("Erreur petlp : vous n'avez pas de pet !");
	}
	const lovePoints = parseInt(args[0], 10);
	if (lovePoints < 0 || lovePoints > 100) {
		throw new Error("Erreur petlp : lovePoints invalide ! Fourchette de lovePoints comprise entre 0 et 100.");
	}
	await pet.changeLovePoints({
		player,
		amount: lovePoints - pet.lovePoints,
		response,
		reason: NumberChangeReason.TEST
	});
	await pet.save();
	return `Votre pet a maintenant un amour de ${args[0]}.`;
};

commandInfo.execute = petLovePointsTestCommand;
