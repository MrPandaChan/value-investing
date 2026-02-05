<script setup lang="ts">
import { tableColumns } from "./table-columns";
import { type AreaRowType } from "./types";

const props = defineProps<{
  data: AreaRowType;
}>();

// 动态获取列数
const columnCount = tableColumns.length;
</script>

<template>
  <tr :class="props.data.trClass">
    <td :colspan="columnCount">{{ props.data.text }}</td>
  </tr>
</template>
