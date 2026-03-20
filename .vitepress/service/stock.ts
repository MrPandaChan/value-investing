import {
  type ServiceData,
  ValuationStyle,
  ValuationType,
  type StockItem,
  StockType,
} from "../../types";
import { getStockItem } from "../../types/stocks";
import { computed, ref, type Ref } from "vue";
import { RowType } from "../components/rotation-model/types";
import { data } from "./data";
import { ProfitValuation } from "./profit-valuation";
import { type DynamicData } from "../../fetch-data/types";
import { DividendValuation } from "./dividend-valuation";
import { getDynamicData } from "../../fetch-data/fetch-stock-data";

// 以 10 年回本进行计算
const BACK_YEARS_NUM = 10;

export class Stock {
  rowType = RowType.STOCK;

  private stockType!: StockType;

  private stockItem: StockItem;

  private data: ServiceData[string];

  anchor = ref(0);

  // 动态数据
  private dynamicData: Ref<DynamicData>;

  loseYield = computed(() => {
    return ((this.anchor.value - this.price.value) / this.price.value) * 100;
  });

  price = computed(() => this.dynamicData.value.price);

  pe = computed(() => {
    return this.dynamicData.value.PE_TTM;
  });

  pb = computed(() => this.dynamicData.value.PB);

  // 股息率
  dividendYield = computed(() => {
    if (this.data) {
      const { historyData } = this.data.valuationData;
      const lastData = historyData[historyData.length - 1];
      const { totalDividend } = lastData;
      return (
        totalDividend /
        this.dynamicData.value.totalSharesOutstanding /
        this.price.value
      );
    }
    return 0;
  });

  get waitYears() {
    return 0;
  }

  // 股票名称
  get name() {
    const map: Record<StockType, string> = {
      [StockType.A]: "A",
      [StockType.B]: "B",
      [StockType.HK]: "H",
    };
    return `${map[this.stockItem.type]}${this.stockItem.name}`;
  }

  // 股票代码
  get code() {
    return this.stockItem.code;
  }

  // 当前期望收益
  longTermAverageReturnYield = computed(() => {
    return this.anchor.value / this.price.value / BACK_YEARS_NUM;
  });

  // 分红率
  get dividendPayoutRatio() {
    if (this.data) {
      const { historyData } = this.data.valuationData;
      const lastData = historyData[historyData.length - 1];
      const { totalDividend, profit } = lastData;
      if (profit > 0) {
        return totalDividend / profit;
      }
    }
    return 0;
  }

  // 目标仓位
  get allocation() {
    return this.stockItem.allocation;
  }

  // 收集比例
  collectionRatio?: number;

  // 累计收集
  cumulativeRatio?: number;

  // 目标仓位股数
  allocationShares?: number;

  // 收集比例股数
  collectionRatioShares?: number;

  // 累计收集股数
  cumulativeRatioShares?: number;

  // 目标仓位市值
  allocationValue?: number;

  // 收集比例市值
  collectionRatioValue?: number;

  // 累计收集市值
  cumulativeRatioValue?: number;

  // 一手股数
  get sharesPerLot() {
    return this.stockItem.sharesPerLot || 100;
  }

  constructor(
    stockItem: StockItem,
    dynamicData: DynamicData,
    valuationStyle: ValuationStyle = ValuationStyle.NEUTRAL,
  ) {
    this.stockItem = stockItem;
    this.stockType = stockItem.type;
    this.data = data[stockItem.code];
    this.dynamicData = ref(dynamicData);
    this.calculateAnchor(valuationStyle);
  }

  async calculateAnchor(
    valuationStyle: ValuationStyle = ValuationStyle.NEUTRAL,
  ) {
    const [{ price }] = await getDynamicData(["133.CNHHKD"]);
    const exchangeRate = price / 100;

    const stockItem = getStockItem(this.stockItem.code);

    const { valuationConfig } = this.stockItem;

    // TODO: 利润估值目前只支持A股
    // TODO: HKMarketValuation
    if (
      stockItem.type === StockType.A &&
      valuationConfig.type === ValuationType.PROFIT
    ) {
      const valuationData = data[this.stockItem.code].valuationData;
      const dynamicData = data[this.stockItem.code].dynamicData;

      const profitValuation = new ProfitValuation(
        valuationData,
        stockItem,
        dynamicData,
        valuationConfig[valuationStyle],
      );

      this.anchor.value = profitValuation.anchor.value;
    } else if (valuationConfig.type === ValuationType.DIVIDEND) {
      const valuationData = data[this.stockItem.code].valuationData;
      const dynamicData = data[this.stockItem.code].dynamicData;

      const dividendValuation = new DividendValuation(
        valuationData,
        valuationConfig,
        dynamicData,
      );
      this.anchor.value = dividendValuation.anchor;
    } else if (valuationConfig.type === ValuationType.DIRECT) {
      // 汇率转换
      this.anchor.value =
        this.stockType === StockType.A
          ? valuationConfig.price
          : valuationConfig.price * exchangeRate;
    } else if (valuationConfig.type === ValuationType.REFERENCE) {
      console.log(exchangeRate);
      // 汇率转换
      this.anchor.value =
        this.stockType === StockType.A
          ? valuationConfig.price
          : valuationConfig.price * exchangeRate;
    } else {
      console.log("找不到估值方法");
    }
  }

  setCollectionRatio(val?: number) {
    this.collectionRatio = val;
  }

  setCumulativeRatio(val?: number) {
    this.cumulativeRatio = val;
  }

  // 计算目标仓位的股数
  calculateAllocationShares(totalAmount: number) {
    const amount = this.allocation * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 计算收集比例的股数
  calculateCollectionRatioShares(totalAmount: number) {
    if (this.collectionRatio === undefined || this.collectionRatio === 0) {
      return undefined;
    }
    const amount = this.collectionRatio * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 计算累计收集的股数
  calculateCumulativeRatioShares(totalAmount: number) {
    if (this.cumulativeRatio === undefined || this.cumulativeRatio === 0) {
      return undefined;
    }
    const amount = this.cumulativeRatio * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 设置所有股数
  setAllShares(totalAmount: number) {
    this.allocationShares = this.calculateAllocationShares(totalAmount);
    this.collectionRatioShares =
      this.calculateCollectionRatioShares(totalAmount);
    this.cumulativeRatioShares =
      this.calculateCumulativeRatioShares(totalAmount);
    this.allocationValue = this.allocationShares * this.price.value;
    this.collectionRatioValue = this.collectionRatioShares
      ? this.collectionRatioShares * this.price.value
      : undefined;
    this.cumulativeRatioValue = this.cumulativeRatioShares
      ? this.cumulativeRatioShares * this.price.value
      : undefined;
  }

  // 更新动态数据
  updateDynamicData(dynamicData: DynamicData) {
    this.dynamicData.value = dynamicData;
  }
}
