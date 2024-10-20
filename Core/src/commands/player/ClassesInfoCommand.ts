import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {
	CommandClassesInfoPacketReq,
	CommandClassesInfoPacketRes
} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";

import {ClassDataController} from "../../data/Class";
import {Players} from "../../core/database/game/models/Player";
import {FightActionDataController} from "../../data/FightAction";

export default class ClassesInfoCommand {
	@packetHandler(CommandClassesInfoPacketReq)
	async execute(packet: CommandClassesInfoPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);

		if (!player) {
			response.push(makePacket(CommandClassesInfoPacketRes, {
				foundPlayer: false
			}));
		}
		else {
			const classGroup = player.getClassGroup();
			const classes = ClassDataController.instance.getByGroup(classGroup);

			const classesLineDisplay = [];
			for (const classToShow of classes) {
				const stats = classToShow.getClassStats(player.level);

				const attacks = classToShow.fightActionsIds;
				const attackStats = FightActionDataController.instance.getListById(attacks);

				const attackList = [];
				for (const attack of attacks) {
					const attackStat = attackStats.find((attackStat) => attackStat.id === attack);
					attackList.push({
						id: attack,
						cost: attackStat.breath,
						emoji: attackStat.emote
					});
				}
				classesLineDisplay.push({
					id: classToShow.id,
					emoji: classToShow.emoji,
					lng: packet.language,
					health: stats.health,
					attack: stats.attack,
					defense: stats.defense,
					speed: stats.speed,
					baseBreath: stats.baseBreath,
					maxBreath: stats.maxBreath,
					breathRegen: stats.breathRegen,
					fightPoint: stats.fightPoint,
					attacks: attackList,
					attackStats,
					description: "Todo"
				});
			}

			response.push(makePacket(CommandClassesInfoPacketRes, {
				foundPlayer: true,
				data: {
					classesStats: classesLineDisplay
				}
			}));
		}
	}
}