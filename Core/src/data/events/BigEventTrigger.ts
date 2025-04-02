import Player from "../../core/database/game/models/Player";
import { LogsReadRequests } from "../../core/database/logs/LogsReadRequests";
import { BigEvent } from "../BigEvent";

function verifyTriggerDate(trigger: BigEventTrigger): boolean {
	// Don't do the following operations if no date is specified -> save CPU time
	if (!trigger.date) {
		return true;
	}

	const date = new Date();

	// Year
	const fromYear = trigger.date.year?.from ?? -1;
	const toYear = trigger.date.year?.to ?? 99999;
	const year = date.getFullYear();

	// Month
	const fromMonth = trigger.date.month?.from ?? -1;
	const toMonth = trigger.date.month?.to ?? 99999;
	const month = date.getMonth() + 1; // Starts at 0

	// Day
	const fromDay = trigger.date.day?.from ?? -1;
	const toDay = trigger.date.day?.to ?? 99999;
	const day = date.getDate();

	// Day of the week
	const fromDayOfTheWeek = trigger.date.dayOfTheWeek?.from ?? -1;
	const toDayOfTheWeek = trigger.date.dayOfTheWeek?.to ?? 99999;
	const dayOfTheWeek = date.getDay(); // 0 = sunday

	// Hour
	const fromHour = trigger.date.hour?.from ?? -1;
	const toHour = trigger.date.hour?.to ?? 99999;
	const hour = date.getHours();

	// Minute
	const fromMinute = trigger.date.minute?.from ?? -1;
	const toMinute = trigger.date.minute?.to ?? 99999;
	const minute = date.getMinutes();

	// Second
	const fromSecond = trigger.date.second?.from ?? -1;
	const toSecond = trigger.date.second?.to ?? 99999;
	const second = date.getSeconds();

	return year >= fromYear && year <= toYear
		&& month >= fromMonth && month <= toMonth
		&& day >= fromDay && day <= toDay
		&& dayOfTheWeek >= fromDayOfTheWeek && dayOfTheWeek <= toDayOfTheWeek
		&& hour >= fromHour && hour <= toHour
		&& minute >= fromMinute && minute <= toMinute
		&& second >= fromSecond && second <= toSecond;
}

async function verifyOncePer(bigEvent: BigEvent, trigger: BigEventTrigger, player: Player): Promise<boolean> {
	if (!trigger.oncePer) {
		return true;
	}

	const lastDate = await LogsReadRequests.getLastEventDate(player.keycloakId, bigEvent.id);

	if (!lastDate) {
		return true;
	}

	const now = new Date();

	switch (trigger.oncePer) {
		case "year":
			return lastDate.getFullYear() !== now.getFullYear();
		case "month":
			return lastDate.getFullYear() !== now.getFullYear() || lastDate.getMonth() !== now.getMonth();
		case "week":
			return lastDate.getFullYear() !== now.getFullYear() || lastDate.getMonth() !== now.getMonth() || lastDate.getDay() !== now.getDay();
		case "day":
			return lastDate.getFullYear() !== now.getFullYear() || lastDate.getMonth() !== now.getMonth() || lastDate.getDate() !== now.getDate();
		default:
			return true;
	}
}

/**
 * Verify whether a big event trigger is verified
 * @param bigEvent The big event
 * @param mapId The map id
 * @param player The player
 * @param trigger The big event trigger object
 */
export async function verifyTrigger(bigEvent: BigEvent, trigger: BigEventTrigger, mapId: number, player: Player): Promise<boolean> {
	return (trigger.mapId ? mapId === trigger.mapId : true)
		&& (trigger.level ? player.level > trigger.level : true)
		&& verifyTriggerDate(trigger)
		&& (trigger.mapAttributes ? trigger.mapAttributes.includes(player.getDestination().attribute) : true)
		&& await verifyOncePer(bigEvent, trigger, player);
}

/**
 * A big event trigger is a set of condition to trigger a big event (for instance, a map id, a minimum level etc...)
 */
export interface BigEventTrigger {
	mapId?: number;
	level?: number;
	date?: {
		year?: {
			from?: number;
			to?: number;
		};
		month?: {
			from?: number;
			to?: number;
		};
		day?: {
			from?: number;
			to?: number;
		};
		dayOfTheWeek?: {
			from?: number;
			to?: number;
		};
		hour?: {
			from?: number;
			to?: number;
		};
		minute?: {
			from?: number;
			to?: number;
		};
		second?: {
			from?: number;
			to?: number;
		};
	};
	oncePer?: "year" | "month" | "week" | "day";
	mapAttributes?: string[];
}
