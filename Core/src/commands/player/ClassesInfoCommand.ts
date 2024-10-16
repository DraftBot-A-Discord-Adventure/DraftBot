import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {
	CommandClassesInfoPacketReq,
	CommandClassesInfoPacketRes
} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";

import {ClassDataController} from "../../data/Class";
import {Players} from "../../core/database/game/models/Player";

export default class ClassesInfoCommand {
	@packetHandler(CommandClassesInfoPacketReq)
	async execute(socket: WebsocketClient, packet: CommandClassesInfoPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
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
					fightPoint: stats.fightPoint
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