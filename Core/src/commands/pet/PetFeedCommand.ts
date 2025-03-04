import {commandRequires} from "../../core/utils/CommandUtils";
import {DraftBotPacket} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {CommandPetFeedPacketReq} from "../../../../Lib/src/packets/commands/CommandPetFeedPacket";

export default class PetFeedCommand {
	@commandRequires(CommandPetFeedPacketReq, {
		notBlocked: false // Todo: verify if this is the correct value
	})
	execute(_response: DraftBotPacket[], _player: Player): void {

	}
}