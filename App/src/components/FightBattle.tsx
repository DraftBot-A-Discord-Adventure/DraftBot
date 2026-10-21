import {
	ReactNode, useState
} from "react";
import {
	ActivityIndicator, ScrollView, Text, View, useWindowDimensions
} from "react-native";
import { CircleAlert } from "@/src/design/FightIcons";
import { ReactionCollectorCreation } from "ws-packets/src/fromServer/common/ReactionCollectorCreation";
import { FightEnd } from "ws-packets/src/objects/Fight";
import {
	Button, ButtonRow, Note
} from "@/src/design/Primitives";
import { QuestionSheet } from "@/src/design/Sections";
import { SheetScrollView } from "@/src/design/BottomSheet";
import { Theme } from "@/src/design/Theme";
import {
	FightActions, FightActionsWaiting
} from "@/src/collectors/FightActionCollector";
import {
	FightSnapshot, FightLogRecord
} from "@/src/store/FightStore";
import { FightLog } from "@/src/components/FightDetails";
import { FightResult } from "@/src/components/FightResult";
import { FightStage } from "@/src/components/FightStage";
import {
	FIGHT_PHASES, BattleHeightProvider, FightHeader, FightNavigation, FightPhase, useCompactFight, useSideBySideFight
} from "@/src/components/FightControls";
import { FightFeed } from "@/src/components/FightFeed";
import {
	FightPlayback, useFightPlayback
} from "@/src/store/useFightPlayback";
import { i18n } from "@/src/translations/i18n";
import { useFightSpeed } from "@/src/store/useFightSpeed";
import { FightSpeed } from "@/src/display/FightMotion";
import {
	createStyles, useColors
} from "@/src/design/ThemeContext";

const useStyles = createStyles(colors => ({
	content: {
		flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: Theme.spacing.xl, paddingBottom: 12, overflow: "hidden"
	},
	body: {
		flex: 1, minHeight: 0, overflow: "hidden"
	},

	// A PC frame has no status bar above it: the heading needs its own room.
	sideBySideContent: {
		maxWidth: Theme.layout.sideBySideFight.maxWidth, paddingTop: Theme.spacing.lg
	},
	sideBySideBody: {
		flexDirection: "row", gap: Theme.spacing.xxl
	},
	sideBySideColumn: {
		flex: 1, minHeight: 0
	},

	stage: { flexShrink: 0 },
	actions: {
		flexShrink: 0, overflow: "hidden"
	},
	activitySubtitle: {
		fontFamily: Theme.fonts.regular, fontSize: 10, lineHeight: 15, color: colors.muted
	},
	journal: { maxHeight: 480 },
	resultScroll: {
		flex: 1, minHeight: 0
	},
	resultActions: {
		flexShrink: 0, paddingTop: 12
	},
	loading: {
		flex: 1, alignItems: "center", justifyContent: "center", gap: 14
	},
	compactContent: {
		paddingHorizontal: 12, paddingBottom: 8
	}
}));

type FightLiveProps = {
	fight: FightSnapshot; collector?: ReactionCollectorCreation; onChoose: (index: number) => void; submitting: boolean; onClose: () => void;
};
type FightContentProps = FightLiveProps & {
	playback: FightPlayback; navigation: FightNavigation; speed: FightSpeed;
};

function fightPhase(props: FightLiveProps, playback: FightPlayback): FightPhase {
	if (props.fight.error) {
		return FIGHT_PHASES.ERROR;
	}
	if (playback.record || props.submitting) {
		return FIGHT_PHASES.PLAYING;
	}
	if (props.fight.result) {
		return FIGHT_PHASES.FINISHED;
	}
	return props.collector ? FIGHT_PHASES.SELF : FIGHT_PHASES.OPPONENT;
}

function FightTurn({
	fight, playback, collector, onChoose, submitting, speed
}: FightContentProps): ReactNode {
	const styles = useStyles();
	const colors = useColors();
	const sideBySide = useSideBySideFight();
	const status = playback.status;
	if (!status) {
		return <View style={styles.loading}><ActivityIndicator color={colors.muted} /><Text style={styles.activitySubtitle}>{i18n.t("app:battle.preparing")}</Text></View>;
	}
	const pending = submitting || Boolean(playback.record);
	const stage = <View style={styles.stage}>
		<FightStage
			status={status}
			introduction={fight.introduction}
			record={playback.record}
			onImpact={playback.impact}
			onComplete={playback.finishMotion}
			reducedMotion={playback.reducedMotion}
			speed={speed}
		/>
	</View>;
	const feed = <FightFeed entries={playback.logs} ownTurn={Boolean(collector) && !pending} opponentThinking={!collector && !pending && !fight.result} />;
	const actions = <View style={styles.actions}>
		{collector
			? <FightActions key={collector.id} collector={collector} onChoose={onChoose} submitting={pending} />
			: <FightActionsWaiting actions={fight.introduction?.initiatorActions ?? []} />}
	</View>;
	if (sideBySide) {
		return <View style={[styles.body, styles.sideBySideBody]}>
			<View style={styles.sideBySideColumn}>{stage}{feed}</View>
			<View style={styles.sideBySideColumn}>{actions}</View>
		</View>;
	}
	return <View style={styles.body}>{stage}{feed}{actions}</View>;
}

function FightFailure({
	fight, navigation
}: FightContentProps): ReactNode {
	const styles = useStyles();
	const colors = useColors();
	const closeLabel = i18n.t(fight.introduction?.opponent.monsterId ? "app:adventure.continueReport" : "app:battle.returnToArena");
	return <View style={styles.loading}><CircleAlert size={38} color={colors.muted} /><Note>{i18n.t(`app:arena.errors.${fight.error}`)}</Note><Button onPress={navigation.onClose}>{closeLabel}</Button></View>;
}

function FinishedFight({
	fight, navigation, result
}: FightContentProps & { result: FightEnd }): ReactNode {
	const styles = useStyles();
	const closeLabel = i18n.t(fight.introduction?.opponent.monsterId ? "app:adventure.continueReport" : "app:battle.returnToArena");

	// A boss leaves long rewards behind: they scroll, and the way out stays in reach under them.
	return <View style={styles.body}>
		<ScrollView style={styles.resultScroll} testID="fight-result-scroll"><FightResult result={result} reward={fight.reward} monsterReward={fight.monsterReward} /></ScrollView>
		<View style={styles.resultActions}><ButtonRow><Button variant="primary" onPress={navigation.onClose}>{closeLabel}</Button><Button onPress={navigation.onJournal}>{i18n.t("app:arena.log")}</Button></ButtonRow></View>
	</View>;
}

function FightContent(props: FightContentProps): ReactNode {
	const {
		fight, playback
	} = props;
	if (fight.error) {
		return <FightFailure {...props} />;
	}
	if (!fight.result || playback.record) {
		return <FightTurn {...props} />;
	}
	return <FinishedFight {...props} result={fight.result} />;
}

function FightJournal({
	entries, onClose
}: {
	entries: FightLogRecord[]; onClose: () => void;
}): ReactNode {
	const styles = useStyles();
	const { height } = useWindowDimensions();
	return <QuestionSheet
		caption={i18n.t("app:arena.eyebrow")}
		title={i18n.t("app:arena.log")}
		onClose={onClose}
	><SheetScrollView startAtEnd style={[styles.journal, { maxHeight: height * 0.6 }]} testID="fight-journal-scroll"><FightLog entries={entries} /></SheetScrollView></QuestionSheet>;
}

/** Measures the room the battle really has, so the layout adapts to the device instead of guessing. */
function BattleFrame({
	height, onHeight, wide, children
}: {
	height: number | null; onHeight: (height: number) => void; wide: boolean; children: ReactNode;
}): ReactNode {
	const styles = useStyles();
	const compact = useCompactFight();
	return <View testID="fight-frame" style={[
		styles.content,
		wide && styles.sideBySideContent,
		compact && styles.compactContent
	]} onLayout={(event): void => {
		const measured = event.nativeEvent.layout.height;
		if (measured > 0 && measured !== height) {
			onHeight(measured);
		}
	}}>{children}</View>;
}

export function FightLiveView(props: FightLiveProps): ReactNode {
	const speedSetting = useFightSpeed();
	const [journal, setJournal] = useState(false);
	const [height, setHeight] = useState<number | null>(null);

	// Reading the journal must not let the live feed run ahead and skip an action.
	const playback = useFightPlayback(props.fight, {
		speed: speedSetting.speed, paused: journal
	});
	const navigation = {
		onClose: props.onClose, onJournal: (): void => setJournal(true)
	};
	const phase = fightPhase(props, playback);

	// Only the turn lays out side by side: the result and a failure read as a column again.
	const wide = useSideBySideFight() && phase !== FIGHT_PHASES.FINISHED && phase !== FIGHT_PHASES.ERROR;
	return <BattleHeightProvider height={height}>
		<BattleFrame height={height} onHeight={setHeight} wide={wide}>
			<FightHeader fight={props.fight} playback={playback} phase={phase} />
			<FightContent {...props} playback={playback} navigation={navigation} speed={speedSetting.speed} />
			{journal ? <FightJournal entries={playback.logs} onClose={(): void => setJournal(false)} /> : null}
		</BattleFrame>
	</BattleHeightProvider>;
}
