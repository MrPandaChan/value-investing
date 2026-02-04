<script lang="ts" setup>
import { computed, h } from "vue";
import { Stock } from "../../service/stock";
import { tableColumns } from "./table-columns";
import { AreaRowType, RowType, TableRow } from "./types";
import StockRow from "./stock-row.vue";
import AreaRow from "./area-row.vue";

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
  const tableData: TableRow[] = [
    //
  ];

  return tableData;
});
</script>

<template>
  <table class="stock-table">
    <caption>
      价值轮动模型
    </caption>
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
