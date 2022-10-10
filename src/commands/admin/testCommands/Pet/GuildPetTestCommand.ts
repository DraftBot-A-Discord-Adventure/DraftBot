import {GuildPets} from "../../../../core/database/game/models/GuildPet";
import {PetEntities, PetEntity} from "../../../../core/database/game/models/PetEntity";
import {Guilds} from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {Pets} from "../../../../core/database/game/models/Pet";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "guildpet",
	aliases: ["gp"],
	commandFormat: "<id> <sex = m/f>",
	typeWaited: {
		id: Constants.TEST_VAR_TYPES.INTEGER,
		sex: Constants.TEST_VAR_TYPES.STRING
	},
	messageWhenExecuted: "Un pet a rejoint votre shelter :\n{petString} !",
	description: "Ajoute un pet à votre shelter de guilde avec un id et un sexe donnés",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Add a pet in your shelter with id and sex given
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildPetTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {

	const [player] = await Players.getOrRegister(interaction.user.id);

	const guild = await Guilds.getById(player.guildId);
	if (guild === null) {
		throw new Error("Erreur guildpet : Vous n'avez pas de guilde !");
	}

	if (guild.isPetShelterFull(await GuildPets.getOfGuild(guild.id))) {
		throw new Error("Erreur guildpet : Plus de place dans le shelter !");
	}

	if (!["m", "f"].includes(args[1])) {
		throw new Error("Erreur guildpet : sexe invalide.");
	}
	const maxIdPet = await Pets.getMaxId();
	const petId = parseInt(args[0], 10);
	if (petId >= maxIdPet || petId < 0) {
		throw new Error(`Erreur guildpet : id invalide. L'id doit être compris entre 0 et ${maxIdPet} !`);
	}

	const pet = PetEntities.createPet(petId, args[1], null);
	await pet.save();

	await GuildPets.addPet(guild, pet, true).save();

	return format(
		commandInfo.messageWhenExecuted, {
			petString: pet.getPetDisplay(await Pets.getById(pet.petId), language)
		}
	);
};

commandInfo.execute = guildPetTestCommand;