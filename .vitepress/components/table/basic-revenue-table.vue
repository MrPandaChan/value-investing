<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const basicRevenueData = data[props.code].basicRevenueData;
const basicRevenueDataQuarterly = data[props.code].basicRevenueDataQuarterly;

const description = `1. 看收入、净利润和利润率
2. 看收入利润发展过程
3. 观察盈利质量
    1. 归母净利润和扣非净利润（是否依靠主营业务，非经常性损益占比）
    2. 经营利润与金融利润（占比分析，表中经营利润为归母净利润扣除金融利润，虽然简单粗暴，但颗粒度已经足够）
    3. 经营净现金流与归母净利润（差异、经营现金流和净利润增长对比）
    4. 自由现金流（生意能否现金自洽）
4. 看机构预测`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
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
    key: "netProfitMargin",
    title: "净利率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "netProfitExcludingNon",
    title: "扣非净利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "coreProfit",
    title: "核心利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "cashFlowFromOperating",
    title: "经营现金流",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "capex",
    title: "资本支出",
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
    key: "netProfitExcludingNonOvernetProfit",
    title: "扣非净利润/净利润",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "cashFlowFromOperatingOverNetProfit",
    title: "经营现金流/净利润",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "operatingProfit",
    title: "经营利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "financialProfit",
    title: "金融利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "operatingProfitOverNetProfit",
    title: "经营利润/净利润",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
];

// 表格标题
const tableCaption = computed(() => "营收基本数据");

// 定义需要计算增速的列（排除年份和百分比列）
const numericColumns = [
  "revenue",
  "netProfit",
  "netProfitExcludingNon",
  "coreProfit",
  "cashFlowFromOperating",
  "fcf",
  "capex",
  "operatingProfit",
  "financialProfit",
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
  const hasQuarter = basicRevenueData.some((v) => v.year.includes("Q"));

  // 获取原始数据并确保有足够的数据点
  const originalData = basicRevenueData.slice(0, hasQuarter ? 11 : 10);
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
        fiveToNine: NaN,
        avgGrowth: NaN,
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

const quarterlyTableData = computed(() => {
  return basicRevenueDataQuarterly?.length ? basicRevenueDataQuarterly : [];
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
