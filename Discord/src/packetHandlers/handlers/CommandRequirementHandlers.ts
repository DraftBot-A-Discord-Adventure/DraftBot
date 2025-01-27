import {packetHandler} from "../PacketHandler";
import {RequirementEffectPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementEffectPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {effectsErrorTextValue, replyEphemeralErrorMessage} from "../../utils/ErrorUtils";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {RequirementGuildNeededPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildNeededPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {RequirementGuildRolePacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildRolePacket";
import {RequirementLevelPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementLevelPacket";
import {RequirementRightPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementRightPacket";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";

export default class CommandRequirementHandlers {
	@packetHandler(RequirementEffectPacket)
	async requirementEffect(context: PacketContext, packet: RequirementEffectPacket): Promise<void> {
		const keycloakUser = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!);
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (keycloakUser) {
			const effectsText = effectsErrorTextValue(keycloakUser, context.discord!.language!, true, packet.currentEffectId, packet.remainingTime);
			if (!interaction) {
				return;
			}
			if (interaction.deferred) {
				interaction.deleteReply();
			}
			await (interaction.replied ? interaction.followUp : interaction.reply)({
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

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notInAGuild", {lng: interaction.userLanguage}));
	}

	@packetHandler(RequirementGuildRolePacket)
	async requirementGuildRole(context: PacketContext, _packet: RequirementGuildRolePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (!interaction) {
			return;
		}

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notAuthorizedError", {lng: interaction.userLanguage}));
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

		await replyEphemeralErrorMessage(interaction, i18n.t("error:notAuthorizedRight", {lng: interaction.userLanguage}));
	}
}