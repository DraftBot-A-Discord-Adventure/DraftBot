export const minutesDisplay = function(minutes: number): string {
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

export const getDayNumber = () => Math.floor(new Date().valueOf() / 8.64e7);

export const millisecondsToMinutes = (milliseconds: number) => Math.round(milliseconds / 60000);

export const minutesToMilliseconds = (minutes: number) => minutes * 60000;

export const hoursToMilliseconds = (hours: number) => hours * 3600000;

export const hoursToMinutes = (hours: number) => hours * 60;

export const millisecondsToHours = (milliseconds: number) => milliseconds / 3600000;

export const datesAreOnSameDay = (first: Date, second: Date) =>
	first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

export const finishInTimeDisplay = (finishDate: Date) => "<t:" + Math.floor(finishDate.valueOf() / 1000) + ":R>";

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

export const resetIsNow = () => getNextSundayMidnight() - Date.now() <= 1000 * 5 * 60;