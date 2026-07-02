<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";
import {
  type Assign,
  type BasicRevenueData,
  type CostsExpensesData,
  type WorkingCapitalData,
} from "../../../types";
import { stockData } from "../../../types/stocks";

type MergeData = Assign<
  [
    BasicRevenueData,
    CostsExpensesData,
    WorkingCapitalData,
    {
      name: string;
    },
  ]
>;

const props = defineProps<{
  codes: (keyof typeof data)[];
}>();

const description = `1. 对比营业收入及增速
2. 对比净利润及增速
3. 对比净利率、毛利率、期间费用率
4. 对比销售费用、研发费用
5. 对比 1 元收入所需 WC`;

const compareData = props.codes.reduce((pre: MergeData[], code) => {
  const name = stockData.find((v) => v.code === code)?.name ?? "";

  const arr = data[code].basicRevenueData.map((v, i) => ({
    ...v,
    ...data[code].costsExpensesData[i],
    ...data[code].workingCapitalData[i],
    name,
  }));

  return pre.concat(arr);
}, []);

const compareDataQuarterly = props.codes.reduce((pre: MergeData[], code) => {
  const name = stockData.find((v) => v.code === code)?.name ?? "";

  const arr = data[code].basicRevenueDataQuarterly.map((v, i) => ({
    ...v,
    ...data[code].costsExpensesDataQuarterly[i],
    ...data[code].workingCapitalDataQuarterly[i],
    name,
  }));

  return pre.concat(arr);
}, []);

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
    merge: {
      enable: true,
    },
  },
  {
    key: "name",
    title: "公司",
    merge: {
      enable: true,
    },
  },
  {
    key: "revenue",
    title: "营业收入",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "netProfit",
    title: "净利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "coreProfit",
    title: "核心利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "fcf",
    title: "自由现金流",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "fcfOverNetProfit",
    title: "自由现金流/净利润",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "grossProfitMargin",
    title: "毛利率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "netProfitMargin",
    title: "净利率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "totalOperatingExpenses",
    title: "期间费用合计",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "sellingExpensesRatio",
    title: "销售费用率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "devExpensesRatio",
    title: "研发费用率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "manageExpensesRatio",
    title: "管理费用率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "devAndManageExpensesRatio",
    title: "管理研发费用率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "totalOperatingExpensesRatio",
    title: "期间费用率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "wcPerYuanRevenue",
    title: "1元收入需要的WC",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
];

// 表格标题
const tableCaption = computed(() => "基本数据");

const tableData = computed(() => {
  // 获取原始数据并确保有足够的数据点
  const originalData = compareData.slice(0, compareData.length);
  if (originalData.length < 2) return originalData.reverse();

  // 按年份升序排序
  const sortedData = [...originalData].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year),
  );

  return sortedData;
});

const quarterlyTableData = computed(() => {
  return compareDataQuarterly?.length ? compareDataQuarterly : [];
});
</script>

<template>
  <AppTable
    :data="tableData"
    :quarterly-data="quarterlyTableData"
    :columns="columns"
    :caption="tableCaption"
    default-selected-key="revenue"
    group-key="name"
    :description="description"
  />
</template>
