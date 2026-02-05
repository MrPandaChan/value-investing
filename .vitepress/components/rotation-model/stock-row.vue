<script lang="ts" setup>
import { Stock } from "../../service/stock";
import { type ColumnConfig, tableColumns } from "./table-columns";

const { data, columns = tableColumns } = defineProps<{
  data: Stock;
  columns?: ColumnConfig[];
}>();

/**
 * 获取单元格内容
 */
function getCellValue(col: ColumnConfig, row: Stock) {
  // 获取数据值
  const value = (row as any)[col.key];

  // 如果是 ComputedRef，获取实际值
  const actualValue = value?.value ?? value;

  // 如果有格式化函数，使用它
  if (col.formatter) {
    return col.formatter(actualValue, row);
  }

  return actualValue;
}

/**
 * 获取单元格样式类
 */
function getCellClass(col: ColumnConfig, row: Stock): string {
  const classes: string[] = [];

  if (col.tdClass) {
    classes.push(col.tdClass);
  }

  if (col.getTdClass) {
    classes.push(col.getTdClass(row));
  }

  return classes.join(" ");
}
</script>

<template>
  <tr>
    <td
      v-for="col in columns"
      :key="col.key"
      :class="getCellClass(col, data)"
      v-html="getCellValue(col, data)"
    >
    </td>
  </tr>
</template>
