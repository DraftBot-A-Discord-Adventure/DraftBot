import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {Guilds} from "../../core/database/game/models/Guild";
import {
	CommandGuildKickAcceptPacketRes,
	CommandGuildKickPacketReq,
	CommandGuildKickPacketRes,
	CommandGuildKickRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildKickPacket";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {CommandUtils} from "../../core/utils/CommandUtils";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {GuildRole} from "../../../../Lib/src/enums/GuildRole";
import {ReactionCollectorGuildKick} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildKick";
import {draftBotInstance} from "../../index";

async function acceptGuildKick(player: Player, kickedPlayer: Player, response: DraftBotPacket[]): Promise<void> {
	await player.reload();
	// Do all necessary checks again just in case something changed during the menu
	if (await isNotEligible(player, kickedPlayer, response)) {
		return;
	}

	const guild = await Guilds.getById(player.guildId);
	kickedPlayer.guildId = null;

	if (guild.elderId === kickedPlayer.id) {
		guild.elderId = null;
	}
	await Promise.all([
		kickedPlayer.save(),
		guild.save()
	]);
	draftBotInstance.logsDatabase.logGuildKick(player.keycloakId, guild).then();

	response.push(makePacket(CommandGuildKickAcceptPacketRes, {
		kickedKeycloakId: kickedPlayer.keycloakId,
		guildName: guild.name
	}));
}

/**
 * Check if the player can kick a member from his guild
 * @param player The player who wants to kick a member
 * @param kickedPlayer The player to kick
 * @param response The response to send
 */
async function isNotEligible(player: Player, kickedPlayer: Player, response: DraftBotPacket[]): Promise<boolean> {
	if (kickedPlayer === null) {
		// No user provided
		response.push(makePacket(CommandGuildKickPacketRes, {
			foundPlayer: false,
			sameGuild: false,
			himself: false
		}));
		return true;
	}
	let kickedGuild;
	// Search for a user's guild
	try {
		kickedGuild = await Guilds.getById(kickedPlayer.guildId);
	}
	catch (error) {
		kickedGuild = null;
	}

	if (kickedGuild === null || kickedGuild.id !== player.guildId) {
		// Different guild
		response.push(makePacket(CommandGuildKickPacketRes, {
			foundPlayer: true,
			sameGuild: false,
			himself: false
		}));
		return true;
	}

	if (kickedPlayer.id === player.id) {
		// Different guild
		response.push(makePacket(CommandGuildKickPacketRes, {
			foundPlayer: true,
			sameGuild: true,
			himself: true
		}));
		return true;
	}
	return false;
}

export default class GuildKickCommand {
	@packetHandler(CommandGuildKickPacketReq)
	async execute(packet: CommandGuildKickPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);

		if (!await CommandUtils.verifyCommandRequirements(player, context, response, {
			disallowedEffects: [Effect.NOT_STARTED, Effect.DEAD],
			level: GuildConstants.REQUIRED_LEVEL,
			guildNeeded: true,
			guildRoleNeeded: GuildRole.CHIEF
		})) {
			return;
		}

		const kickedPlayer = packet.askedPlayer.keycloakId
			? packet.askedPlayer.keycloakId === context.keycloakId
				? player
				: await Players.getByKeycloakId(packet.askedPlayer.keycloakId)
			: await Players.getByRank(packet.askedPlayer.rank);

		if (await isNotEligible(player, kickedPlayer, response)) {
			return;
		}

		const guildName = (await Guilds.getById(player.guildId)).name;

		// Send collector
		const collector = new ReactionCollectorGuildKick(
			guildName,
			kickedPlayer.keycloakId
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptGuildKick(player, kickedPlayer, response);
			}
			else {
				response.push(makePacket(CommandGuildKickRefusePacketRes, {
					kickedKeycloakId: kickedPlayer.keycloakId
				}));
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_KICK);
		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.GUILD_KICK)
			.build();

		response.push(collectorPacket);
	}
}