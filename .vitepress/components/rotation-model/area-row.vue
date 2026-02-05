<script setup lang="ts">
import { computed } from "vue";
import { type ColumnConfig, tableColumns } from "./table-columns";
import { type AreaRowType } from "./types";

const props = defineProps<{
  data: AreaRowType;
  columns?: ColumnConfig[];
}>();

// 动态获取列数
const columnCount = computed(() => (props.columns || tableColumns).length);
</script>

<template>
  <tr :class="props.data.trClass">
    <td :class="props.data.tdClass" :colspan="columnCount">{{ props.data.text }}</td>
  </tr>
</template>
