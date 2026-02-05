<script lang="ts" setup>
import { computed, h, ref } from "vue";
import { Stock } from "../../service/stock";
import { tableColumns } from "./table-columns";
import { type AreaRowType, AreaType, RowType, type TableRow } from "./types";
import StockRow from "./stock-row.vue";
import AreaRow from "./area-row.vue";
import { stockData } from "../../../types";

// 投入金额
const investmentAmount = ref(1000000); // 默认100万

// 多等年数、当前期望收益、分红率、公司名称、买入立刻亏损、10%预期、当前股价、近3年低价、分红需等月数

const isStockRow = (row: TableRow): row is Stock =>
  row.rowType === RowType.STOCK;

const isAreaRow = (row: TableRow): row is AreaRowType =>
  row.rowType === RowType.AREA;

function renderRow(row: TableRow) {
  if (isStockRow(row)) {
    return h(StockRow, {
      data: row,
    });
  } else if (isAreaRow(row)) {
    return h(AreaRow, {
      data: row,
    });
  } else {
    return h("tr");
  }
}

// 区域配置定义
interface AreaConfig {
  name: string;
  minYield: number;
  maxYield: number | null;
  trClass?: string;
  tdClass?: string;
  ratio: number; // 收集比例（0.15 表示 15%）
}

const areaConfigs: AreaConfig[] = [
  {
    name: "围攻区 (12% 以上预期收益率) 黑天鹅纷飞、鬼故事遍地的时候才可能出现",
    minYield: 12,
    maxYield: null,
    tdClass: "bold bg-orange",
    ratio: 0,
  },
  {
    name: "(0) 主战区 (10.5% - 12%的预期收益率) 60%",
    minYield: 10.5,
    maxYield: 12,
    tdClass: "bold bg-pink",
    ratio: 0.6,
  },
  {
    name: "(0) 主战区3 (10% 的预期收益率) (0% 到 5%) 15%",
    minYield: 10,
    maxYield: 10.5,
    tdClass: "bold bg-pink",
    ratio: 0.15,
  },
  {
    name: "(0) 主战区2 (9.5% 预期收益率) (-5% 以内) 10%",
    minYield: 9.5,
    maxYield: 10,
    tdClass: "bold bg-pink",
    ratio: 0.1,
  },
  {
    name: "(0) 主战区1 (9%预期收益率) (-5% 到-10%) 10%",
    minYield: 9,
    maxYield: 9.5,
    tdClass: "bold bg-pink",
    ratio: 0.1,
  },
  {
    name: "(1) 观察区2 (8.5%预期收益率) (-10% 到-15%) 5%",
    minYield: 8.5,
    maxYield: 9,
    tdClass: "bold red",
    ratio: 0.05,
  },
  {
    name: "(2) 观察区1 (8%预期收益率) (-15% 到-20%) 5%",
    minYield: 8,
    maxYield: 8.5,
    tdClass: "bold red",
    ratio: 0.05,
  },
  {
    name: "(3) 平庸区下沿 (6.5%-8%预期收益率) *备用弹药库2*耐心持有(-20% 到 -35%)",
    minYield: 6.5,
    maxYield: 8,
    tdClass: "bold red",
    ratio: 0,
  },
  {
    name: "(4) 平庸区上沿 (5.5%-5.5%预期收益率) *备用弹药库1*分批轮动(-35% 到 -45%)",
    minYield: 5.5,
    maxYield: 6.5,
    tdClass: "bold red",
    ratio: 0,
  },
  {
    name: "(5) 险地区下沿1 (低于5.5%的预期) 优先轮动或换现金等机会(-45% 到 -50%)",
    minYield: 5,
    maxYield: 5.5,
    tdClass: "bold red",
    ratio: 0,
  },
  {
    name: "(6) 险地区下沿2 (低于5%的预期) 优先轮动或换现金等机会(-50 到 -55%)",
    minYield: 4.5,
    maxYield: 5,
    tdClass: "bold red",
    ratio: 0,
  },
  {
    name: "(7) 险地区下沿3 (低于4.5%的预期) 优先轮动或换现金等机会(-55% 到 -60%)",
    minYield: 4,
    maxYield: 4.5,
    tdClass: "bold red",
    ratio: 0,
  },
  {
    name: "(8) 险地区下沿4 (低于4%的预期) 优先轮动或换现金等机会(-60% 以上)",
    minYield: 0,
    maxYield: 4,
    tdClass: "bold red",
    ratio: 0,
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
        yieldValuePercent >= area.minYield &&
        (area.maxYield === null || yieldValuePercent < area.maxYield),
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
  // 创建股票实例
  const stocks: Stock[] = [];
  for (const stockItem of stockData) {
    const stock = new Stock(stockItem);
    stocks.push(stock);
  }

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
      }

      // 添加该区域的所有股票行
      result.push(...sortedStocks);
    }
  }

  return result;
});
</script>

<template>
  <div class="input-wrapper">
    <label>投入金额：</label>
    <input v-model="investmentAmount" type="number" class="amount-input" />
    <span>元</span>
  </div>
  <table class="rotation-table">
    <thead>
      <tr>
        <th
          v-for="col in tableColumns"
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
.input-wrapper {
  margin-bottom: 10px;
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
</style>
