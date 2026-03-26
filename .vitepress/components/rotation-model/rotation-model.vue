<script lang="ts" setup>
import { computed, h, ref, shallowReactive, onBeforeMount } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import { Stock } from "../../service/stock";
import { tableColumns } from "./table-columns";
import { type AreaRowType, AreaType, RowType, type TableRow } from "./types";
import StockRow from "./stock-row.vue";
import AreaRow from "./area-row.vue";
import { stockData } from "../../../types/stocks";
import { getDynamicData } from "../../../fetch-data/fetch-stock-data";
import { StockLevel, ValuationStyle, ValuationType } from "../../../types";

const stocks = shallowReactive<Stock[]>([]);

// 投入金额
const investmentAmount = ref(1000000); // 默认100万

// 估值风格
const valuationStyle = ref<ValuationStyle>(ValuationStyle.CONSERVATIVE);

// 股票等级
const stockLevel = ref<StockLevel | -1>(-1);

// 列显示控制
const visibleColumnKeys = ref(
  tableColumns.map((col) => ({
    key: col.key,
    label: col.label.replace(/<br\s*\/?>/g, ""), // 移除 <br> 标签
    show: col.show !== false,
  })),
);

// 计算当前应该显示的列
const visibleColumns = computed(() => {
  return tableColumns.filter((col) => {
    const visibleConfig = visibleColumnKeys.value.find(
      (c) => c.key === col.key,
    );
    return visibleConfig?.show !== false;
  });
});

// 多等年数、当前期望收益、分红率、公司名称、买入立刻亏损、10%预期、当前股价、近3年低价、分红需等月数

const isStockRow = (row: TableRow): row is Stock =>
  row.rowType === RowType.STOCK;

const isAreaRow = (row: TableRow): row is AreaRowType =>
  row.rowType === RowType.AREA;

function renderRow(row: TableRow) {
  if (isStockRow(row)) {
    return h(StockRow, {
      data: row,
      columns: visibleColumns.value,
    });
  } else if (isAreaRow(row)) {
    return h(AreaRow, {
      data: row,
      columns: visibleColumns.value,
    });
  } else {
    return h("tr");
  }
}

// 区域配置定义
interface AreaConfig {
  name: string;
  minYield: number;
  maxYield: number;
  trClass?: string;
  tdClass?: string;
  ratio: number; // 收集比例（0.15 表示 15%）
  stepRatio: number; // 每跌 5% 收集比例
}

const areaConfigs: AreaConfig[] = [
  {
    name: "围攻区 (12% 以上预期收益率) 黑天鹅纷飞、鬼故事遍地的时候才可能出现",
    minYield: 12,
    maxYield: Infinity,
    tdClass: "bold bg-orange",
    ratio: 0, // 每百分之 5% 收益率加仓 15%
    stepRatio: 0.15,
  },
  {
    name: "(0) 主战区 (10% - 12%的预期收益率) 60%",
    minYield: 10.5,
    maxYield: 12,
    tdClass: "bold bg-pink",
    ratio: 0.6,
    stepRatio: 0.15,
  },
  {
    name: "(0) 主战区3 (10% 的预期收益率) (0% 到 5%) 15%",
    minYield: 10,
    maxYield: 10.5,
    tdClass: "bold bg-pink",
    ratio: 0.15,
    stepRatio: 0.15,
  },
  {
    name: "(0) 主战区2 (9.5% 预期收益率) (-5% 以内) 10%",
    minYield: 9.5,
    maxYield: 10,
    tdClass: "bold bg-pink",
    ratio: 0.1,
    stepRatio: 0.1,
  },
  {
    name: "(0) 主战区1 (9%预期收益率) (-5% 到-10%) 10%",
    minYield: 9,
    maxYield: 9.5,
    tdClass: "bold bg-pink",
    ratio: 0.1,
    stepRatio: 0.1,
  },
  {
    name: "(1) 观察区2 (8.5%预期收益率) (-10% 到-15%) 5%",
    minYield: 8.5,
    maxYield: 9,
    tdClass: "bold red",
    ratio: 0.05,
    stepRatio: 0.05,
  },
  {
    name: "(2) 观察区1 (8%预期收益率) (-15% 到-20%) 5%",
    minYield: 8,
    maxYield: 8.5,
    tdClass: "bold red",
    ratio: 0.05,
    stepRatio: 0.05,
  },
  {
    name: "(3) 平庸区下沿 (6.5%-8%预期收益率) *备用弹药库2*耐心持有(-20% 到 -35%)",
    minYield: 6.5,
    maxYield: 8,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
  {
    name: "(4) 平庸区上沿 (5.5%-5.5%预期收益率) *备用弹药库1*分批轮动(-35% 到 -45%)",
    minYield: 5.5,
    maxYield: 6.5,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
  {
    name: "(5) 险地区下沿1 (低于5.5%的预期) 优先轮动或换现金等机会(-45% 到 -50%)",
    minYield: 5,
    maxYield: 5.5,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
  {
    name: "(6) 险地区下沿2 (低于5%的预期) 优先轮动或换现金等机会(-50 到 -55%)",
    minYield: 4.5,
    maxYield: 5,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
  {
    name: "(7) 险地区下沿3 (低于4.5%的预期) 优先轮动或换现金等机会(-55% 到 -60%)",
    minYield: 4,
    maxYield: 4.5,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
  {
    name: "(8) 险地区下沿4 (低于4%的预期) 优先轮动或换现金等机会(-60% 以上)",
    minYield: 0,
    maxYield: 4,
    tdClass: "bold red",
    ratio: 0,
    stepRatio: 0,
  },
];

// 判断股票属于哪个区域
function getAreaConfig(stock: Stock): AreaConfig | null {
  // longTermAverageReturnYield 返回的是小数形式（如 0.08 表示 8%）
  // areaConfigs 中配置的是百分比数值（如 12 表示 12%）
  // 需要将小数转换为百分比进行比较
  const yieldValuePercent = stock.longTermAverageReturnYield.value * 100;
  return (
    areaConfigs.find(
      (area) =>
        yieldValuePercent >= area.minYield && yieldValuePercent < area.maxYield,
    ) || null
  );
}

// 创建区域行
function createAreaRow(config: AreaConfig): AreaRowType {
  return {
    rowType: RowType.AREA,
    areaType: AreaType.HITTING,
    trClass: config.trClass,
    tdClass: config.tdClass,
    text: config.name,
  };
}

const tableData = computed(() => {
  // 按区域分组
  const groupedData = new Map<AreaConfig, Stock[]>();
  for (const stock of stocks) {
    const areaConfig = getAreaConfig(stock);
    if (areaConfig) {
      // 计算收集比例 = 目标仓位 × 区域比例
      stock.setCollectionRatio(stock.allocation * areaConfig.ratio);
      if (!groupedData.has(areaConfig)) {
        groupedData.set(areaConfig, []);
      }
      groupedData.get(areaConfig)!.push(stock);
    }
  }

  // 先计算每个区域的累计 ratio（从下往上累加 ratio）
  const areaCumulativeRatios = new Map<AreaConfig, number>();
  let currentCumulative = 0;

  // 从下往上遍历区域（从低收益到高收益）
  for (let i = areaConfigs.length - 1; i >= 0; i--) {
    const areaConfig = areaConfigs[i];
    if (areaConfig.ratio > 0) {
      currentCumulative += areaConfig.ratio;
    }
    areaCumulativeRatios.set(areaConfig, currentCumulative);
  }

  // 构建最终的表格数据：区域标题行 + 对应的股票行
  const result: TableRow[] = [];

  // 按配置顺序遍历区域（从高收益到低收益）
  for (const areaConfig of areaConfigs) {
    // 始终添加区域标题行
    result.push(createAreaRow(areaConfig));

    const stocksInArea = groupedData.get(areaConfig);
    if (stocksInArea && stocksInArea.length > 0) {
      // 按收益率从大到小排序
      const sortedStocks = [...stocksInArea].sort(
        (a, b) =>
          b.longTermAverageReturnYield.value -
          a.longTermAverageReturnYield.value,
      );

      // 计算累计收集 = 目标仓位 × 该区域的累计 ratio
      const areaCumulativeRatio = areaCumulativeRatios.get(areaConfig) || 0;

      for (const stock of sortedStocks) {
        if (areaCumulativeRatio > 0 && areaConfig.ratio > 0) {
          stock.setCumulativeRatio(stock.allocation * areaCumulativeRatio);
        } else {
          stock.setCumulativeRatio(undefined);
        }
        // 计算股数
        stock.setAllShares(investmentAmount.value);

        // 计算当前需要收集的理论股数和理论市值
        let ratio = 0;
        for (const config of areaConfigs.slice().reverse()) {
          // longTermAverageReturnYield 返回的是小数形式（如 0.08 表示 8%）
          // areaConfigs 中配置的是百分比数值（如 12 表示 12%）
          // 需要将小数转换为百分比进行比较
          const yieldValuePercent =
            stock.longTermAverageReturnYield.value * 100;
          if (
            yieldValuePercent >= config.minYield &&
            yieldValuePercent < config.maxYield
          ) {
            const currentRatio =
              ((yieldValuePercent - config.minYield) / 0.5) * config.stepRatio;
            ratio += currentRatio;
            break;
          }

          ratio += config.ratio;
        }
        stock.calculateTheoretical(investmentAmount.value, ratio);
      }

      // 添加该区域的所有股票行
      result.push(...sortedStocks);
    }
  }

  if (stockLevel.value > -1) {
    const filterResult: TableRow[] = [];
    for (const row of result) {
      if (row.rowType === RowType.STOCK) {
        if (stockLevel.value === row.stockLevel) {
          filterResult.push(row);
        }
      } else {
        filterResult.push(row);
      }
    }

    return filterResult;
  }

  return result;
});

const refreshLoading = ref(false);

async function refreshDynamicData() {
  refreshLoading.value = true;
  const stockCodes = stocks.map((s) => s.code);
  const dynamicData = await getDynamicData(stockCodes);
  for (let i = 0; i < dynamicData.length; i += 1) {
    stocks[i].updateDynamicData(dynamicData[i]);
  }
  refreshLoading.value = false;
}

function onValuationStyleChange(style: ValuationStyle) {
  for (const stock of stocks) {
    stock.calculateAnchor(style);
  }
}

function onStockLevelChange(level: StockLevel | -1) {
  stockLevel.value = level;
}

async function init() {
  const stockCodes = stockData.map((s) => s.code);
  const dynamicDataList = await getDynamicData([...stockCodes, "133.CNHHKD"]);
  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  let exchangeRate = 1.13;
  if (exchangeTarget) {
    exchangeRate = exchangeTarget.price / 100;
    console.log("exchangeRate：", exchangeRate);
  }

  for (let i = 0; i < stockData.length; i += 1) {
    const stockItem = stockData[i];
    // TODO: 暂时只取心智升级的股票池
    if (stockItem.valuationConfig.type !== ValuationType.REFERENCE) {
      continue;
    }

    const dynamicData = dynamicDataList.find((v) => v.code === stockItem.code);
    if (dynamicData) {
      const stock = new Stock(
        stockItem,
        dynamicData,
        exchangeRate,
        valuationStyle.value,
      );
      stock.updateDynamicData(dynamicData);
      stocks.push(stock);
    } else {
      console.log("动态数据未能找到: ", stockItem);
    }
  }
}

// onBeforeMount(async () => {
//   init();
// });
</script>

<template>
  <div class="control-panel">
    <!-- <el-select
      class="valuation-style-select"
      v-model="valuationStyle"
      @change="onValuationStyleChange"
    >
      <el-option label="特价" :value="ValuationStyle.SPECIAL_OFFER" />
      <el-option label="保守" :value="ValuationStyle.CONSERVATIVE" />
      <el-option label="中性" :value="ValuationStyle.NEUTRAL" />
      <el-option label="激进" :value="ValuationStyle.OPTIMISTIC" />
    </el-select> -->

    <!-- <el-button
      :loading="refreshLoading"
      type="primary"
      @click="refreshDynamicData"
      >刷新动态数据</el-button
    > -->

    <el-select
      class="level-select"
      v-model="stockLevel"
      @change="onStockLevelChange"
    >
      <el-option label="全部类型" :value="-1" />
      <el-option label="核心良田区" :value="StockLevel.CORE" />
      <el-option label="轮作备田区" :value="StockLevel.ROTATION" />
      <el-option label="田边地头区" :value="StockLevel.MARGIN" />
    </el-select>

    <el-button type="primary" @click="init"
      >手动初始化，避免高频调接口</el-button
    >

    <el-dropdown trigger="click" popper-class="visible-column-dropdown">
      <el-button type="primary">
        表格显示设置
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="column-dropdown-menu">
          <el-dropdown-item
            v-for="col in visibleColumnKeys"
            :key="col.key"
            :hide-on-click="false"
          >
            <el-checkbox v-model="col.show">
              {{ col.label }}
            </el-checkbox>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <div class="input-wrapper">
      <label>投入：</label>
      <input v-model="investmentAmount" type="number" class="amount-input" />
      <span>元</span>
    </div>
  </div>
  <table class="rotation-table">
    <thead>
      <tr>
        <th
          v-for="col in visibleColumns"
          :key="col.key"
          :class="col.thClass"
          v-html="col.label"
        ></th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(row, i) in tableData" :key="i">
        <component :is="renderRow(row)"></component>
      </template>
    </tbody>
    <tfoot>
      <!--  -->
    </tfoot>
  </table>
</template>

<style lang="scss">
.control-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.level-select {
  width: 120px;
}

.valuation-style-select {
  width: 100px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  label {
    font-weight: bold;
  }

  .amount-input {
    width: 150px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
}

.rotation-table {
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 13px;
  color: #000;

  th,
  td {
    line-height: 22px;
    white-space: nowrap;
    padding: 2px 4px;
    color: #000;
    font-weight: normal;
    border: 1px solid #000;
    text-align: center;
  }

  tr:nth-child(2n) {
    background-color: #fff;
  }

  .bold {
    font-weight: bold;
  }

  .bg-green {
    background-color: #00b050;
  }

  .bg-pink {
    background-color: #ffe9e8;
  }

  .bg-orange {
    background-color: #f88825;
  }

  .light-blue {
    color: #00a3f5;
  }

  .blue {
    color: #2972f4;
  }

  .red {
    color: #ff0000;
  }

  .orange {
    color: #f88825;
  }

  .grey {
    color: #939393;
  }
}

.visible-column-dropdown {
  .el-dropdown-menu__item {
    padding: 0px 16px;
  }
}
</style>
