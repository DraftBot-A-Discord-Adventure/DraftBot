import {packetHandler} from "../../core/packetHandlers/PacketHandler.js";
import {
	CommandGuildInviteAcceptPacketRes,
	CommandGuildInvitePacketReq,
	CommandGuildInvitePacketRes, CommandGuildInviteRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildInvitePacket.js";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket.js";
import {Player, Players} from "../../core/database/game/models/Player.js";
import {Guild, Guilds} from "../../core/database/game/models/Guild.js";
import {Maps} from "../../core/maps/Maps.js";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants.js";
import {ReactionCollectorGuildInvite} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildInvite.js";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector.js";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket.js";
import {BlockingUtils} from "../../core/utils/BlockingUtils.js";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants.js";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase.js";
import {MissionsController} from "../../core/missions/MissionsController.js";

export default class GuildInviteCommand {
	@packetHandler(CommandGuildInvitePacketReq)
	async execute(packet: CommandGuildInvitePacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const invitingPlayer = await Players.getByKeycloakId(packet.invitingPlayer.keycloakId);
		const invitedPlayer = await Players.getByKeycloakId(packet.invitedPlayer.keycloakId);
		const guild = invitingPlayer.guildId ? await Guilds.getById(invitingPlayer.guildId) : null;

		if (!await canSendInvite(invitingPlayer, invitedPlayer, guild, response)) {
			return;
		}

		const collector = new ReactionCollectorGuildInvite(
			guild.name,
			invitedPlayer.keycloakId
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptInvitation(invitedPlayer, invitingPlayer, guild, response);
			}
			else {
				response.push(makePacket(CommandGuildInviteRefusePacketRes, {
					invitedPlayerKeycloakId: packet.invitedPlayer.keycloakId,
					guildName: guild.name
				}));
			}
			BlockingUtils.unblockPlayer(invitedPlayer.id, BlockingConstants.REASONS.GUILD_ADD);
		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [invitedPlayer.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(invitedPlayer.id, BlockingConstants.REASONS.GUILD_ADD)
			.build();

		response.push(collectorPacket);
	}
}

/**
 * Check if the invitation can be sent
 * @param invitingPlayer
 * @param invitedPlayer
 * @param guild
 * @param response
 */
async function canSendInvite(invitingPlayer: Player, invitedPlayer: Player, guild: Guild, response: DraftBotPacket[]): Promise<boolean> {
	const basePacketData = {
		invitedPlayerKeycloakId: invitedPlayer.keycloakId,
		invitingPlayerKeycloakId: invitingPlayer.keycloakId,
		guildName: guild.name
	};

	if (!guild) {
		response.push(makePacket(CommandGuildInvitePacketRes, {
			...basePacketData,
			invitingPlayerNotInGuild: true
		}));
		return false;
	}

	if (invitedPlayer.isInGuild()) {
		response.push(makePacket(CommandGuildInvitePacketRes, {
			...basePacketData,
			alreadyInAGuild: true
		}));
		return false;
	}

	if ((await Players.getByGuild(guild.id)).length === GuildConstants.MAX_GUILD_MEMBERS) {
		response.push(makePacket(CommandGuildInvitePacketRes, {
			...basePacketData,
			guildIsFull: true
		}));
		return false;
	}

	if (invitedPlayer.isDead()) {
		response.push(makePacket(CommandGuildInvitePacketRes, {
			...basePacketData,
			invitedPlayerIsDead: true
		}));
		return false;
	}

	if (Maps.isOnPveIsland(invitedPlayer)) {
		response.push(makePacket(CommandGuildInvitePacketRes, {
			...basePacketData,
			invitedPlayerIsOnPveIsland: true
		}));
		return false;
	}

	response.push(makePacket(CommandGuildInvitePacketRes, {
		...basePacketData
	}));
	return true;
}

async function acceptInvitation(invitedPlayer: Player, invitingPlayer: Player, guild: Guild, response: DraftBotPacket[]): Promise<void> {
	await invitedPlayer.reload();
	await invitingPlayer.reload();

	invitedPlayer.guildId = guild.id;
	guild.updateLastDailyAt();
	await guild.save();
	await invitedPlayer.save();
	await LogsDatabase.logsGuildJoin(guild, invitedPlayer.keycloakId, invitingPlayer.keycloakId);
	await MissionsController.update(invitedPlayer, response, {
		missionId: "guildLevel",
		count: guild.level,
		set: true
	});

	response.push(makePacket(CommandGuildInviteAcceptPacketRes, {
		guildName: guild.name,
		invitedPlayerKeycloakId: invitedPlayer.keycloakId
	}));
}