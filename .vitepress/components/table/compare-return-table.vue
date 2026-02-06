<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";
import { type Assign, type ReturnData } from "../../../types";
import { stockData } from "../../../types/stocks";

type MergeData = Assign<
  [
    ReturnData,
    {
      name: string;
    },
  ]
>;

const props = defineProps<{
  codes: (keyof typeof data)[];
}>();

const description = `1. 对比 ROE，ROIC 分析`;

const compareData = props.codes.reduce((pre: MergeData[], code) => {
  const name = stockData.find((v) => v.code === code)?.name ?? "";

  const arr = data[code].returnData.map((v, i) => ({
    ...v,
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
    key: "roe",
    title: "ROE",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "roa",
    title: "ROA",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "roic",
    title: "ROIC",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "netProfitMargin",
    title: "销售净利率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "assetTurnover",
    title: "资产周转率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "equityMultiplier",
    title: "权益乘数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
];

// 表格标题
const tableCaption = computed(() => "回报率数据");

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
</script>

<template>
  <AppTable
    :data="tableData"
    :columns="columns"
    :caption="tableCaption"
    default-selected-key="roe"
    group-key="name"
    :description="description"
  />
</template>
