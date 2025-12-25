<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const turnoverRateData = data[props.code].turnoverRateData;

const description = `如果有精力，可对资产周转率进一步拆解，资产周转率代表资产效率，拆解后可以对资产效率变化的原因有进一步了解。

想拆解资产周转率指标，首先准备平均资产数据。平均资产数=（期初数+期末数）/2，周转天数=365× 资产/收入或者主营业务成本，存货对应主营业务成本，其他对应销售收入。`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
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
];

// 表格标题
const tableCaption = computed(() => "资产周转率数据");

// 定义需要计算增速的列（排除年份和天数列）
const numericColumns = [
  "totalAssets",
  "avgTotalAssets",
  "avgCurrentAssets",
  "avgInventory",
  "equity",
  "avgEquity",
  "totalAssetsDays",
  "currentAssetsDays",
  "wcDays",
  "receivablesDays",
  "inventoryDays",
  "fixedAssetsDays",
];

// 计算年化增速
const calculateGrowthRate = (
  startValue: number,
  endValue: number,
  years: number
) => {
  if (!startValue || !endValue || years <= 0) return NaN;

  // 处理从负数到正数的特殊情况
  if (startValue < 0 && endValue > 0) {
    const totalGrowth = (endValue - startValue) / Math.abs(startValue);
    return (Math.pow(1 + totalGrowth, 1 / years) - 1) * 100;
  }

  // 标准年化增长率计算公式
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// 计算单列的各种增速
const calculateColumnGrowth = (data: any[], column: string) => {
  // 确保数据按年份升序排列（从早到晚）
  const sortedData = [...data].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year)
  );

  // 1年年化增速（最新一年比前一年）
  const oneYear = calculateGrowthRate(
    sortedData[sortedData.length - 2][column], // 前一年
    sortedData[sortedData.length - 1][column], // 最新一年
    1
  );

  // 5年年化增速（最新一年比5年前）
  const fiveYear = calculateGrowthRate(
    sortedData[sortedData.length - 6][column], // 5年前
    sortedData[sortedData.length - 1][column], // 最新一年
    5
  );

  // 9年年化增速（最新一年比9年前）
  const nineYear = calculateGrowthRate(
    sortedData[0][column], // 最早一年
    sortedData[sortedData.length - 1][column], // 最新一年
    sortedData.length - 1 // 总年数减1
  );

  return {
    oneYear,
    fiveYear,
    nineYear,
  };
};

const tableData = computed(() => {
  const hasQuarter = turnoverRateData.some((v) => v.year.includes("Q"));

  // 获取原始数据并确保有足够的数据点
  const originalData = turnoverRateData.slice(0, hasQuarter ? 11 : 10);
  if (originalData.length < 2) return originalData.reverse();

  // 按年份升序排序
  const sortedData = [...originalData].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year)
  );

  // 计算所有数值列的增速
  const growthData = numericColumns.reduce((acc, column) => {
    try {
      acc[column] = calculateColumnGrowth(
        sortedData.filter((v) => !v.year.includes("Q")),
        column
      );
    } catch (e) {
      console.error(`Error calculating growth for ${column}:`, e);
      acc[column] = {
        oneYear: NaN,
        fiveYear: NaN,
        nineYear: NaN,
      };
    }
    return acc;
  }, {} as Record<string, any>);

  // 创建统计行
  const statsRows = [
    {
      year: "1年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce((obj, col) => {
        obj[col] = growthData[col].oneYear;
        return obj;
      }, {} as Record<string, any>),
    },
    {
      year: "5年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce((obj, col) => {
        obj[col] = growthData[col].fiveYear;
        return obj;
      }, {} as Record<string, any>),
    },
    {
      year: "9年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce((obj, col) => {
        obj[col] = growthData[col].nineYear;
        return obj;
      }, {} as Record<string, any>),
    },
  ];

  // 返回按年份降序排列的数据 + 统计行
  return [...sortedData, ...statsRows];
});
</script>

<template>
  <AppTable
    :data="tableData"
    :columns="columns"
    :caption="tableCaption"
    :description="description"
  />
</template>
