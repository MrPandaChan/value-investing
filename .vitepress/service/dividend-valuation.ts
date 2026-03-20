import { type DynamicData } from "../../fetch-data/types";
import { type DividendValuationConfig, type ValuationData } from "../../types";

export class DividendValuation {
  anchor: number;

  constructor(
    valuationData: ValuationData,
    valuationConfig: DividendValuationConfig,
    dynamicData: DynamicData,
  ) {
    const { historyData } = valuationData;
    const lastData = historyData[historyData.length - 1];
    this.anchor =
      lastData.totalDividend /
      valuationConfig.dividendYield /
      dynamicData.totalSharesOutstanding;
  }
}
