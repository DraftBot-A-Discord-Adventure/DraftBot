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
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
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
	parseEmoji
} from "discord.js";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {dateDisplay} from "../../../../Lib/src/utils/TimeUtils";

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

	await interaction.reply({
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
		.formatAuthor(i18n.t("commands:classes.title", { lng }), interaction.user)
		.setDescription(i18n.t("commands:classes.desc", { lng }))
		.addFields(classesReactions.map(reaction => ({
			name: DisplayUtils.getClassDisplay(reaction.classId, lng),
			value: i18n.t(`commands:classes.description.${reaction.classId}`, { lng })
		})));

	const mainEmbedRow = new ActionRowBuilder<ButtonBuilder>();
	for (let i = 0; i < classesReactions.length; i++) {
		const reaction = classesReactions[i];
		const button = new ButtonBuilder()
			.setEmoji(parseEmoji(DraftBotIcons.classes[reaction.classId])!)
			.setCustomId(reaction.classId.toString())
			.setStyle(ButtonStyle.Secondary);
		mainEmbedRow.addComponents(button);
	}

	const refuseCustomId = "refuse";
	mainEmbedRow.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
		.setCustomId(refuseCustomId)
		.setStyle(ButtonStyle.Secondary));

	const msg = await interaction?.editReply({
		embeds: [mainEmbed],
		components: [mainEmbedRow]
	}) as Message;

	let validateCollector: InteractionCollector<never>;

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		if (buttonInteraction.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(buttonInteraction.user, buttonInteraction, interaction.userLanguage);
			return;
		}

		await buttonInteraction.deferReply();

		const validateClassChangeEmbed = new DraftBotEmbed()
			.formatAuthor(i18n.t("commands:classes.confirm", { lng, pseudo: interaction.user.displayName }), interaction.user)
			.setDescription(i18n.t("commands:classes.display", {
				lng,
				name: /* todo */,
				description: /* todo */,
				time: dateDisplay(new Date(Date.now() + data.cooldownSeconds * 1000))
			}));
	});

	buttonCollector.on("end", async () => {
		if (validateCollector) {
			validateCollector.stop();
		}
	});

	return [buttonCollector];
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("classes"),
	getPacket,
	mainGuildCommand: false
};