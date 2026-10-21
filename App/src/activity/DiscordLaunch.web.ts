import { DiscordSDK } from "@discord/embedded-app-sdk";

/** Discord adds this parameter to the address of every Activity it launches. */
const LAUNCH_PARAMETER = "frame_id";

let sdk: DiscordSDK | null = null;

/**
 * Must run before the router first navigates: the SDK reads its launch parameters from the address, and
 * the first navigation replaces it. A browser opening the web build outside Discord starts nothing.
 */
export function captureDiscordLaunch(): void {
	if (sdk || !new URLSearchParams(window.location.search).has(LAUNCH_PARAMETER)) {
		return;
	}
	const clientId = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
	if (!clientId) {
		console.error("Launched by Discord, but EXPO_PUBLIC_DISCORD_CLIENT_ID was not set when building.");
		return;
	}
	sdk = new DiscordSDK(clientId);
}

export function isDiscordActivity(): boolean {
	return sdk !== null;
}

/** The SDK of the running Activity; only reachable once `isDiscordActivity()` said so. */
export function discordSdk(): DiscordSDK {
	if (!sdk) {
		throw new Error("The app was not launched as a Discord Activity.");
	}
	return sdk;
}
