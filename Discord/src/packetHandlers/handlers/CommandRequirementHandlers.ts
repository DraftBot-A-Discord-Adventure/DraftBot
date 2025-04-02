import { packetHandler } from "../PacketHandler";
import { RequirementEffectPacket } from "../../../../Lib/src/packets/commands/requirements/RequirementEffectPacket";
import { PacketContext } from "../../../../Lib/src/packets/DraftBotPacket";
import {
	effectsErrorTextValue, replyEphemeralErrorMessage
} from "../../utils/ErrorUtils";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { RequirementGuildNeededPacket } from "../../../../Lib/src/packets/commands/requirements/RequirementGuildNeededPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import { RequirementGuildRolePacket } from "../../../../Lib/src/packets/commands/requirements/RequirementGuildRolePacket";
import { RequirementLevelPacket } from "../../../../Lib/src/packets/commands/requirements/RequirementLevelPacket";
import { RequirementRightPacket } from "../../../../Lib/src/packets/commands/requirements/RequirementRightPacket";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { RequirementWherePacket } from "../../../../Lib/src/packets/commands/requirements/RequirementWherePacket";
import { MessagesUtils } from "../../utils/MessagesUtils";

export default class CommandRequirementHandlers {
	@packetHandler(RequirementEffectPacket)
	async requirementEffect(context: PacketContext, packet: RequirementEffectPacket): Promise<void> {
		const keycloakUser = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!);
		const interaction = context.discord!.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord!.buttonInteraction) : DiscordCache.getInteraction(context.discord!.interaction);
		if (keycloakUser) {
			const effectsText = effectsErrorTextValue(keycloakUser, context.discord!.language!, true, packet.currentEffectId, packet.remainingTime);
			if (!interaction) {
				return;
			}
			if (interaction.deferred) {
				await interaction.deleteReply();
			}

			// Without a bind, context is lost for "this"
			await (interaction.replied || interaction.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction))({
				embeds: [
					new DraftBotEmbed()
						.setErrorColor()
						.formatAuthor(effectsText.title, interaction.user)
						.setDescription(effectsText.description)
				],
				ephemeral: true
			});
		}
	}

	@packetHandler(RequirementGuildNeededPacket)
	async requirementGuildNeeded(context: PacketContext, _packet: RequirementGuildNeededPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notInAGuild", { lng: interaction.userLanguage }));
	}

	@packetHandler(RequirementGuildRolePacket)
	async requirementGuildRole(context: PacketContext, _packet: RequirementGuildRolePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notAuthorizedError", { lng: interaction.userLanguage }));
	}

	@packetHandler(RequirementLevelPacket)
	async requirementLevel(context: PacketContext, packet: RequirementLevelPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyEphemeralErrorMessage(interaction, i18n.t("error:levelTooLow", {
			lng: interaction.userLanguage,
			level: packet.requiredLevel
		}));
	}

	@packetHandler(RequirementRightPacket)
	async requirementRight(context: PacketContext, _packet: RequirementRightPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notAuthorizedRight", { lng: interaction.userLanguage }));
	}

	@packetHandler(RequirementWherePacket)
	async requirementWhere(context: PacketContext, _packet: RequirementWherePacket): Promise<void> {
		const interaction = MessagesUtils.getCurrentInteraction(context);
		await replyEphemeralErrorMessage(interaction, i18n.t("error:commandNotAvailableHere", { lng: context.discord!.language }));
	}
}
