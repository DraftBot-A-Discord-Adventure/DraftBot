export const minutesDisplay = function(minutes: number): string {
	minutes = Math.floor(minutes);
	const hours = Math.floor(minutes / 60);
	minutes %= 60;

	let display;
	if (hours > 0) {
		display = hours + " H " + minutes + " Min";
	}
	else if (minutes !== 0) {
		display = minutes + " Min";
	}
	else {
		display = "< 1 Min";
	}

	return display;
};

/**
 * get a date value of tomorrow
 */
export const getTomorrowMidnight = function() {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow;
};

export const getDayNumber = (): number  => Math.floor(new Date().valueOf() / 8.64e7);

export const millisecondsToMinutes = (milliseconds: number): number  => Math.round(milliseconds / 60000);

export const minutesToMilliseconds = (minutes: number): number  => minutes * 60000;

export const hoursToMilliseconds = (hours: number): number  => hours * 3600000;

export const hoursToMinutes = (hours: number): number  => hours * 60;

export const millisecondsToHours = (milliseconds: number): number  => milliseconds / 3600000;

export const datesAreOnSameDay = (first: Date, second: Date): boolean  =>
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth() &&
	first.getDate() === second.getDate();

export const finishInTimeDisplay = (finishDate: Date): string  => "<t:" + Math.floor(finishDate.valueOf() / 1000) + ":R>";

export const getNextSundayMidnight = (): number => {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setDate(now.getDate() + (7 - now.getDay()) % 7);
	dateOfReset.setHours(23, 59, 59);
	let dateOfResetTimestamp = dateOfReset.valueOf();
	while (dateOfResetTimestamp < now.valueOf()) {
		dateOfResetTimestamp += 1000 * 60 * 60 * 24 * 7;
	}
	return dateOfResetTimestamp;
};

export const resetIsNow = (): boolean  => getNextSundayMidnight() - Date.now() <= 1000 * 5 * 60;

export const parseTimeDifference = function(date1: number, date2: number, language: string): string  {
	if (date1 > date2) {
		date1 = [date2, date2 = date1][0];
	}
	let seconds = Math.floor((date2.valueOf() - date1.valueOf()) / 1000);
	let parsed = "";
	const days = Math.floor(seconds / (24 * 60 * 60));
	if (days > 0) {
		parsed += days + (language === "fr" ? " J " : " D ");
		seconds -= days * 24 * 60 * 60;
	}

	const hours = Math.floor(seconds / (60 * 60));
	if (hours !== 0) {
		parsed += hours + " H ";
	}
	seconds -= hours * 60 * 60;
	const minutes = Math.floor(seconds / 60);
	parsed += minutes + " Min ";
	seconds -= minutes * 60;
	parsed += seconds + " s";
	return parsed;
};

export const getNextDay2AM = function() {
	const now = new Date();
	const dateOfReset = new Date();
	dateOfReset.setHours(1, 59, 59);
	if (dateOfReset < now) {
		dateOfReset.setDate(dateOfReset.getDate() + 1);
	}
	return new Date(dateOfReset);
};