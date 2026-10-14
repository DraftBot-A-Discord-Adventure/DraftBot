import { keycloakConfig } from "../index";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";

const REVIEW_INTERVAL_MS = 60_000;
const PENDING_LIFETIME_MS = 3_600_000;
const PAGE_SIZE = 100;

export abstract class PendingRegistrations {
	private static running = false;

	public static start(): void {
		setInterval(() => PendingRegistrations.review().catch(error => CrowniclesLogger.errorWithObj("Pending registrations cleanup failed", error)), REVIEW_INTERVAL_MS);
	}

	public static async review(now = Date.now()): Promise<void> {
		if (PendingRegistrations.running) {
			return;
		}
		PendingRegistrations.running = true;
		try {
			const expired: string[] = [];
			for (let first = 0; ; first += PAGE_SIZE) {
				const result = await KeycloakUtils.getPendingRegistrations(keycloakConfig, first, PAGE_SIZE);
				if (result.isError) {
					throw new Error("Pending registrations unavailable");
				}
				for (const user of result.payload.users) {
					if (!user.emailVerified && user.attributes?.registrationPending?.[0] === "true" && now - user.createdTimestamp > PENDING_LIFETIME_MS) {
						expired.push(user.id);
					}
				}
				if (result.payload.users.length < PAGE_SIZE) {
					break;
				}
			}
			for (const id of expired) {
				const current = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, id);
				if (!current.isError && !current.payload.user.emailVerified && current.payload.user.attributes?.registrationPending?.[0] === "true") {
					await KeycloakUtils.deleteUser(keycloakConfig, id);
				}
			}
		}
		finally {
			PendingRegistrations.running = false;
		}
	}
}
