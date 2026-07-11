<script setup lang="ts">
import { ref } from "vue";
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const primaryBusinessData = data[props.code].primaryBusinessData;

const description = `- 每个具体产品的收入、成本和毛利、以及构成收入的明细产品销售数量和价格，以及各项数据的变化趋势。
- 更详细的数据需要查阅财报。`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
    merge: {
      enable: true,
    },
  },
  // {
  //   key: "mainType",
  //   title: "行业、产品、地区",
  //   merge: {
  //     enable: true,
  //   },
  // },
  {
    key: "itemName",
    title: "类型",
  },
  {
    key: "mainBusinessIncome",
    title: "主营收入",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbiRatio",
    title: "收入比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "mainBusinessCost",
    title: "主营成本",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbcRatio",
    title: "成本比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "mainBusinessProfit",
    title: "主营利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbpRatio",
    title: "利润比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "grossProfitRatio",
    title: "毛利率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
];

// 计算表格数据
const tableData = computed(() => {
  // 确保数据按报告期降序排列
  return [...primaryBusinessData].sort((a, b) => {
    // 假设报告期格式为 "YYYY-MM-DD" 或类似可比较的字符串格式
    return a.year.localeCompare(b.year);
  });
});

const industryTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "行业")
);

const productTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "产品")
);

const regionTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "地区")
);

const activeTab = ref<"industry" | "product" | "region">("industry");

const currentTableData = computed(() => {
  switch (activeTab.value) {
    case "industry":
      return industryTableData.value;
    case "product":
      return productTableData.value;
    case "region":
      return regionTableData.value;
  }
});

const currentCaption = computed(() => {
  switch (activeTab.value) {
    case "industry":
      return `${props.code} 主营业务数据（行业）`;
    case "product":
      return `${props.code} 主营业务数据（产品）`;
    case "region":
      return `${props.code} 主营业务数据（地区）`;
  }
});
</script>

<template>
  <el-tabs v-model="activeTab" class="primary-business-tabs">
    <el-tab-pane label="行业" name="industry" />
    <el-tab-pane label="产品" name="product" />
    <el-tab-pane label="地区" name="region" />
  </el-tabs>

  <AppTable
    v-if="currentTableData.length"
    :data="currentTableData"
    :columns="columns"
    :caption="currentCaption"
    default-selected-key="mainBusinessIncome"
    group-key="itemName"
    :description="description"
  />
</template>

<style scoped lang="scss">
.primary-business-tabs {
  margin-top: 16px;
  margin-bottom: 16px;
}
</style>
