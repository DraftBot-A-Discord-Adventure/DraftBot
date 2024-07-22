import {SmallEventAddSomething} from "./SmallEventPacket";

export class SmallEventWinGuildXPPacket extends SmallEventAddSomething {
	guildName!: string;
}