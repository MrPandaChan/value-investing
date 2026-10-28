import { computed } from "vue";
import { stocks, type TagKey } from "../../my-data/stock-pool";
import { usePortfolioBase } from "./use-portfolio-base";

export interface TagExposureItem {
  tag: TagKey;
  /** 暴露市值（人民币）：持有市值 × 标签权重 */
  value: number;
  /** 占股票持仓市值的比例 */
  ratio: number;
  /** 是否超过阈值 */
  over: boolean;
}

/**
 * 共同依赖标签暴露
 *
 * 按「持有市值 × 标签权重」累加，分母为股票持仓市值（含 ETF）；
 * 用于识别跨行业的隐藏耦合，与行业集中度互补。
 */
export function useTagExposure(threshold = 0.5) {
  const { holdings, stockHoldingValue } = usePortfolioBase();

  const tagExposure = computed<TagExposureItem[]>(() => {
    const total = stockHoldingValue.value;
    const map = new Map<TagKey, number>();

    for (const holding of holdings.value) {
      const stock = stocks.find((item) => item.code === holding.code);
      for (const tag of stock?.tags ?? []) {
        const weight = tag.weight ?? 1;
        map.set(
          tag.tag,
          (map.get(tag.tag) ?? 0) + holding.holdingValue * weight,
        );
      }
    }

    return [...map.entries()]
      .map(([tag, value]) => ({
        tag,
        value,
        ratio: total > 0 ? value / total : 0,
        over: total > 0 && value / total > threshold,
      }))
      .sort((a, b) => b.ratio - a.ratio);
  });

  return { tagExposure, threshold };
}
