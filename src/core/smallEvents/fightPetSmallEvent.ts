import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {TranslationModule, Translations} from "../Translations";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {WitchEvents} from "../witch/WitchEvents";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {WitchEvent} from "../witch/WitchEvent";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {ItemConstants} from "../constants/ItemConstants";
import {Maps} from "../maps/Maps";
import {FightPetActions} from "../fightPet/FightPetActions";
import {PetEntities} from "../database/game/models/PetEntity";
import {FightPetAction} from "../fightPet/FightPetAction";

/**
 * Returns an object composed of three random witch events
 * @param player all the information about the player
 */
async function getRandomFightPetActions(player: Player): Promise<FightPetActions[]> {
	let amountOfActions = SmallEventConstants.FIGHT_PET.BASE_ACTION_AMOUNT;

	// higher level players get more actions
	if (player.level > SmallEventConstants.FIGHT_PET.LEVEL_TO_UNLOCK_NEW_ACTION) {
		amountOfActions++;
	}

	// some classes get a bonus action
	if (player.class === Constants.CLASSES.POWERFUL_INFANTRYMAN || player.class === Constants.CLASSES.INFANTRYMAN) {
		amountOfActions++;
	}

	const actions: FightPetActions[] = Array.from({length: amountOfActions}, () => FightPetActions.getRandomFightPetAction([]));

	// some pet may give a bonus action (50% chance)
	const petEntity = await PetEntities.getById(player.petId);
	if (petEntity && RandomUtils.draftbotRandom.bool()) {
		actions.push(FightPetActions.getRandomFightActionFromPetId(petEntity.petId));
	}

	return actions;
}

/**
 * Execute the outcome of a dedicated FightPetAction
 * @param selectedFightPetAction
 * @param player
 * @param language
 * @param interaction
 */
async function applyOutcome(selectedFightPetAction: FightPetAction, player: Player, language: string, interaction: CommandInteraction): Promise<void> {

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
 * generate an embed with the menu and a short introduction to the witch
 * @param embed
 * @param language
 * @param interaction
 * @param seEmbed
 * @param player
 * @param tr
 */
async function generateInitialEmbed(
	embed: DraftBotReactionMessageBuilder,
	language: string,
	interaction: CommandInteraction,
	seEmbed: DraftBotEmbed,
	player: Player,
	tr: TranslationModule
): Promise<DraftBotReactionMessage> {
	const fightPetActions = await getRandomFightPetActions(player);
	const witchEventMenu = generateFightPetActionMenu(fightPetActions, embed, language);
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const builtEmbed = embed.build();
	builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
	builtEmbed.setDescription(
		`${seEmbed.data.description
		+ intro
		+ tr.getRandom("intro")
		+ tr.getRandom("description")
		+ tr.getRandom("situation")}\n\n${witchEventMenu}`
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

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.allowEndReaction()
			.endCallback(async (fightPetEventMessage) => {

				const selectedFightPetAction = retrieveSelectedEvent(fightPetEventMessage);
				BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.FIGHT_PET_CHOOSE);

				const outcome = await applyOutcome(selectedFightPetAction, player, language, interaction);

				await sendResultMessage(seEmbed, tr, selectedFightPetAction, interaction);

				await selectedFightPetAction.checkMissions(interaction, player, language, outcome);
			});

		const builtEmbed = generateInitialEmbed(embed, language, interaction, seEmbed, player, tr);

		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.FIGHT_PET_CHOOSE, collector));
	}
};