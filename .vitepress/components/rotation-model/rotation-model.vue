<script lang="ts" setup>
import { computed, h } from "vue";
import { Stock } from "../../service/stock";
import { tableColumns } from "./table-columns";
import { type AreaRowType, AreaType, RowType, type TableRow } from "./types";
import StockRow from "./stock-row.vue";
import AreaRow from "./area-row.vue";
import { stockData } from "../../../types";

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

/**
 * 围攻区(12% 以上预期收益率)黑天鹅纷飞、鬼故事遍地的时候才可能出现
 * (0)主战区(10.5%-12%的预期收益率)
 * (0)主战区3(10%的预期收益率)(0%到5%)15%
 * (0)主战区2 (9.5%预期收益率)(-5%以内)10%
 * (0)主战区1(9%预期收益率)(-5%到-10%)10%
 * (1)观察区2(8.5%预期收益率)(-10%到-15%)5%
 * (2)观察区1(8%预期收益率)(-15%到-20%)5%
 * (3)平庸区下沿(6.5%-8%预期收益率) *备用弹药库2*耐心持有(-20%到-35%)
 * (4)平庸区上沿(5.5%-5.5%预期收益率) *备用弹药库1*分批轮动(-35%到-45%)
 * (4)平庸区上沿(5.5%-5.5%预期收益率) *备用弹药库1*分批轮动(-35%到-45%)
 * (5)险地区下沿1(低于5.5%的预期) 优先轮动或换现金等机会(-45%到-50%)
 * (6)险地区下沿2(低于5%的预期) 优先轮动或换现金等机会(-50到-55%)
 * (7)险地区下沿3(低于4.5%的预期) 优先轮动或换现金等机会(-55%到-60%)
 * (8)险地区下沿4(低于4%的预期) 优先轮动或换现金等机会(-60以上)
 */

// 区域配置定义
interface AreaConfig {
  name: string;
  minYield: number;
  maxYield: number | null;
  trClass?: string;
  tdClass?: string;
}

const areaConfigs: AreaConfig[] = [
  { name: "围攻区 (12% 以上预期收益率) 黑天鹅纷飞、鬼故事遍地的时候才可能出现", minYield: 12, maxYield: null, tdClass: "bold bg-orange" },
  { name: "(0) 主战区 (10.5% - 12%的预期收益率)", minYield: 10.5, maxYield: 12, tdClass: "bold bg-pink" },
  { name: "(0) 主战区3 (10% 的预期收益率) (0% 到 5%) 15%", minYield: 10, maxYield: 10.5, tdClass: "bold bg-pink" },
  { name: "(0) 主战区2 (9.5% 预期收益率) (-5% 以内) 10%", minYield: 9.5, maxYield: 10, tdClass: "bold bg-pink" },
  { name: "(0) 主战区1 (9%预期收益率) (-5% 到-10%) 10%", minYield: 9, maxYield: 9.5, tdClass: "bold bg-pink" },
  { name: "(1) 观察区2 (8.5%预期收益率) (-10% 到-15%) 5%", minYield: 8.5, maxYield: 9, tdClass: "bold red" },
  { name: "(2) 观察区1 (8%预期收益率) (-15% 到-20%) 5%", minYield: 8, maxYield: 8.5, tdClass: "bold red" },
  { name: "(3) 平庸区下沿 (6.5%-8%预期收益率) *备用弹药库2*耐心持有(-20% 到 -35%)", minYield: 6.5, maxYield: 8, tdClass: "bold red" },
  { name: "(4) 平庸区上沿 (5.5%-5.5%预期收益率) *备用弹药库1*分批轮动(-35% 到 -45%)", minYield: 5.5, maxYield: 6.5, tdClass: "bold red" },
  { name: "(5) 险地区下沿1 (低于5.5%的预期) 优先轮动或换现金等机会(-45% 到 -50%)", minYield: 5, maxYield: 5.5, tdClass: "bold red" },
  { name: "(6) 险地区下沿2 (低于5%的预期) 优先轮动或换现金等机会(-50 到 -55%)", minYield: 4.5, maxYield: 5, tdClass: "bold red" },
  { name: "(7) 险地区下沿3 (低于4.5%的预期) 优先轮动或换现金等机会(-55% 到 -60%)", minYield: 4, maxYield: 4.5, tdClass: "bold red" },
  { name: "(8) 险地区下沿4 (低于4%的预期) 优先轮动或换现金等机会(-60% 以上)", minYield: 0, maxYield: 4, tdClass: "bold red" },
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
        (area.maxYield === null || yieldValuePercent < area.maxYield)
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
      if (!groupedData.has(areaConfig)) {
        groupedData.set(areaConfig, []);
      }
      groupedData.get(areaConfig)!.push(stock);
    }
  }

  // 构建最终的表格数据：区域标题行 + 对应的股票行
  const result: TableRow[] = [];

  // 按配置顺序遍历区域
  for (const areaConfig of areaConfigs) {
    const stocksInArea = groupedData.get(areaConfig);
    if (stocksInArea && stocksInArea.length > 0) {
      // 添加区域标题行
      result.push(createAreaRow(areaConfig));

      // 按收益率从大到小排序
      const sortedStocks = [...stocksInArea].sort(
        (a, b) =>
          b.longTermAverageReturnYield.value -
          a.longTermAverageReturnYield.value
      );

      // 添加该区域的所有股票行
      result.push(...sortedStocks);
    }
  }

  return result;
});
</script>

<template>
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
    background-color: #F88825;
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
