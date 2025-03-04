import {commandRequires} from "../../core/utils/CommandUtils";
import {DraftBotPacket} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {CommandLeagueRewardPacketReq} from "../../../../Lib/src/packets/commands/CommandLeagueRewardPacket";

export default class LeagueRewardCommand {
	@commandRequires(CommandLeagueRewardPacketReq, {
		notBlocked: false // Todo: verify if this is the correct value
	})
	execute(_response: DraftBotPacket[], _player: Player): void {

	}
}