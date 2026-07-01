<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const returnData = data[props.code].returnData;
const returnDataQuarterly = data[props.code].returnDataQuarterly;

const description = `收益率指标一般看这么几个：ROE、资产回报率(Return on Assets, ROA)和资本投入回报率(Return on Investment Capital, ROIC)，以及前面我们已经算过的净经营资产收益率。收益率当然是越高越好，持续高更好，我的大体感觉，ROE 在 20%以上的都是比较优秀的公司。ROA 主要和 ROE 结合起来看，看在去掉杠杆效应的情况下总资产的获利能力。

通常用杜邦分析法分析 ROE 波动背后的原因

ROE、ROA 我们常用，ROIC 用得少一点，主要是 ROIC 数据需要处理，分解不那么容易，所以要去理解 ROIC 背后的驱动原因有些困难[ROIC=税后净运营利润 NOPAT(NetOperating Profit After Tax)/投资资本，NOPAT=（营业利润+利息支出）×（1-所得税率）​，投资资本=总资产-无息流动负债-商誉]​。ROIC 在评估盈利能力时同时考虑了股权资本和债权资本的影响，可以更加客观地评估公司在无杠杆下的盈利能力。

ROIC 只要与 ROE 同步就问题不大，由于 ROIC 的拆解比较复杂，非专业投资人看看指标就好，如果偏离很大，就需要去找找原因。`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
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
    key: "roce",
    title: "ROCE",
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
  const originalData = returnData.slice(0, 10);
  if (originalData.length < 2) return originalData.reverse();

  // 按年份升序排序
  const sortedData = [...originalData].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year)
  );

  // 返回按年份降序排列的数据 + 统计行
  return [...sortedData];
});

const quarterlyTableData = computed(() => {
  return returnDataQuarterly?.length ? returnDataQuarterly : [];
});
</script>

<template>
  <AppTable
    :data="tableData"
    :quarterly-data="quarterlyTableData"
    :columns="columns"
    :caption="tableCaption"
    :description="description"
  />
</template>
