import { ICommand } from "../ICommand";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import {
	CommandDrinkConsumePotionRes,
	CommandDrinkPacketReq
} from "../../../../Lib/src/packets/commands/CommandDrinkPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { DisplayUtils } from "../../utils/DisplayUtils";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { ReactionCollectorDrinkData } from "../../../../Lib/src/packets/interaction/ReactionCollectorDrink";
import { minutesDisplay } from "../../../../Lib/src/utils/TimeUtils";
import { ReactionCollectorReturnTypeOrNull } from "../../packetHandlers/handlers/ReactionCollectorHandlers";

/**
 * Get the daily bonus packet to send to the server
 * @param interaction
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandDrinkPacketReq> {
	const forceOption = interaction.options.get("force");

	let force = false;
	if (forceOption) {
		force = <boolean>forceOption.value;
	}

	await interaction.deferReply();
	return makePacket(CommandDrinkPacketReq, { force });
}

export async function drinkAcceptCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorDrinkData;

	const embed = new DraftBotEmbed()
		.formatAuthor(
			i18n.t("commands:drink.confirmationTitle", {
				pseudo: interaction.user.displayName,
				lng: interaction.userLanguage
			}),
			interaction.user
		)
		.setDescription(i18n.t("commands:drink.confirmation", {
			lng: interaction.userLanguage,
			potion: DisplayUtils.getItemDisplayWithStats(data.potion, interaction.userLanguage)
		}))
		.setFooter({ text: i18n.t("commands:drink.confirmationFooter", { lng: interaction.userLanguage }) });

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function handleDrinkConsumePotion(context: PacketContext, packet: CommandDrinkConsumePotionRes): Promise<void> {
	const interaction = context.discord!.buttonInteraction
		? DiscordCache.getButtonInteraction(context.discord!.buttonInteraction)
		: DiscordCache.getInteraction(context.discord!.interaction);
	let msg;

	if (packet.time) {
		msg = i18n.t("commands:drink.timeBonus", {
			lng: context.discord!.language,
			value: minutesDisplay(packet.time)
		});
	}
	else if (packet.energy) {
		msg = i18n.t("commands:drink.energyBonus", {
			lng: context.discord!.language,
			value: packet.energy
		});
	}
	else if (packet.health) {
		msg = i18n.t("commands:drink.healthBonus", {
			lng: context.discord!.language,
			value: packet.health
		});
	}
	else {
		msg = i18n.t("commands:drink.noBonus", { lng: context.discord!.language });
	}

	await interaction?.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:drink.drinkSuccessTitle", {
					pseudo: interaction.user.displayName,
					lng: context.discord!.language
				}), interaction.user)
				.setDescription(msg)
		]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("drink"),
	getPacket,
	mainGuildCommand: false
};
