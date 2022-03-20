import {Constants} from "../../core/Constants";
import {format} from "../../core/utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {Armor, Armors} from "../../core/models/Armor";
import {Weapon, Weapons} from "../../core/models/Weapon";
import {Potion, Potions} from "../../core/models/Potion";
import {ObjectItem, ObjectItems} from "../../core/models/ObjectItem";
import {Entities} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel, User} from "discord.js";
import {GenericItemModel} from "../../core/models/GenericItemModel";
import {draftBotClient} from "../../core/bot";
import {DraftBotReactionMessage} from "../../core/messages/DraftBotReactionMessage";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean, interaction?: CommandInteraction): Promise<void>;

declare function isAMention(variable: string): boolean;

declare function getIdFromMention(variable: string): string;

declare function sendDirectMessage(user: User, title: string, description: string, color: string, language: string): void;

declare function idToMention(id: string): string;

/**
 * Allow the bot owner to give an item to somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.giveCommand", language);
	const usersToChange = interaction.options.getString("users").split(" ");
	if (usersToChange.length > 52) {
		return await sendErrorMessage(
			interaction.user,
			<TextChannel>interaction.channel,
			language,
			tr.get("errors.tooMuchPeople")
		);
	}
	const category = interaction.options.getInteger("category");
	const itemId = interaction.options.getInteger("itemid");
	let item: GenericItemModel = null;
	switch (category) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		item = <Weapon>(itemId <= await Weapons.getMaxId() && itemId > 0 ? await Weapons.getById(itemId) : null);
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		item = <Armor>(itemId <= await Armors.getMaxId() && itemId > 0 ? await Armors.getById(itemId) : null);
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		item = <Potion>(itemId <= await Potions.getMaxId() && itemId > 0 ? await Potions.getById(itemId) : null);
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		item = <ObjectItem>(itemId <= await ObjectItems.getMaxId() && itemId > 0 ? await ObjectItems.getById(itemId) : null);
		break;
	default:
		break;
	}
	if (item === null) {
		return await interaction.reply({
			embeds: [new DraftBotErrorEmbed(interaction.user, language, tr.get("errors.wrongItemId"))],
			ephemeral: true
		});
	}

	const users = new Set<string>();
	for (let i = 0; i < usersToChange.length; i++) {
		const mention = usersToChange[i];
		if (!isAMention(mention) && (parseInt(mention) < 10 ** 17 || parseInt(mention) >= 10 ** 18)) {
			return await sendErrorMessage(
				interaction.user,
				<TextChannel>interaction.channel,
				language,
				tr.format("errors.invalidIdOrMention", {
					position: i + 1,
					wrongText: usersToChange[i]
				}),
				false,
				interaction
			);
		}
		users.add(isAMention(mention) ? getIdFromMention(mention) : mention);
	}

	await (new DraftBotValidateReactionMessage(
		interaction.user,
		async (validateMessage: DraftBotValidateReactionMessage) => {
			if (validateMessage.isValidated()) {
				let descString = "";
				for (const user of users) {
					const entityToEdit = await Entities.getByDiscordUserId(user);
					if (!entityToEdit) {
						descString += tr.format("giveError.baseText", {
							user,
							mention: idToMention(user),
							reason: tr.get("giveError.reasons.invalidMention")
						});
						continue;
					}
					if (!await entityToEdit.Player.giveItem(item)) {
						descString += tr.format("giveError.baseText", {
							user,
							mention: idToMention(user),
							reason: tr.get("giveError.reasons.noSpace")
						});
						continue;
					}
					descString += format(tr.get("giveSuccess"), {
						user,
						mention: idToMention(user)
					});
					if (entityToEdit.Player.dmNotification) {
						sendDirectMessage(
							await draftBotClient.users.fetch(user),
							tr.get("dm.title"),
							tr.format("dm.description", {
								item: item.toString(language, 0)
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
				await sendErrorMessage(
					interaction.user,
					<TextChannel>interaction.channel,
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
			item: item.toString(language, 0),
			usersCount: users.size
		})) as DraftBotReactionMessage
	).reply(interaction);
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
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOWEST
};