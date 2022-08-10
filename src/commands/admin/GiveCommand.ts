import {Constants} from "../../core/Constants";
import {format} from "../../core/utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";
import {Armors} from "../../core/database/game/models/Armor";
import {Weapons} from "../../core/database/game/models/Weapon";
import {Potions} from "../../core/database/game/models/Potion";
import {ObjectItems} from "../../core/database/game/models/ObjectItem";
import {Entities} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {GenericItemModel} from "../../core/database/game/models/GenericItemModel";
import {draftBotClient} from "../../core/bot";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {discordIdToMention} from "../../core/utils/StringUtils";
import {ChangeValueAdminCommands} from "../ChangeValueAdminCommands";

/**
 * Allow the bot owner to give an item to somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.giveCommand", language);
	const usersToChange = interaction.options.getString("users").split(" ");
	if (usersToChange.length > 50) {
		replyErrorMessage(
			interaction,
			language,
			tr.get("errors.tooMuchPeople")
		);
		return;
	}
	const category = interaction.options.getInteger("category");
	const itemId = interaction.options.getInteger("itemid");
	let item: GenericItemModel = null;
	switch (category) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		item = itemId <= await Weapons.getMaxId() && itemId > 0 ? await Weapons.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		item = itemId <= await Armors.getMaxId() && itemId > 0 ? await Armors.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		item = itemId <= await Potions.getMaxId() && itemId > 0 ? await Potions.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		item = itemId <= await ObjectItems.getMaxId() && itemId > 0 ? await ObjectItems.getById(itemId) : null;
		break;
	default:
		break;
	}
	if (item === null) {
		return replyErrorMessage(interaction, language, tr.get("errors.wrongItemId"));
	}

	const users = ChangeValueAdminCommands.getConcernedUsers(usersToChange, interaction, tr);

	await new DraftBotValidateReactionMessage(
		interaction.user,
		async (validateMessage: DraftBotValidateReactionMessage) => {
			if (validateMessage.isValidated()) {
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
								item: item.toString(language, null)
							}),
							null, // Data.getModule("bot").getString("embed.default"),
							language
						);
					}
				}
				await interaction.followUp({
					embeds: [new DraftBotEmbed()
						.formatAuthor(tr.get("resultTitle"), interaction.user)
						.setDescription(descString)]
				});
			}
			else {
				sendErrorMessage(
					interaction.user,
					interaction,
					language,
					tr.get("errors.commandCanceled"),
					true
				);
			}
		}
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("give")
		.setDescription("Give an item to a given user (admin only)")
		.addIntegerOption(option => option.setName("category")
			.setDescription("the category of the item to give")
			.setRequired(true)
			.addChoices([
				["Weapon", Constants.ITEM_CATEGORIES.WEAPON],
				["Armor", Constants.ITEM_CATEGORIES.ARMOR],
				["Potion", Constants.ITEM_CATEGORIES.POTION],
				["Object", Constants.ITEM_CATEGORIES.OBJECT]
			]))
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