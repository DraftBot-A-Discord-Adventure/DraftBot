import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "../../core/database/game/models/Player";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {ReactionCollectorFight} from "../../../../Lib/src/packets/interaction/ReactionCollectorFight";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	CommandFightPacketReq,
	CommandFightRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandFightPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";


export default class FightCommand {
	@commandRequires(CommandFightPacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: FightConstants.REQUIRED_LEVEL
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandFightPacketReq, context: PacketContext): Promise<void> {
		const toCheckPlayer = await Players.getAskedPlayer({keycloakId: packet.playerKeycloakId}, player);
		const playerActiveObjects = await InventorySlots.getMainSlotsItems(toCheckPlayer.id);

		const collector = new ReactionCollectorFight(
			{
				classId: toCheckPlayer.class,
				fightRanking: {
					glory: toCheckPlayer.gloryPoints
				},
				energy: {
					value: toCheckPlayer.getCumulativeFightPoint(),
					max: toCheckPlayer.getMaxCumulativeFightPoint()
				},
				attack: toCheckPlayer.getCumulativeAttack(playerActiveObjects),
				defense: toCheckPlayer.getCumulativeDefense(playerActiveObjects),
				speed: toCheckPlayer.getCumulativeSpeed(playerActiveObjects),
				breath: {
					base: toCheckPlayer.getBaseBreath(),
					max: toCheckPlayer.getMaxBreath(),
					regen: toCheckPlayer.getBreathRegen()
				}
			}
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();
			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				// Acceptation du fight/matchmaking
			}
			else {
				response.push(makePacket(CommandFightRefusePacketRes, {}));
			}
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
			.block(player.id, BlockingConstants.REASONS.FIGHT)
			.build();

		response.push(collectorPacket);
	}
}

