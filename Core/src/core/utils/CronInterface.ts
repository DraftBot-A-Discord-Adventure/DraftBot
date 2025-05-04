import { CronJob } from "cron";

export enum DayOfTheWeek {
	SUNDAY = "0",
	MONDAY = "1",
	TUESDAY = "2",
	WEDNESDAY = "3",
	THURSDAY = "4",
	FRIDAY = "5",
	SATURDAY = "6"
}

type Executable = () => Promise<void> | void;

export async function setDailyCronJob(
	toExecute: Executable,
	shouldRunImmediately: boolean
): Promise<void> {
	await setCronJob("0 0 * * *", toExecute, shouldRunImmediately);
}

export async function setWeeklyCronJob(
	toExecute: Executable,
	shouldRunImmediately: boolean,
	dayOfTheWeek: DayOfTheWeek
): Promise<void> {
	await setCronJob(`0 0 * * ${dayOfTheWeek}`, toExecute, shouldRunImmediately);
}

async function setCronJob(
	cronTime: string,
	toExecute: Executable,
	shouldRunImmediately: boolean
): Promise<void> {
	if (shouldRunImmediately) {
		await toExecute();
	}
	CronJob.from({
		cronTime,
		onTick: toExecute,
		start: true
	});
}
