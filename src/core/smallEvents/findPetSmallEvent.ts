import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import {PetEntities, PetEntity} from "../database/game/models/PetEntity";
import {format} from "../utils/StringFormatter";
import {RandomUtils} from "../utils/RandomUtils";
import {PetConstants} from "../constants/PetConstants";
import {giveFood} from "../utils/GuildUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import Player from "../database/game/models/Player";
import {Pets} from "../database/game/models/Pet";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {PET_ENTITY_GIVE_RETURN} from "../constants/PetEntityConstants";
import {Guilds} from "../database/game/models/Guild";
import {Maps} from "../maps/Maps";

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
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Find a fresh new pet
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const pet = await PetEntities.generateRandomPetEntityNotGuild();
		const petModel = await Pets.getById(pet.petId);
		const trad = Translations.getModule("smallEvents.findPet", language);
		const petLine = pet.displayName(petModel, language);
		const base = `${seEmbed.data.description} ${Translations.getModule("smallEventsIntros", language).getRandom("intro")}`;
		const seEmbedPetObtention = seEmbed;
		let guild;

		// search for a user's guild
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch (error) {
			guild = null;
		}

		// Give the pet
		const giveReturn = await pet.giveToPlayer(
			player,
			{
				interaction,
				language
			},
			false,
			false);

		// Fail because no space
		if (giveReturn === PET_ENTITY_GIVE_RETURN.NO_SLOT) {
			let storiesObject = trad.getObject("noRoom.stories");
			if (!guild) {
				storiesObject = storiesObject.filter(story => story[PetConstants.IS_FOOD]);
			}

			const story = RandomUtils.draftbotRandom.pick(storiesObject) as unknown as [string, boolean];

			generatePetEmbed(seEmbed, base, trad, petLine, pet, story[0]);
			await interaction.editReply({embeds: [seEmbed]});
			if (story[PetConstants.IS_FOOD]) {
				await giveFood(interaction, language, player, SmallEventConstants.FIND_PET.FOOD_GIVEN_NO_PLACE, 1, NumberChangeReason.SMALL_EVENT);
			}
		}
		// Gave pet to guild
		else if (giveReturn === PET_ENTITY_GIVE_RETURN.GUILD) {
			generatePetEmbed(seEmbed, base, trad, petLine, pet, trad.getRandom("roomInGuild.stories"));
			await interaction.editReply({embeds: [seEmbed]});
			seEmbedPetObtention.setDescription(trad.format("petObtentionGuild", {
				emote: pet.getPetEmote(petModel),
				pet: pet.getPetTypeName(petModel, language)
			}));
			await interaction.channel.send({embeds: [seEmbedPetObtention]});
		}
		// Gave pet to the player
		else {
			generatePetEmbed(seEmbed, base, trad, petLine, pet, trad.getRandom("roomInPlayer.stories"));
			await interaction.editReply({embeds: [seEmbed]});
			seEmbedPetObtention.setDescription(trad.format("petObtentionPlayer", {
				emote: pet.getPetEmote(petModel),
				pet: pet.getPetTypeName(petModel, language)
			}));
			await interaction.channel.send({embeds: [seEmbedPetObtention]});
		}
	}
};
