import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";
import {
	CrowniclesPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/CrowniclesPacket";
import Player, { Players } from "../../core/database/game/models/Player";
import {
	CommandLeagueRewardAlreadyClaimedPacketRes,
	CommandLeagueRewardNoPointsPacketRes,
	CommandLeagueRewardNotSundayPacketRes,
	CommandLeagueRewardPacketReq,
	CommandLeagueRewardSuccessPacketRes
} from "../../../../Lib/src/packets/commands/CommandLeagueRewardPacket";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { giveItemToPlayer } from "../../core/utils/ItemUtils";
import { crowniclesInstance } from "../../index";
import {
	getNextSaturdayMidnight, todayIsSunday
} from "../../../../Lib/src/utils/TimeUtils";
import { FightConstants } from "../../../../Lib/src/constants/FightConstants";
import { WhereAllowed } from "../../../../Lib/src/types/WhereAllowed";

export default class LeagueRewardCommand {
	@commandRequires(CommandLeagueRewardPacketReq, {
		notBlocked: true,
		allowedEffects: CommandUtils.ALLOWED_EFFECTS.NO_EFFECT,
		level: FightConstants.REQUIRED_LEVEL,
		whereAllowed: [WhereAllowed.CONTINENT]
	})
	static async execute(response: CrowniclesPacket[], player: Player, _packet: CommandLeagueRewardPacketReq, context: PacketContext, ignoreDate = false): Promise<void> {
		if (!ignoreDate && !todayIsSunday()) {
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
		await giveItemToPlayer(response, context, player, item);
		crowniclesInstance.logsDatabase.logPlayerLeagueReward(player.keycloakId, leagueLastSeason.id)
			.then();
		await player.save();
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
