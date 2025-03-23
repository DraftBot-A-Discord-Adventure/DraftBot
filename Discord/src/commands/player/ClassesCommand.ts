import {
	CommandClassesChangeSuccessPacket,
	CommandClassesPacketReq
} from "../../../../Lib/src/packets/commands/CommandClassesPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {
	ReactionCollectorCreationPacket,
	ReactionCollectorRefuseReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {ReactionCollectorReturnType} from "../../packetHandlers/handlers/ReactionCollectorHandlers";
import {
	ReactionCollectorChangeClassData,
	ReactionCollectorChangeClassReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorChangeClass";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	InteractionCollector,
	Message,
	parseEmoji, StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder
} from "discord.js";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {dateDisplay} from "../../../../Lib/src/utils/TimeUtils";
import {PacketUtils} from "../../utils/PacketUtils";
import {ReactionCollectorResetTimerPacketReq} from "../../../../Lib/src/packets/interaction/ReactionCollectorResetTimer";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";

/**
 * Get the packet
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandClassesPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandClassesPacketReq, {});
}

export async function handleCommandClassesChangeSuccessPacket(packet: CommandClassesChangeSuccessPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);

	if (!interaction) {
		return;
	}

	const lng = context.discord!.language;
	const title = i18n.t("commands:classes.success", { lng, pseudo: interaction.user.displayName });
	const description = i18n.t("commands:classes.newClass", { lng, name: i18n.t(`models:classes.${packet.classId}`, { lng }) });

	await interaction.editReply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(title, interaction.user)
			.setDescription(description)]
	});
}

export async function handleChangeClassReactionCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return null;
	}

	const lng = context.discord!.language;
	const data = packet.data.data as ReactionCollectorChangeClassData;
	const classesReactions = packet.reactions.filter(reaction => reaction.type === ReactionCollectorChangeClassReaction.name).map(reaction => reaction.data) as ReactionCollectorChangeClassReaction[];

	const mainEmbed = new DraftBotEmbed()
		.setTitle(i18n.t("commands:classes.title", { lng }))
		.setDescription(i18n.t("commands:classes.desc", { lng }))
		.addFields(classesReactions.map(reaction => ({
			name: DisplayUtils.getClassDisplay(reaction.classId, lng),
			value: i18n.t(`commands:classes.description.${reaction.classId}`, { lng })
		})));

	const refuseCustomId = "refuse";
	const acceptCustomId = "validate";

	const mainEmbedRow = new ActionRowBuilder<StringSelectMenuBuilder>();
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId("classSelectionMenu")
		.setPlaceholder(i18n.t("commands:classes.chooseClass", { lng }));
	for (const reaction of classesReactions) {
		selectMenu.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t(`models:classes.${reaction.classId}`, { lng }))
			.setValue(reaction.classId.toString())
			.setEmoji(parseEmoji(DraftBotIcons.classes[reaction.classId])!));
	}

	selectMenu.addOptions(new StringSelectMenuOptionBuilder()
		.setLabel(i18n.t("commands:classes.refuse", { lng }))
		.setValue(refuseCustomId)
		.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!));

	mainEmbedRow.addComponents(selectMenu);

	const msg = await interaction?.editReply({
		embeds: [mainEmbed],
		components: [mainEmbedRow]
	}) as Message;

	let validateCollector: InteractionCollector<never>;

	const selectCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	selectCollector.on("collect", async (selectMenuInteraction: StringSelectMenuInteraction) => {
		if (selectMenuInteraction.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(selectMenuInteraction.user, selectMenuInteraction, interaction.userLanguage);
			return;
		}

		await selectMenuInteraction.deferReply();
		await msg.edit({
			embeds: [mainEmbed],
			components: []
		});

		const selectedOption = selectMenuInteraction.values[0];

		if (selectedOption === refuseCustomId) {
			DiscordCollectorUtils.sendReaction(
				packet,
				context,
				context.keycloakId!,
				selectMenuInteraction,
				packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorRefuseReaction.name)
			);
			return;
		}

		// Reset the collector timer, so it doesn't end while the user is still choosing either to validate or refuse
		PacketUtils.sendPacketToBackend(context, makePacket(ReactionCollectorResetTimerPacketReq, { reactionCollectorId: packet.id }));

		const classDetails = data.classesDetails.find(details => details.id === parseInt(selectedOption))!;

		const validateClassChangeEmbed = new DraftBotEmbed()
			.formatAuthor(i18n.t("commands:classes.confirm", { lng, pseudo: interaction.user.displayName }), interaction.user)
			.setDescription(i18n.t("commands:classes.display", {
				lng,
				name: i18n.t("models:classWithStatsFormat", {
					lng,
					id: classDetails.id,
					energy: classDetails.energy,
					attack: classDetails.attack,
					defense: classDetails.defense,
					speed: classDetails.speed,
					initialBreath: classDetails.initialBreath,
					maxBreath: classDetails.maxBreath,
					breathRegen: classDetails.breathRegen,
					health: classDetails.health,
					interpolation: { escapeValue: false }
				}),
				description: i18n.t(`commands:classes.description.${classDetails.id}`, { lng, interpolation: { escapeValue: false } }),
				time: dateDisplay(new Date(Date.now() + data.cooldownSeconds * 1000)),
				interpolation: { escapeValue: false }
			}));

		const validateRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.collectors.accept)!)
				.setCustomId(acceptCustomId)
				.setStyle(ButtonStyle.Secondary))
			.addComponents(new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
				.setCustomId(refuseCustomId)
				.setStyle(ButtonStyle.Secondary));

		const validateMsg = await selectMenuInteraction.editReply({
			embeds: [validateClassChangeEmbed],
			components: [validateRow]
		}) as Message;

		validateCollector = validateMsg.createMessageComponentCollector() as unknown as InteractionCollector<never>;

		validateCollector.on("collect", async (validateInteraction: ButtonInteraction) => {
			if (validateInteraction.user.id !== context.discord?.user) {
				await sendInteractionNotForYou(validateInteraction.user, validateInteraction, interaction.userLanguage);
				return;
			}

			await validateInteraction.deferReply();

			if (validateInteraction.customId === refuseCustomId) {
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					context.keycloakId!,
					validateInteraction,
					packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorRefuseReaction.name)
				);
				return;
			}

			DiscordCollectorUtils.sendReaction(
				packet,
				context,
				context.keycloakId!,
				validateInteraction,
				classesReactions.findIndex(reaction => reaction.classId === classDetails.id)
			);
		});

		validateCollector.on("end", async () => {
			await validateMsg.edit({
				components: []
			});
		});
	});

	selectCollector.on("end", async () => {
		await msg.edit({
			components: []
		});
		if (validateCollector && !validateCollector.ended) {
			validateCollector.stop();
		}
	});

	return [selectCollector];
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("classes"),
	getPacket,
	mainGuildCommand: false
};