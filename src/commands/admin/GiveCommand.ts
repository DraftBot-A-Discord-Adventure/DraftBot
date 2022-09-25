import {Constants} from "../../core/Constants";
import {format} from "../../core/utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../../core/Translations";
import {Entities} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {GenericItemModel} from "../../core/database/game/models/GenericItemModel";
import {draftBotClient, draftBotInstance} from "../../core/bot";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {discordIdToMention} from "../../core/utils/StringUtils";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";
import {getItemByIdAndCategory} from "../../core/utils/ItemUtils";

/**
 * Get the end callback of the give command
 * @param users
 * @param tr
 * @param item
 * @param interaction
 */
function getCallback(users: Set<string>, tr: TranslationModule, item: GenericItemModel, interaction: CommandInteraction) {
	return async (validateMessage: DraftBotValidateReactionMessage): Promise<void> => {
		if (!validateMessage.isValidated()) {
			await sendErrorMessage(
				interaction.user,
				interaction,
				tr.language,
				tr.get("errors.commandCanceled"),
				true
			);
			return;
		}
		let descString = "";
		for (const user of users) {
			const entityToEdit = await Entities.getByDiscordUserId(user);
			if (!entityToEdit) {
				descString += tr.format("giveError.baseText", {
					user,
					mention: discordIdToMention(user),
					reason: tr.get("giveError.reasons.invalidMention")
				});
				continue;
			}
			if (!await entityToEdit.Player.giveItem(item)) {
				descString += tr.format("giveError.baseText", {
					user,
					mention: discordIdToMention(user),
					reason: tr.get("giveError.reasons.noSpace")
				});
				continue;
			}
			descString += format(tr.get("giveSuccess"), {
				user,
				mention: discordIdToMention(user)
			});
			if (entityToEdit.Player.dmNotification) {
				sendDirectMessage(
					await draftBotClient.users.fetch(user),
					tr.get("dm.title"),
					tr.format("dm.description", {
						item: item.toString(tr.language, null)
					}),
					null,
					tr.language
				);
			}
			draftBotInstance.logsDatabase.logItemGain(entityToEdit.discordUserId, item).then();
		}
		await interaction.followUp({
			embeds: [new DraftBotEmbed()
				.formatAuthor(tr.get("resultTitle"), interaction.user)
				.setDescription(descString)]
		});
	};
}

/**
 * Allow the bot owner to give an item to somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.give", language);
	const usersToChange = (interaction.options.get("users").value as string).split(" ");
	if (usersToChange.length > 50) {
		await replyErrorMessage(
			interaction,
			language,
			tr.get("errors.tooMuchPeople")
		);
		return;
	}
	const category = interaction.options.get("category").value as number;
	const itemId = interaction.options.get("itemid").value as number;
	const item = await getItemByIdAndCategory(itemId, category);
	if (item === null) {
		return replyErrorMessage(interaction, language, tr.get("errors.wrongItemId"));
	}

	const users = await ChangeValueAdminCommands.getConcernedUsers(usersToChange, interaction, tr);

	await new DraftBotValidateReactionMessage(
		interaction.user,
		getCallback(users, tr, item, interaction)
	)
		.formatAuthor(
			tr.get("confirmTitle"),
			interaction.user
		)
		.setDescription(tr.format("confirmDesc", {
			item: item.toString(language, null),
			usersCount: users.size
		}))
		.reply(interaction);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.give", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.give", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		})
		.addIntegerOption(option => option.setName("category")
			.setDescription("the category of the item to give")
			.setRequired(true)
			.addChoices(
				{ name: "Weapon", value: Constants.ITEM_CATEGORIES.WEAPON },
				{ name: "Armor", value: Constants.ITEM_CATEGORIES.ARMOR },
				{ name: "Potion", value: Constants.ITEM_CATEGORIES.POTION },
				{ name: "Object", value: Constants.ITEM_CATEGORIES.OBJECT }
			)
		)
		.addIntegerOption(option => option.setName("itemid")
			.setDescription("The id of the item to give")
			.setRequired(true))
		.addStringOption(option => option.setName("users")
			.setDescription("The users' ids affected by the command (example : 'id1 id2 id3')")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};