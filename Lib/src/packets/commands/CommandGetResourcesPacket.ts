import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { Badge } from "../../types/Badge";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandGetResourcesReq extends DraftBotPacket {
	badges?: boolean;
}

@sendablePacket(PacketDirection.NONE)
export class CommandGetResourcesRes extends DraftBotPacket {
	badges?: Badge[];
}
