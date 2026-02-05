<script lang="ts" setup>
import { computed, h } from "vue";
import { Stock } from "../../service/stock";
import { tableColumns } from "./table-columns";
import { type AreaRowType, RowType, type TableRow } from "./types";
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

const tableData = computed(() => {
  const stocks: Stock[] = [];
  for (const stockItem of stockData) {
    const stock = new Stock(stockItem);
    stocks.push(stock);
  }

  const tableData: TableRow[] = [...stocks];

  return tableData;
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
    padding: 4px;
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
