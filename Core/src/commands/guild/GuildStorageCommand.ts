import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {DraftBotPacket} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {CommandGuildStoragePacketReq} from "../../../../Lib/src/packets/commands/CommandGuildStoragePacket";

export default class GuildStorageCommand {
	@commandRequires(CommandGuildStoragePacketReq, {
		notBlocked: false, // Todo: verify if this is the correct value
		whereAllowed: CommandUtils.WHERE.EVERYWHERE
	})
	execute(_response: DraftBotPacket[], _player: Player): void {

	}
}