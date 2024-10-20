import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
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

function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandClassesInfoPacketReq> {
	return Promise.resolve(makePacket(CommandClassesInfoPacketReq, {keycloakId: user.id, language: interaction.userLanguage}));
}

function getListEmbed(packet: CommandClassesInfoPacketRes, language: Language, classList: {
	id: number,
	emoji: string,
	lng: Language,
	health: number,
	attack: number,
	defense: number,
	speed: number,
	baseBreath: number,
	maxBreath: number,
	breathRegen: number,
	fightPoint: number,
	description: string,
	attacks: {
		id: string,
		cost: number,
		emoji: string
	}[]
}[]): DraftBotEmbed {
	const embed = new DraftBotEmbed().setTitle(i18n.t("commands:classesInfo.title.list", {
		lng: language
	}));

	const classesList = [];
	for (const classStats of classList) {
		classesList.push(ClassInfoConstants.FIELDS_VALUE
			.replace("{name}", `${classStats.emoji} ${i18n.t(`models:classes.${classStats.id}`, {
				lng: classStats.lng
			})}`)
			.replace("{health}", classStats.health.toString())
			.replace("{attack}", classStats.attack.toString())
			.replace("{defense}", classStats.defense.toString())
			.replace("{speed}", classStats.speed.toString())
			.replace("{baseBreath}", classStats.baseBreath.toString())
			.replace("{maxBreath}", classStats.maxBreath.toString())
			.replace("{breathRegen}", classStats.breathRegen.toString())
			.replace("{fightPoint}", classStats.fightPoint.toString()));
	}

	embed.setDescription(`${i18n.t("commands:classesInfo.description.list", {
		lng: language
	})}\n\n${classesList.join("\n")}`);

	return embed;
}

// Todo: edit the function's instructions to match the actual implementation
function getDetailsEmbed(packet: CommandClassesInfoPacketRes, language: Language, classDetails: {
	name: string,
	description: string,
	attacks: {
		name: string,
		description: string,
		cost: number,
		emoji: string
	}[]
}): DraftBotEmbed {
	const embed = new DraftBotEmbed().setTitle(classDetails.name);

	const attackDisplays = [];
	for (const attack of classDetails.attacks) {
		const attackDisplay = `### ${attack.emoji} ${i18n.t(attack.name, {
			lng: language
		})} | ${attack.cost} :wind_blowing_face:\n${i18n.t(attack.description, {
			lng: language
		})}`;

		attackDisplays.push(attackDisplay);
	}

	embed.setDescription(`${classDetails.description}${
		i18n.t("commands:classesInfo.description.attacks", {
			lng: language
		})
	}\n${attackDisplays.join("\n")}`);
	return embed;
}

export async function handleCommandClassesInfoPacketRes(packet: CommandClassesInfoPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				content: "commands:error.playerDoesntExist",
				ephemeral: true
			});
		}

		const classListEmbed = getListEmbed(packet, interaction.userLanguage, packet.data!.classesStats);

		// With menu
		const classMenuId = "classSelectionMenu";
		const listOptionId = "listOption";

		const classesMenuOptions = packet.data!.classesStats.map((classStats) => new StringSelectMenuOptionBuilder()
			.setLabel(`${i18n.t(`models:classes.${classStats.id}`, {
				lng: classStats.lng
			})}`)
			.setEmoji(classStats.emoji)
			.setValue(classStats.id.toString()));

		const classSelectionMenuOption = new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t("commands:classesInfo.mainOption.name", {
				lng: interaction.userLanguage
			}))
			.setEmoji(ClassInfoConstants.LIST_EMOTE)
			.setValue(listOptionId);

		classesMenuOptions.unshift(classSelectionMenuOption);

		const classSelectionMenu = new StringSelectMenuBuilder()
			.setCustomId(classMenuId)
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
			filter: menuInteraction => menuInteraction.customId === classMenuId,
			time: Constants.MESSAGES.COLLECTOR_TIME
		});

		collector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {
			if (menuInteraction.user.id !== interaction.user.id) {
				await sendInteractionNotForYou(menuInteraction.user, menuInteraction, interaction.userLanguage);
				return;
			}

			if (menuInteraction.values[0] === listOptionId) {
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
						name: `${i18n.t(`models:fight_actions.${attack.id}.name_one`, {
							lng: interaction.userLanguage
						})}`,
						description: `${i18n.t(`models:fight_actions.${attack.id}.description`, {
							lng: interaction.userLanguage
						})}`,
						cost: attack.cost,
						emoji: attack.emoji
					});
				}

				const classDetailsEmbed = getDetailsEmbed(packet, interaction.userLanguage, {
					name: `${chosenClass!.emoji} ${i18n.t(`models:classes.${parseInt(menuInteraction.values[0])}`, {
						lng: interaction.userLanguage
					})}`,
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