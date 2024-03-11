import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {NumberChangeReason} from "../../../../../../Lib/src/constants/LogsConstants";

export const commandInfo: ITestCommand = {
	name: "glorypoints",
	aliases: ["glory"],
	commandFormat: "<points>",
	typeWaited: {
		points: TypeKey.INTEGER
	},
	description: "Mets les glory points votre joueur à la valeur donnée"
};

/**
 * Set the glory points of the player
 */
const gloryPointsTestCommand: ExecuteTestCommandLike = async (player, args, response) => {
	const gloryPoints = parseInt(args[0], 10);
	if (gloryPoints < 0) {
		throw new Error("Erreur glory points : glory points inférieurs à 0 interdits !");
	}
	await player.setGloryPoints(gloryPoints, NumberChangeReason.TEST, response);
	await player.save();

	return `Vous avez maintenant ${player.gloryPoints} :sparkles: !`;
};

commandInfo.execute = gloryPointsTestCommand;