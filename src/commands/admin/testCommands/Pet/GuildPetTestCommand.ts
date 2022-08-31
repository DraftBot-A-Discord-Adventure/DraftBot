import {Entities} from "../../../../core/database/game/models/Entity";
import {GuildPets} from "../../../../core/database/game/models/GuildPet";
import {PetEntities} from "../../../../core/database/game/models/PetEntity";
import {Guilds} from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {Pets} from "../../../../core/database/game/models/Pet";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

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

	const [entity] = await Entities.getOrRegister(interaction.user.id);

	let guild = await Guilds.getById(entity.Player.guildId);
	if (guild === null) {
		throw new Error("Erreur guildpet : Vous n'avez pas de guilde !");
	}

	if (guild.isPetShelterFull()) {
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

	await (await GuildPets.addPet(guild, pet, true)).save();

	guild = await Guilds.getById(entity.Player.guildId); // recall needed to refresh the pet
	const newPet = guild.GuildPets[guild.GuildPets.length - 1];
	return format(
		commandInfo.messageWhenExecuted, {
			petString: newPet.PetEntity.getPetDisplay(language)
		}
	);
};

commandInfo.execute = guildPetTestCommand;