import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../../DraftBotPacket";
import { GuildRole } from "../../../types/GuildRole";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class RequirementGuildRolePacket extends DraftBotPacket {
	roleNeeded!: GuildRole;
}
