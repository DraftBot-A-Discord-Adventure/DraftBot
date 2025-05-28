import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { DwarfPetsSeen } from "../../../../core/database/game/models/DwarfPetsSeen";

export const commandInfo: ITestCommand = {
	name: "resetpetseendwarf",
	aliases: ["rpsd"],
	description: "Réinitialise à 0 les pets que vous avez montré au nain."
};

const resetPetSeenDwarfCommand: ExecuteTestCommandLike = async player => {
	const entries = await DwarfPetsSeen.destroy({ where: {
		playerId: player.id
	} });

	return `Vous avez réinitialisé les pets montrés au nain (${entries} entrées).`;
};

commandInfo.execute = resetPetSeenDwarfCommand;
