import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {confirmationCallback} from "../../core/smallEvents/goToPVEIslandSmallEvent";
import {Maps} from "../../core/maps/Maps";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {format} from "../../core/utils/StringFormatter";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

/**
 * Displays information about the profile of the player who sent the command
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const tr = Translations.getModule("commands.joinBoat", language);

	const guildOnBoat = (await Players.getByGuild(player.guildId)).filter(guildMember => Maps.isOnBoat(guildMember) && guildMember.discordUserId !== player.discordUserId);
	if (guildOnBoat.length !== 0){
		await replyErrorMessage(interaction, language, tr.get("noMemberOnBoat"));
		return;
	}

	const price = await player.getTravelCostThisWeek();
	const confirmEmbed = new DraftBotValidateReactionMessage(
		interaction.user,
		(confirmMessage: DraftBotValidateReactionMessage) => {
			confirmationCallback(player, confirmMessage, tr, ":ferry:", price).then();
		}
	);
	await interaction.deferReply();

	const boatTr = Translations.getModule("smallEvents.goToPVEIsland", language);
	confirmEmbed.setDescription(
		format(tr.get("joinMember"), {
			priceText: price === 0 ? boatTr.get("priceFree") : boatTr.format("priceMoney", { price })
		}) +
		"\n\n" +
		boatTr.format("confirm", {
			fightPoints: await player.getCumulativeFightPoint(),
			fightPointsMax: await player.getMaxCumulativeFightPoint()
		})
	);

	await confirmEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.joinBoat", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.joinBoat", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		guildRequired: true
	},
	mainGuildCommand: false
};