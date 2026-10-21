import type { DiscordSDK } from "@discord/embedded-app-sdk";

/** Discord adds this parameter to the address of every Activity it launches. */
const LAUNCH_PARAMETER = "frame_id";

let sdk: DiscordSDK | null = null;

function launchedByDiscord(): boolean {
	// The static export renders the pages in Node, where there is no address to read.
	return typeof window !== "undefined" && new URLSearchParams(window.location.search).has(LAUNCH_PARAMETER);
}

/**
 * Must run before the router first navigates: the SDK reads its launch parameters from the address, and
 * the first navigation replaces it. A browser opening the web build outside Discord starts nothing.
 */
export function captureDiscordLaunch(): void {
	if (sdk || !launchedByDiscord()) {
		return;
	}
	const clientId = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
	if (!clientId) {
		console.error("Launched by Discord, but EXPO_PUBLIC_DISCORD_CLIENT_ID was not set when building.");
		return;
	}

	/*
	 * Loaded only once Discord launched the page: the SDK reads the browser as soon as it is evaluated, which
	 * breaks the static rendering. An `import()` would resolve after the first navigation, too late.
	 */
	const { DiscordSDK: Sdk } = require("@discord/embedded-app-sdk") as typeof import("@discord/embedded-app-sdk");
	sdk = new Sdk(clientId);
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
