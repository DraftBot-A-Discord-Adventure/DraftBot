import {commandRequires} from "../../core/utils/CommandUtils";
import {DraftBotPacket} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {CommandGuildShelterPacketReq} from "../../../../Lib/src/packets/commands/CommandGuildShelterPacket";

export default class GuildShelterCommand {
	@commandRequires(CommandGuildShelterPacketReq, {
		notBlocked: false // Todo: verify if this is the correct value
	})
	execute(_response: DraftBotPacket[], _player: Player): void {

	}
}