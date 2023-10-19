import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {TranslationModule, Translations} from "../Translations";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {Maps} from "../maps/Maps";
import {FightPetActions} from "./fightPet/FightPetActions";
import {FightPetAction} from "./fightPet/FightPetAction";
import {Pets} from "../database/game/models/Pet";
import {format} from "../utils/StringFormatter";
import {FeralPet} from "../database/game/models/FeralPet";
import {ClassInfoConstants} from "../constants/ClassInfoConstants";
import {NumberChangeReason} from "../constants/LogsConstants";

/**
 * Returns an object composed of three random witch events
 * @param player all the information about the player
 */
function getRandomFightPetActions(player: Player): FightPetAction[] {
	let amountOfActions = SmallEventConstants.FIGHT_PET.BASE_ACTION_AMOUNT;

	// Higher level players get more actions
	if (player.level > SmallEventConstants.FIGHT_PET.LEVEL_TO_UNLOCK_NEW_ACTION) {
		amountOfActions++;
	}

	// Some classes get a bonus action
	if (player.class in ClassInfoConstants.CLASSES_WITH_BONUS_ACTION) {
		amountOfActions++;
	}

	// Get random actions
	const actions: FightPetAction[] = [];
	for (let i = 0; i < amountOfActions; ++i) {
		actions.push(FightPetActions.getRandomFightPetAction(actions));
	}

	return actions;
}

/**
 * Get the selected event from the user's choice
 * @param fightPetActionMessage
 */
function retrieveSelectedEvent(fightPetActionMessage: DraftBotReactionMessage): FightPetAction {
	const reaction = fightPetActionMessage.getFirstReaction();
	// If the player did not react, we use the nothing happen event with the menu reaction deny
	const reactionEmoji = reaction ? reaction.emoji.name : Constants.REACTIONS.NOT_REPLIED_REACTION;
	return FightPetActions.getFightPetActionByEmoji(reactionEmoji);
}

/**
 * Send a message containing all the information about what happened to the player
 * @param seEmbed
 * @param resultString
 * @param interaction
 */
async function sendResultMessage(seEmbed: DraftBotEmbed, resultString: string, interaction: CommandInteraction): Promise<void> {
	seEmbed.setDescription(resultString);
	await interaction.channel.send({embeds: [seEmbed]});
}


/**
 * Get the menu to display to the player and add the reactions to the embed
 * @param fightPetActions
 * @param embed
 * @param language
 */
function generateFightPetActionMenu(fightPetActions: FightPetAction[], embed: DraftBotReactionMessageBuilder, language: string): string {
	let fightPetActionMenu = "";
	for (const fightPetAction of Object.entries(fightPetActions)) {
		embed.addReaction(new DraftBotReaction(fightPetAction[1].getEmoji()));
		fightPetActionMenu += `${fightPetAction[1].toString(language, false)}\n`;
	}
	return fightPetActionMenu;
}

/**
 * Generate a feral pet
 * @param language
 */
async function generateFeralPet(language: string): Promise<FeralPet> {
	const isFemale = RandomUtils.draftbotRandom.bool();
	const originalPet = await Pets.getRandom();
	const adjective = format(Translations.getModule("smallEvents.fightPet", language).getRandom("adjectives"), {feminine: isFemale});
	return {
		feralName: Translations.getModule("smallEvents.fightPet", language).format("nameDisplay", {
			emoji: isFemale ? originalPet.emoteFemale : originalPet.emoteMale,
			adjective,
			petName: originalPet.toString(language, isFemale)
		}),
		originalPet,
		isFemale
	};
}

/**
 * Generate an embed with the menu and a short introduction to the witch
 * @param embed
 * @param feralPet
 * @param interaction
 * @param seEmbed
 * @param player
 * @param tr
 */
function generateInitialEmbed(
	embed: DraftBotReactionMessageBuilder,
	feralPet: FeralPet,
	interaction: CommandInteraction,
	seEmbed: DraftBotEmbed,
	player: Player,
	tr: TranslationModule
): DraftBotReactionMessage {
	const fightPetActions = getRandomFightPetActions(player);
	const fightPetMenu = generateFightPetActionMenu(fightPetActions, embed, tr.language);
	const intro = Translations.getModule("smallEventsIntros", tr.language).getRandom("intro");
	const builtEmbed = embed.build();
	builtEmbed.formatAuthor(Translations.getModule("commands.report", tr.language).get("journal"), interaction.user);
	builtEmbed.setDescription(
		`${seEmbed.data.description
		+ intro
		+ format(tr.getRandom("intro"), {feminine: feralPet.isFemale, feralPet: feralPet.feralName})
		+ tr.getRandom("situation")}\n\n${fightPetMenu}`
	);
	return builtEmbed;
}

export const smallEvent: SmallEvent = {

	/**
	 * Only on pve island for now
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnPveIsland(player));
	},

	/**
	 * A small event about a pet that is not very happy to see the player and will attack him
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.fightPet", language);
		const feralPet = await generateFeralPet(language);
		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.allowEndReaction()
			.endCallback(async (fightPetEventMessage) => {

				const selectedFightPetAction = retrieveSelectedEvent(fightPetEventMessage);
				BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.FIGHT_PET_CHOOSE);

				const outcomeIsSuccess = await selectedFightPetAction.applyOutcome(player, feralPet);
				const stringToGet = outcomeIsSuccess ? "success" : "failure";
				const resultString = `${selectedFightPetAction.getEmoji()} ${tr.get(
					`fightPetActions.${selectedFightPetAction.name}.${stringToGet}`
				)}${outcomeIsSuccess ? ` ${tr.getRandom("rageUp")}${tr.get("rageUpEnd")}` : ""}`;
				await sendResultMessage(seEmbed, resultString, interaction);
				await player.addRage(outcomeIsSuccess ? 1 : 0, fightPetEventMessage.collector.message.channel, language, NumberChangeReason.FIGHT_PET_SMALL_EVENT);
			});


		const builtEmbed = generateInitialEmbed(embed, feralPet, interaction, seEmbed, player, tr);

		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.FIGHT_PET_CHOOSE, collector));
	}
};