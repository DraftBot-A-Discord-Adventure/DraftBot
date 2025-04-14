import { Maps } from "../../../../core/maps/Maps";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "stopcurrenttravel",
	aliases: ["stravel", "stoptravel"],
	description: "Stoppe le voyage en cours"
};

/**
 * Stop your current travel
 */
const stopCurrentTravelTestCommand: ExecuteTestCommandLike = async player => {
	if (!Maps.isTravelling(player)) {
		throw new Error("Erreur stoptravel : vous ne voyagez pas actuellement !");
	}
	await Maps.stopTravel(player);
	return "Vous avez arrêté de voyager !";
};

commandInfo.execute = stopCurrentTravelTestCommand;
