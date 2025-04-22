import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { PetEntities } from "../../../../core/database/game/models/PetEntity";

export const commandInfo: ITestCommand = {
	name: "pethungry",
	aliases: ["hungry"],
	description: "Rend un pet affamé"
};

/**
 * Set the lovePoints of your pet
 */
const petHungryTestCommand: ExecuteTestCommandLike = async player => {
	const pet = await PetEntities.getById(player.petId);
	if (!pet) {
		throw new Error("Erreur pethungry : vous n'avez pas de pet !");
	}

	pet.hungrySince = new Date(0);
	await pet.save();

	return "Votre pet a maintenant faim !";
};

commandInfo.execute = petHungryTestCommand;
