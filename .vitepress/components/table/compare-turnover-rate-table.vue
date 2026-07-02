<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";
import {
  type Assign,
  type FixedAssetInvestmentAnalysisData,
  type TurnoverRateData,
} from "../../../types";
import { stockData } from "../../../types/stocks";

type MergeData = Assign<
  [
    TurnoverRateData,
    FixedAssetInvestmentAnalysisData,
    {
      name: string;
    },
  ]
>;

const props = defineProps<{
  codes: (keyof typeof data)[];
}>();

const description = `1. 对比周转率分析
2. 对比 1 元收入需要的固定资产分析`;

const compareData = props.codes.reduce((pre: MergeData[], code) => {
  const name = stockData.find((v) => v.code === code)?.name ?? "";

  const arr = data[code].turnoverRateData.map((v, i) => ({
    ...v,
    ...data[code].fixedAssetInvestmentAnalysisData[i],
    name,
  }));

  return pre.concat(arr);
}, []);

const compareDataQuarterly = props.codes.reduce((pre: MergeData[], code) => {
  const name = stockData.find((v) => v.code === code)?.name ?? "";

  const arr = data[code].turnoverRateDataQuarterly.map((v, i) => ({
    ...v,
    ...data[code].fixedAssetInvestmentAnalysisDataQuarterly[i],
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
    key: "totalAssets",
    title: "总资产",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "avgTotalAssets",
    title: "平均总资产",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "avgCurrentAssets",
    title: "平均流动资产",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "avgInventory",
    title: "平均存货",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "equity",
    title: "归母净资产",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "avgEquity",
    title: "平均归母净资产",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "totalAssetsDays",
    title: "总资产周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "currentAssetsDays",
    title: "流动资产周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "wcDays",
    title: "WC周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "receivablesDays",
    title: "应收周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "inventoryDays",
    title: "存货周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "fixedAssetsDays",
    title: "固定资产周转天数",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "fixedAssetsPerYuanRevenue",
    title: "1元收入需要的固定资产",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "longTermOperatingAssetsPerYuanRevenue",
    title: "1元收入需要的长期资产",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
];

// 表格标题
const tableCaption = computed(() => "资产周转率数据");

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
    default-selected-key="totalAssets"
    group-key="name"
    :description="description"
  />
</template>
