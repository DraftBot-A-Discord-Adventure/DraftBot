import { Image } from "expo-image";
import twemoji from "@twemoji/api";
import { ReactElement } from "react";
import { StyleSheet } from "react-native";
import {
	activityUrl, ACTIVITY_ROUTES
} from "@/src/activity/ActivityRoutes";
import { isDiscordActivity } from "@/src/activity/DiscordLaunch";

const TWEMOJI_CDN = "https://cdn.jsdelivr.net";
const TWEMOJI_ASSET_PATH = "/gh/jdecked/twemoji@17.0.3/assets/svg";

/** Inside Discord, the CDN is only reachable through the Activity proxy. */
function twemojiAssetBaseUrl(): string {
	return `${isDiscordActivity() ? activityUrl(ACTIVITY_ROUTES.EMOJI_CDN) : TWEMOJI_CDN}${TWEMOJI_ASSET_PATH}`;
}

const styles = StyleSheet.create({
	icon: { flexShrink: 0 }
});

export function twemojiAssetUrl(emoji: string): string {
	const filenameSource = emoji.includes("\u200D")
		? emoji
		: emoji.replace(/\uFE0F/gu, "");
	return `${twemojiAssetBaseUrl()}/${twemoji.convert.toCodePoint(filenameSource)}.svg`;
}

export function TwemojiIcon({
	emoji, size, opacity = 1, verticalOffset = 0
}: {
	emoji: string;
	size: number;
	opacity?: number;
	verticalOffset?: number;
}): ReactElement {
	const source = twemojiAssetUrl(emoji);

	return (
		<Image
			accessibilityRole="image"
			accessibilityLabel={emoji}
			contentFit="contain"
			cachePolicy="memory-disk"
			source={source}
			style={[
				styles.icon, {
					width: size, height: size, opacity, transform: [{ translateY: verticalOffset }]
				}
			]}
		/>
	);
}
