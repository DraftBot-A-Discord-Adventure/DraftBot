import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandReportPacketReq extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportTravelSummaryRes extends DraftBotPacket {
	startMap!: {
		id: number;
		type: string;
	};

	endMap!: {
		id: number;
		type: string;
	};

	startTime!: number;

	arriveTime!: number;

	nextStopTime!: number;

	isOnBoat!: boolean;

	effect?: string;

	effectDuration?: number;

	effectEndTime?: number;

	points!: {
		show: boolean;
		cumulated: number;
	};

	energy!: {
		show: boolean;
		current: number;
		max: number;
	};

	lastSmallEventId?: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportMonsterRewardRes extends DraftBotPacket {
	money!: number;

	experience!: number;

	guildXp!: number;

	guildPoints!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportErrorNoMonsterRes extends DraftBotPacket {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportRefusePveFightRes extends DraftBotPacket {

}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportChooseDestinationRes extends DraftBotPacket {
	mapId!: number;

	mapTypeId!: string;

	tripDuration!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportBigEventResultRes extends DraftBotPacket {
	eventId!: number;

	possibilityId!: string;

	outcomeId!: string;

	score!: number;

	experience!: number;

	effect?: {
		name: string;
		time: number;
	};

	health!: number;

	money!: number;

	energy!: number;

	gems!: number;

	oneshot!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportStayInCity extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandReportChooseDestinationCityRes extends DraftBotPacket {
	mapId!: number;

	mapTypeId!: string;
}
