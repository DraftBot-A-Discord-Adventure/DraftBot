import { Theme } from "@/src/design/Theme";
import { createStyles } from "@/src/design/ThemeContext";

export const useNavigationStyles = createStyles(colors => ({
	header: {
		paddingBottom: Theme.spacing.md,
		backgroundColor: colors.paper,
		borderBottomWidth: 1,
		borderBottomColor: colors.line
	},

	/** The band spans the screen; what it holds lines up with the content below. */
	headerRow: {
		...Theme.layout.column,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Theme.spacing.lg
	},

	/** Balances the settings button so the identity stays centred. */
	headerSpacer: {
		width: Theme.dimensions.headerIcon
	},
	profileHeader: {
		flexDirection: "row",
		alignItems: "center"
	},
	profileClassIcon: {
		marginRight: Theme.spacing.sm
	},
	profileIdentity: {
		alignItems: "center"
	},
	profileName: {
		fontFamily: Theme.fonts.semiBold,
		fontSize: Theme.fontSize.title,
		color: colors.ink,
		textAlign: "center"
	},
	profileLevel: {
		fontFamily: Theme.fonts.regular,
		fontSize: Theme.fontSize.caption,
		color: colors.muted,
		textAlign: "center"
	},
	settingsButton: {
		marginRight: Theme.spacing.lg
	}
}));
