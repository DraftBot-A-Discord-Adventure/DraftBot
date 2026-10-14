import { ReactNode } from "react";
import { View } from "react-native";
import {
	CityMobileSnapshot, CityMobileUpgradeItem, ReactionCollectorReaction
} from "ws-packets/src/fromServer/collectors";
import { AppIcons } from "@/src/AppIcons";
import {
	buysMaterials, missingMaterialUnits, upgradeForReaction, upgradeTotalCost
} from "@/src/collectors/CityUpgrades";
import {
	AMOUNT_UNITS, formatMoney, formatNumber
} from "@/src/display/Amounts";
import { Note } from "@/src/design/Primitives";
import { Hammer } from "@/src/design/FightIcons";
import type { RowConfirm } from "@/src/collectors/CityRows";
import {
	Figures, Gauge
} from "@/src/design/Sections";
import { Theme } from "@/src/design/Theme";
import {
	createStyles, useColors
} from "@/src/design/ThemeContext";
import { i18n } from "@/src/translations/i18n";

const useStyles = createStyles(colors => ({
	materials: {
		borderRadius: Theme.radius, backgroundColor: colors.wash, overflow: "hidden"
	}
}));

type UpgradeMaterial = CityMobileUpgradeItem["materials"][number];

function materialLabel(materialId: number): string {
	const icon = AppIcons.getIconOrNull(`materials.${materialId}`);
	const name = i18n.t(`models:materials.${materialId}`);
	return icon ? `${icon} ${name}` : name;
}

/** Each material as a bar filling up to what the upgrade asks: full and green when owned, gold for what the blacksmith will sell. */
function MaterialGauge({ material }: { material: UpgradeMaterial }): ReactNode {
	const colors = useColors();
	const owned = material.playerQuantity >= material.quantity;
	return <Gauge
		label={materialLabel(material.materialId)}
		value={`${formatNumber(material.playerQuantity)} / ${formatNumber(material.quantity)}`}
		ratio={material.quantity > 0 ? material.playerQuantity / material.quantity : 1}
		color={owned ? colors.green : colors.gold}
	/>;
}

/** The work order the blacksmith lays out before the player commits: levels, bill and every material. */
function UpgradeWorkOrder({
	upgrade, buying
}: {
	upgrade: CityMobileUpgradeItem; buying: boolean;
}): ReactNode {
	const styles = useStyles();
	return <>
		<Figures items={[
			{
				caption: i18n.t("app:city.anvil.levels"), value: `${formatNumber(upgrade.itemLevel)} → ${formatNumber(upgrade.nextLevel)}`
			},
			{
				caption: i18n.t("app:city.anvil.bill"), value: formatNumber(upgradeTotalCost(upgrade, buying)), unit: AMOUNT_UNITS.MONEY
			}
		]} />
		{upgrade.materials.length > 0
			? <View style={styles.materials} testID="upgrade-materials">
				{upgrade.materials.map(material => <MaterialGauge key={material.materialId} material={material} />)}
			</View>
			: null}
		{upgrade.hasAllMaterials
			? null
			: <Note>{i18n.t("app:city.anvil.materialsOffer", {
				count: missingMaterialUnits(upgrade), price: formatMoney(upgrade.missingMaterialsCost)
			})}</Note>}
	</>;
}

export function cityUpgradeDetails(reaction: ReactionCollectorReaction, snapshot: CityMobileSnapshot | undefined): ReactNode {
	const upgrade = upgradeForReaction(reaction, snapshot);
	return upgrade ? <UpgradeWorkOrder upgrade={upgrade} buying={buysMaterials(reaction)} /> : null;
}

export function cityUpgradeConfirm(reaction: ReactionCollectorReaction, snapshot: CityMobileSnapshot | undefined): RowConfirm | undefined {
	const upgrade = upgradeForReaction(reaction, snapshot);
	if (!upgrade) {
		return undefined;
	}
	return {
		icon: Hammer,
		label: buysMaterials(reaction)
			? i18n.t("app:city.anvil.buyAndUpgrade")
			: i18n.t("app:city.anvil.upgrade", { level: upgrade.nextLevel })
	};
}
