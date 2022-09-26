import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import {MissionsController} from "../missions/MissionsController";
import {PetEntities, PetEntity} from "../database/game/models/PetEntity";
import {Guilds} from "../database/game/models/Guild";
import {GuildPets} from "../database/game/models/GuildPet";
import {format} from "../utils/StringFormatter";
import {RandomUtils} from "../utils/RandomUtils";
import {Constants} from "../Constants";
import {giveFood} from "../utils/GuildUtils";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

/**
 * Generates the resulting embed of the new pet's collect
 * @param seEmbed
 * @param base
 * @param tr
 * @param petLine
 * @param pet
 * @param text
 */
function generatePetEmbed(seEmbed: DraftBotEmbed, base: string, tr: TranslationModule, petLine: string, pet: PetEntity, text: string): void {
	seEmbed.setDescription(
		base +
		format(
			text, {
				pet: petLine,
				nominative: tr.get(`nominative.${pet.sex}`),
				nominativeShift: tr.get(`nominative.${pet.sex}`).charAt(0)
					.toUpperCase() + tr.get(`nominative.${pet.sex}`).slice(1),
				accusative: tr.get(`accusative.${pet.sex}`),
				accusativeShift: tr.get(`accusative.${pet.sex}`).charAt(0)
					.toUpperCase() + tr.get(`accusative.${pet.sex}`).slice(1),
				determinant: tr.get(`determinant.${pet.sex}`),
				determinantShift: tr.get(`determinant.${pet.sex}`).charAt(0)
					.toUpperCase() + tr.get(`determinant.${pet.sex}`).slice(1),
				feminine: pet.sex === "f" ? "e" : ""
			}
		)
	);
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Find a fresh new pet
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const pet = await PetEntities.generateRandomPetEntityNotGuild();
		let guild;

		// search for a user's guild
		try {
			guild = await Guilds.getById(entity.Player.guildId);
		}
		catch (error) {
			guild = null;
		}

		const petLine = pet.displayName(language);
		const base = `${seEmbed.data.description} ${Translations.getModule("smallEventsIntros", language).getRandom("intro")}`;
		const noRoomInGuild = guild === null ? true : guild.isPetShelterFull();
		const seEmbedPetObtention = seEmbed;
		const trad = Translations.getModule("smallEvents.findPet", language);

		if (noRoomInGuild && entity.Player.petId !== null) {
			// no room
			let outRand;
			const storiesObject = trad.getObject("noRoom.stories");
			do {
				outRand = RandomUtils.randInt(0, storiesObject.length);
			}
			while (
				storiesObject[outRand][Constants.PETS.IS_FOOD] && guild === null
			);
			// choisir une autre issue si le joueur n'a pas de guilde pour stocker la viande

			generatePetEmbed(seEmbed, base, trad, petLine, pet, (storiesObject as unknown as string[][])[outRand][0]);
			await interaction.editReply({embeds: [seEmbed]});
			if (storiesObject[outRand][Constants.PETS.IS_FOOD]) {
				await giveFood(interaction, language, entity, Constants.PET_FOOD.CARNIVOROUS_FOOD, 1, NumberChangeReason.SMALL_EVENT);
			}
		}
		else if (!noRoomInGuild && entity.Player.petId !== null) {
			// Place le pet dans la guilde
			await pet.save();
			await GuildPets.addPet(guild, pet, true).save();
			generatePetEmbed(seEmbed, base, trad, petLine, pet, trad.getRandom("roomInGuild.stories"));
			await interaction.editReply({embeds: [seEmbed]});
			seEmbedPetObtention.setDescription(trad.format("petObtentionGuild", {
				emote: pet.getPetEmote(),
				pet: pet.getPetTypeName(language)
			}));
			await interaction.channel.send({embeds: [seEmbedPetObtention]});
		}
		else {
			// Place le pet avec le joueur
			await pet.save();
			entity.Player.setPet(entity, pet);
			await entity.Player.save();
			generatePetEmbed(seEmbed, base, trad, petLine, pet, trad.getRandom("roomInPlayer.stories"));
			await interaction.editReply({embeds: [seEmbed]});
			seEmbedPetObtention.setDescription(trad.format("petObtentionPlayer", {
				emote: pet.getPetEmote(),
				pet: pet.getPetTypeName(language)
			}));
			await interaction.channel.send({embeds: [seEmbedPetObtention]});
			await MissionsController.update(entity, interaction.channel, language, {missionId: "havePet"});
		}
	}
};
