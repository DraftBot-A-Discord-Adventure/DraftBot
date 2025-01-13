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

type PlayerStats = {
    classId: number,
    fightRanking: {
        glory: number,
    }
    energy: {
        value: number,
        max: number
    },
    attack: number,
    defense: number,
    speed: number
    breath: {
        base: number,
        max: number,
        regen: number
    }
}

async function getPlayerStats(player: Player): Promise<PlayerStats> {
    const playerActiveObjects = await InventorySlots.getMainSlotsItems(player.id);
    return {
        classId: player.class,
        fightRanking: {
            glory: player.getGloryPoints()
        },
        energy: {
            value: player.getCumulativeFightPoint(),
            max: player.getMaxCumulativeFightPoint()
        },
        attack: player.getCumulativeAttack(playerActiveObjects),
        defense: player.getCumulativeDefense(playerActiveObjects),
        speed: player.getCumulativeSpeed(playerActiveObjects),
        breath: {
            base: player.getBaseBreath(),
            max: player.getMaxBreath(),
            regen: player.getBreathRegen()
        }
    };
}

/**
 * Find another player to fight the player that started the command
 * @param player
 * @returns player opponent
 */
function findOpponent(player: Player): Player {
    const closestPlayers = Players.findByDefenseGlory(player.attackGloryPoints,5,0)
    //shuffle l'array
    //loop dessus pour check les autres conditions
    return
}

export default class FightCommand {
    @commandRequires(CommandFightPacketReq, {
        notBlocked: true,
        disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
        level: FightConstants.REQUIRED_LEVEL
    })
    async execute(response: DraftBotPacket[], player: Player, packet: CommandFightPacketReq, context: PacketContext): Promise<void> {
        const toCheckPlayer = await Players.getAskedPlayer({keycloakId: packet.playerKeycloakId}, player);

        const collector = new ReactionCollectorFight(
            await getPlayerStats(toCheckPlayer)
        );

        const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
            const reaction = collector.getFirstReaction();
            if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {

                // Acceptation du fight/matchmaking
            } else {
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
            .block(player.id, BlockingConstants.REASONS.FIGHT_CONFIRMATION)
            .build();

        response.push(collectorPacket);
    }
}

