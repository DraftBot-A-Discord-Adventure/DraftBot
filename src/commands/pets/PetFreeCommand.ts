import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/models/Entity";
import {Guild, Guilds} from "../../core/models/Guild";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {PetFreeConstants} from "../../core/constants/PetFreeConstants";
import {millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import PetEntity from "../../core/models/PetEntity";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

function luckyMeat(guild: Guild, pPet: PetEntity) {
	return guild.carnivorousFood + 1 <= Constants.GUILD.MAX_PET_FOOD[getFoodIndexOf(Constants.PET_FOOD.CARNIVOROUS_FOOD)]
		&& RandomUtils.draftbotRandom.realZeroToOneInclusive() <= PetFreeConstants.GIVE_MEAT_PROBABILITY
		&& !pPet.isFeisty();
}

function getPetFreeEndCallback(entity: Entity, pPet: PetEntity, petFreeModule: TranslationModule, interaction: CommandInteraction) {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.PET_FREE);
		if (msg.isValidated()) {
			if (pPet.isFeisty()) {
				await entity.Player.addMoney(entity, -PetFreeConstants.FREE_FEISTY_COST, interaction.channel, petFreeModule.language);
			}
			pPet.destroy();
			entity.Player.petId = null;
			entity.Player.lastPetFree = new Date();
			entity.Player.save();
			const freedEmbed = new DraftBotEmbed()
				.formatAuthor(petFreeModule.get("successTitle"), interaction.user)
				.setDescription(petFreeModule.format("petFreed", {
					pet: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(petFreeModule.language))
				}));

			if (pPet.isFeisty()) {
				freedEmbed.setDescription(freedEmbed.description + "\n\n" + petFreeModule.get("wasFeisty"));
			}

			let guild: Guild;
			try {
				guild = await Guilds.getById(entity.Player.guildId);
			}
			catch (error) {
				guild = null;
			}

			if (guild !== null && luckyMeat(guild, pPet)) {
				guild.carnivorousFood += PetFreeConstants.MEAT_GIVEN;
				guild.save();
				freedEmbed.setDescription(freedEmbed.description + "\n\n" + petFreeModule.get("giveMeat"));
			}

			await interaction.followUp({embeds: [freedEmbed]});
			return;
		}
		sendErrorMessage(interaction.user, interaction, petFreeModule.language, petFreeModule.get("canceled"), true);
	};
}

function cantBeFreed(pPet: PetEntity, interaction: CommandInteraction, petFreeModule: TranslationModule, entity: Entity) {
	if (!pPet) {
		replyErrorMessage(
			interaction,
			petFreeModule.language,
			Translations.getModule("commands.pet", petFreeModule.language).get("noPet")
		);
		return true;
	}

	const cooldownTime = PetFreeConstants.FREE_COOLDOWN - (new Date().valueOf() - entity.Player.lastPetFree.valueOf());
	if (cooldownTime > 0) {
		replyErrorMessage(
			interaction,
			petFreeModule.language,
			petFreeModule.format("cooldown", {
				time: minutesDisplay(millisecondsToMinutes(cooldownTime))
			})
		);
		return true;
	}

	if (pPet.isFeisty() && entity.Player.money < PetFreeConstants.FREE_FEISTY_COST) {
		replyErrorMessage(
			interaction,
			petFreeModule.language,
			petFreeModule.format("noMoney", {
				money: PetFreeConstants.FREE_FEISTY_COST - entity.Player.money
			})
		);
		return true;
	}
	return false;
}

/**
 * Allow to free a pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petFreeModule = Translations.getModule("commands.petFree", language);

	const pPet = entity.Player.Pet;
	if (cantBeFreed(pPet, interaction, petFreeModule, entity)) {
		return;
	}

	const confirmEmbed = new DraftBotValidateReactionMessage(interaction.user, getPetFreeEndCallback(entity, pPet, petFreeModule, interaction))
		.formatAuthor(petFreeModule.get("successTitle"), interaction.user)
		.setDescription(petFreeModule.format("confirmDesc", {
			pet: pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language))
		}));

	if (pPet.isFeisty()) {
		confirmEmbed.setFooter(petFreeModule.get("isFeisty"));
	}

	await confirmEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.PET_FREE, collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("petfree")
		.setDescription("Get rid of your current pet"),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY]
	},
	mainGuildCommand: false
};