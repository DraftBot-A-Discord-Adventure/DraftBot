import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "../../core/database/game/models/Player";
import {
	CommandGuildLeaveAcceptPacketRes,
	CommandGuildLeavePacketReq, CommandGuildLeaveRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandGuildLeavePacket";
import {Guilds} from "../../core/database/game/models/Guild";
import {ReactionCollectorGuildLeave} from "../../../../Lib/src/packets/interaction/ReactionCollectorGuildLeave";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";

async function acceptGuildleave(player: Player, response: DraftBotPacket[]): Promise<void> {
	await player.reload();
	if (player.guildId === null) {
		return;
	}
	const guild = await Guilds.getById(player.guildId);
	if (player.id === guild.chiefId) {
		if (guild.elderId !== null) {
			const elder = await Players.getById(guild.elderId);
			guild.elderId = null;
			guild.chiefId = elder.id;
			response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
				newChiefKeycloakId: elder.keycloakId,
				guildName: guild.name
			}));
			return;
		}
		// TODO : détruire la guilde ici
		response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
			guildName: guild.name
		}));
		return;
	}
	if (guild.elderId === player.id) {
		guild.elderId = null;
	}
	player.guildId = null;
	response.push(makePacket(CommandGuildLeaveAcceptPacketRes, {
		guildName: guild.name
	}));
}

export default class GuildElderCommand {
	@commandRequires(CommandGuildLeavePacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: GuildConstants.REQUIRED_LEVEL,
		guildNeeded: true
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandGuildLeavePacketReq, context: PacketContext): Promise<void> {
		if (player.guildId === null) {
			return;
		}
		const guild = await Guilds.getById(player.guildId);
		const elder = await Players.getById(guild.elderId);

		const collector = new ReactionCollectorGuildLeave(
			guild.name,
			elder.keycloakId
		);
		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				await acceptGuildleave(player, response);
			}
			else {
				response.push(makePacket(CommandGuildLeaveRefusePacketRes, {}));
			}
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GUILD_LEAVE);
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
			.block(player.id, BlockingConstants.REASONS.GUILD_LEAVE)
			.build();

		response.push(collectorPacket);
	}
}