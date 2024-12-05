import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandClassesInfoPacketReq,
	CommandClassesInfoPacketRes
} from "../../../../Lib/src/packets/commands/CommandClassesInfoPacket";

import {ClassDataController} from "../../data/Class";
import {FightActionDataController} from "../../data/FightAction";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {ClassConstants} from "../../../../Lib/src/constants/ClassConstants";
import Player from "../../core/database/game/models/Player";

export default class ClassesInfoCommand {
	@commandRequires(CommandClassesInfoPacketReq, {
		blocking: false,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.STARTED_AND_NOT_DEAD,
		level: ClassConstants.REQUIRED_LEVEL
	})
	async execute(response: DraftBotPacket[], player: Player): Promise<void> {
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
					emoji: DraftBotIcons.fight_actions[attack]
				});
			}
			classesLineDisplay.push({
				id: classToShow.id,
				stats,
				attacks: attackList
			});
		}

		response.push(makePacket(CommandClassesInfoPacketRes, {
			data: {
				classesStats: classesLineDisplay
			}
		}));
	}
}