import {DraftBotPacket} from "../DraftBotPacket";

export class CommandReportPacketReq extends DraftBotPacket {
	keycloakId!: string;
}

export class CommandReportTravelSummaryRes extends DraftBotPacket {
	startMap!: number;

	endMap!: number;

	arriveTime!: number;

	nextStopTime!: number;

	effect?: string;

	effectEndTime?: number;

	points!: {
		show: boolean,
		cumulated: number
	};

	energy!: {
		show: boolean,
		current: number,
		max: number
	};

	lastSmallEventId?: string;
}

export class CommandReportMonsterRewardRes extends DraftBotPacket {
	money!: number;

	experience!: number;

	guildXp!: number;

	guildPoints!: number;
}

export class CommandReportErrorNoMonsterRes extends DraftBotPacket {

}

export class CommandReportRefusePveFightRes extends DraftBotPacket {

}

export class CommandReportChooseDestinationRes extends DraftBotPacket {
	mapId!: number;

	tripDuration!: number;
}

export class CommandReportBigEventResultRes extends DraftBotPacket {
	eventId!: number;

	possibilityId!: string;

	outcomeId!: string;

	score!: number;

	experience!: number;

	effect?: {
		name: string,
		time: number
	};

	health!: number;

	money!: number;

	energy!: number;

	gems!: number;

	oneshot!: boolean;
}