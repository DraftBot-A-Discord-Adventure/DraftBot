import {
	CommandClassesInfoPacketReq,
	CommandClassesInfoPacketRes
} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {Effect} from "../../../../Lib/src/enums/Effect";
import { Constants } from "../../../../Lib/src/constants/Constants";
import {ClassInfoConstants} from "../../../../Lib/src/constants/ClassInfoConstants";
import {Language} from "../../../../Lib/src/Language";
import {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder
} from "discord.js";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";

/**
 * Get the packet
 */
function getPacket(): Promise<CommandClassesInfoPacketReq> {
	return Promise.resolve(makePacket(CommandClassesInfoPacketReq, {}));
}

/**
 * Get the list of classes
 * @param packet
 * @param language
 * @param classList
 */
function getListEmbed(packet: CommandClassesInfoPacketRes, language: Language, classList: {
	id: number,
	health: number,
	attack: number,
	defense: number,
	speed: number,
	baseBreath: number,
	maxBreath: number,
	breathRegen: number,
	fightPoint: number,
	attacks: {
		id: string,
		cost: number
	}[]
}[]): DraftBotEmbed {
	const embed = new DraftBotEmbed().setTitle(i18n.t("commands:classesInfo.title.list", {
		lng: language
	}));

	const classesList = [];
	for (const classStats of classList) {
		classesList.push(`${
			i18n.t("commands:classesInfo.displays.class.name", {
				lng: language,
				emoji: DraftBotIcons.classes[classStats.id],
				name: i18n.t(`models:classes.${classStats.id}`, {
					lng: language
				})
			})
		}\n${
			i18n.t("commands:classesInfo.displays.class.stats", {
				lng: language,
				health: classStats.health,
				attack: classStats.attack,
				defense: classStats.defense,
				speed: classStats.speed,
				baseBreath: classStats.baseBreath,
				maxBreath: classStats.maxBreath,
				breathRegen: classStats.breathRegen,
				fightPoint: classStats.fightPoint
			})
		}`);
	}

	embed.setDescription(`${i18n.t("commands:classesInfo.description.list", {
		lng: language
	})}\n\n${classesList.join("\n")}`);

	return embed;
}

/**
 * Get the details of a class
 * @param packet
 * @param language
 * @param classDetails
 */
function getDetailsEmbed(packet: CommandClassesInfoPacketRes, language: Language, classDetails: {
	name: string,
	description: string,
	attacks: {
		id: string,
		name: string,
		description: string,
		cost: number
	}[]
}): DraftBotEmbed {
	const embed = new DraftBotEmbed().setTitle(classDetails.name);

	const attackDisplays = [];
	for (const attack of classDetails.attacks) {
		attackDisplays.push(`${
			i18n.t("commands:classesInfo.displays.attack.name", {
				lng: language,
				emoji: DraftBotIcons.fight_actions[attack.id],
				name: attack.name,
				cost: attack.cost
			})
		}\n${
			i18n.t("commands:classesInfo.displays.attack.description", {
				lng: language,
				description: attack.description
			})
		}`);
	}

	embed.setDescription(`${classDetails.description}${
		i18n.t("commands:classesInfo.description.attacks", {
			lng: language
		})
	}\n\n${attackDisplays.join("\n")}`);
	return embed;
}

/**
 * Handle the response packet
 * @param packet
 * @param context
 */
export async function handleCommandClassesInfoPacketRes(packet: CommandClassesInfoPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				content: i18n.t("error.playerDoesntExist", {
					lng: interaction.userLanguage
				}),
				ephemeral: true
			});
		}

		const classListEmbed = getListEmbed(packet, interaction.userLanguage, packet.data!.classesStats);

		const classesMenuOptions = packet.data!.classesStats.map((classStats) => new StringSelectMenuOptionBuilder()
			.setLabel(`${i18n.t(`models:classes.${classStats.id}`, {
				lng: interaction.userLanguage
			})}`)
			.setEmoji(DraftBotIcons.classes[classStats.id])
			.setValue(classStats.id.toString()));

		const classSelectionMenuOption = new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t("commands:classesInfo.mainOption.name", {
				lng: interaction.userLanguage
			}))
			.setEmoji(ClassInfoConstants.LIST_EMOTE)
			.setValue(ClassInfoConstants.MENU_IDS.LIST_OPTION);

		classesMenuOptions.unshift(classSelectionMenuOption);

		const classSelectionMenu = new StringSelectMenuBuilder()
			.setCustomId(ClassInfoConstants.MENU_IDS.CLASS_SELECTION)
			.setPlaceholder(i18n.t("commands:classesInfo.mainOption.placeholder", {
				lng: interaction.userLanguage
			}))
			.addOptions(classesMenuOptions);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(classSelectionMenu);

		const msg = await interaction.reply({
			embeds: [classListEmbed],
			components: [row]
		});

		const collector = msg.createMessageComponentCollector({
			filter: menuInteraction => menuInteraction.customId === ClassInfoConstants.MENU_IDS.CLASS_SELECTION,
			time: Constants.MESSAGES.COLLECTOR_TIME
		});

		collector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {
			if (menuInteraction.user.id !== interaction.user.id) {
				await sendInteractionNotForYou(menuInteraction.user, menuInteraction, interaction.userLanguage);
				return;
			}

			if (menuInteraction.values[0] === ClassInfoConstants.MENU_IDS.LIST_OPTION) {
				await menuInteraction.update({
					embeds: [classListEmbed],
					components: [row]
				});
			}
			else {
				const chosenClass = packet.data!.classesStats.find((classStats) => classStats.id === parseInt(menuInteraction.values[0]));
				const attackList = [];

				for (const attack of chosenClass!.attacks) {
					attackList.push({
						id: attack.id,
						name: `${i18n.t(`models:fight_actions.${attack.id}.name_one`, {
							lng: interaction.userLanguage
						})}`,
						description: `${i18n.t(`models:fight_actions.${attack.id}.description`, {
							lng: interaction.userLanguage
						})}`,
						cost: attack.cost
					});
				}

				const classDetailsEmbed = getDetailsEmbed(packet, interaction.userLanguage, {
					name: i18n.t(`models:classes.${parseInt(menuInteraction.values[0])}`, {
						lng: interaction.userLanguage
					}),
					description: i18n.t(`models:class_descriptions.${parseInt(menuInteraction.values[0])}`, {
						lng: interaction.userLanguage
					}),
					attacks: attackList
				});

				await menuInteraction.update({
					embeds: [classDetailsEmbed],
					components: [row]
				});
			}
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("classesInfo"),
	getPacket,
	requirements: {
		disallowEffects: [Effect.DEAD, Effect.NOT_STARTED],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};