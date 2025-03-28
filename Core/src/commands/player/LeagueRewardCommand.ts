import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "../../core/database/game/models/Player";
import {
	CommandLeagueRewardAlreadyClaimedPacketRes,
	CommandLeagueRewardNoPointsPacketRes,
	CommandLeagueRewardNotSundayPacketRes,
	CommandLeagueRewardPacketReq,
	CommandLeagueRewardSuccessPacketRes
} from "../../../../Lib/src/packets/commands/CommandLeagueRewardPacket";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {giveItemToPlayer} from "../../core/utils/ItemUtils";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {draftBotInstance} from "../../index";
import {getNextSaturdayMidnight, todayIsSunday} from "../../../../Lib/src/utils/TimeUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {WhereAllowed} from "../../../../Lib/src/types/WhereAllowed";

export default class LeagueRewardCommand {
	@commandRequires(CommandLeagueRewardPacketReq, {
		notBlocked: true,
		allowedEffects: CommandUtils.ALLOWED_EFFECTS.NO_EFFECT,
		level: FightConstants.REQUIRED_LEVEL,
		whereAllowed: [WhereAllowed.CONTINENT]
	}) async execute(response: DraftBotPacket[], player: Player, _packet: CommandLeagueRewardPacketReq, context: PacketContext): Promise<void> {
		if (!todayIsSunday()) {
			response.push(makePacket(CommandLeagueRewardNotSundayPacketRes, {
				nextSunday: getNextSaturdayMidnight()
			}));
			return;
		}
		if (player.gloryPointsLastSeason === 0) {
			response.push(makePacket(CommandLeagueRewardNoPointsPacketRes, {}));
			return;
		}
		if (await player.hasClaimedLeagueReward()) {
			response.push(makePacket(CommandLeagueRewardAlreadyClaimedPacketRes, {}));
			return;
		}
		const leagueLastSeason = player.getLeagueLastSeason();
		const scoreToAward = await player.getLastSeasonScoreToAward();
		const moneyToAward = leagueLastSeason.getMoneyToAward();
		const xpToAward = leagueLastSeason.getXPToAward();

		await player.addScore({
			response,
			amount: scoreToAward,
			reason: NumberChangeReason.LEAGUE_REWARD
		});
		await player.addMoney({
			response,
			amount: moneyToAward,
			reason: NumberChangeReason.LEAGUE_REWARD
		});
		await player.addExperience({
			response,
			amount: xpToAward,
			reason: NumberChangeReason.LEAGUE_REWARD
		});
		const item = leagueLastSeason.generateRewardItem();
		await giveItemToPlayer(player, item, context, response, await InventorySlots.getOfPlayer(player.id));
		draftBotInstance.logsDatabase.logPlayerLeagueReward(player.keycloakId, leagueLastSeason.id)
			.then();
		response.push(makePacket(CommandLeagueRewardSuccessPacketRes, {
			score: scoreToAward,
			money: moneyToAward,
			xp: xpToAward,
			gloryPoints: player.gloryPointsLastSeason,
			oldLeagueId: leagueLastSeason.id,
			rank: await Players.getLastSeasonGloryRankById(player.id)
		}));
	}
}