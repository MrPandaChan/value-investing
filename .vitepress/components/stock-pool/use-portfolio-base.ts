import { computed } from "vue";
import {
  canConvertToCNY,
  isETFCode,
  isHKCode,
} from "../../../fetch-data/helper";
import { cash, Industry, stocks } from "../../my-data/stock-pool";
import { useStockPoolData } from "./use-stock-pool-data";

/**
 * 持仓基础信息（与具体指标无关）
 *
 * portfolio.vue（实时透视盈余）与 portfolio-history.vue（历史业绩）
 * 共用这一份口径：持有市值、权重分母、ETF 识别、港股名称后缀。
 */
export interface HoldingBase {
  code: string;
  /** 展示名称（港股带 H 后缀） */
  name: string;
  sharesHeld: number;
  /** 原币价格 */
  price: number;
  /** 持有市值（人民币） */
  holdingValue: number;
  industry: string;
  /** ETF / 基金：无归母净利润概念，不参与盈余合计 */
  isETF: boolean;
  qualityScore: number;
}

export function usePortfolioBase() {
  const {
    tableData,
    groupMetaMap,
    exchangeRate,
    isLoading,
    refresh,
    loadFromStorage,
  } = useStockPoolData();

  /** 有持仓且能取到实时价格/PE 的标的 */
  const holdings = computed<HoldingBase[]>(() => {
    const nameMap = new Map(tableData.value.map((r) => [r.code, r.name]));
    const result: HoldingBase[] = [];

    for (const item of stocks) {
      const sharesHeld = item.sharesHeld ?? 0;
      if (sharesHeld <= 0) continue;

      const meta = groupMetaMap.value[item.code];
      if (!meta) continue;

      const rawValue = sharesHeld * meta.realPrice;
      const rawName = nameMap.get(item.code) ?? item.code;

      result.push({
        code: item.code,
        name: isHKCode(item.code) ? `${rawName}H` : rawName,
        sharesHeld,
        price: meta.realPrice,
        holdingValue: canConvertToCNY(item.code)
          ? rawValue / exchangeRate.value
          : rawValue,
        industry: item.industry,
        isETF: isETFCode(item.code) || item.industry === Industry.ETF,
        qualityScore: item.qualityScore,
      });
    }

    return result;
  });

  /** 股票持仓总市值（人民币，不含现金） */
  const stockHoldingValue = computed(() =>
    holdings.value.reduce((sum, h) => sum + h.holdingValue, 0),
  );

  /** 现金（人民币） */
  const cashValue = computed(() => cash.value || 0);

  /** 总资产（人民币，含现金）——权重分母 */
  const totalHoldingValue = computed(
    () => stockHoldingValue.value + cashValue.value,
  );

  return {
    holdings,
    stockHoldingValue,
    cashValue,
    totalHoldingValue,
    tableData,
    groupMetaMap,
    exchangeRate,
    isLoading,
    refresh,
    loadFromStorage,
  };
}
