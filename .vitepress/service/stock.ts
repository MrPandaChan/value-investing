import { getStockItem, type ServiceData, type StockItem } from "../../types";
import { computed, ref, type Ref } from "vue";
import { RowType } from "../components/rotation-model/types";
import { data } from "./data";
import { numToAHundredMillion } from "../../fetch-data/helper";
import { ProfitValuation } from "./profit-valuation";

// 以 10 年回本进行计算
const BACK_YEARS_NUM = 10;

export class Stock {
  rowType = RowType.STOCK;

  private stockItem: StockItem;

  private data: ServiceData[string];

  anchor = ref(0);

  price: Ref<number>;

  loseYield = computed(() => {
    return ((this.anchor.value - this.price.value) / this.price.value) * 100;
  });

  get waitYears() {
    return 0;
  }

  get name() {
    return this.stockItem.name;
  }

  // 当前期望收益
  longTermAverageReturnYield = computed(() => {
    return this.anchor.value / this.price.value / BACK_YEARS_NUM;
  });

  // 股息率
  get dividendYield() {
    const { historyData } = this.data.valuationData;
    const lastData = historyData[historyData.length - 1];
    const { totalDividend } = lastData;
    return (
      totalDividend /
      this.data.dynamicData.totalSharesOutstanding /
      this.price.value
    );
  }

  // 分红率
  get dividendPayoutRatio() {
    const { historyData } = this.data.valuationData;
    const lastData = historyData[historyData.length - 1];
    const { totalDividend, profit } = lastData;
    return totalDividend / profit;
  }

  constructor(stockItem: StockItem) {
    this.stockItem = stockItem;
    this.data = data[stockItem.code];
    this.price = ref(this.data.dynamicData.price);

    this.calculateAnchor();
  }

  private calculateAnchor() {
    const valuationData = data[this.stockItem.code].valuationData;
    const dynamicData = data[this.stockItem.code].dynamicData;
    const stockItem = getStockItem(this.stockItem.code);

    const profitValuation = new ProfitValuation(
      valuationData,
      stockItem,
      dynamicData,
      this.stockItem.profitValuationConfig?.neutral,
    );

    this.anchor.value = profitValuation.anchor.value;
  }
}
