<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const costsExpensesData = data[props.code].costsExpensesData;

const description = `1. 研发资本化往往被诟病为操纵利润，需特别注意，研发费用资本化放在开发费用中
2. 看研发费用总额变化
3. 看销售费用变化
4. 销售收入增长是否快于管理费用增长才符合企业运作常识
5. 管理费用是期间费用，在收入规模扩大的过程中，管理费用比例应当呈下降趋势，这才有规模效应`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
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
    key: "grossProfitMinusNetProfit",
    title: "毛利率-净利率",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2) + "%"),
  },
  {
    key: "devExpenses",
    title: "研发费用",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "manageExpenses",
    title: "管理费用",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "sellingExpenses",
    title: "销售费用",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "devAndManageExpenses",
    title: "管理研发费用",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "financialExpenses",
    title: "财务费用",
    formatter: (value: number) => (value / 100000000).toFixed(2),
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
];

// 表格标题
const tableCaption = computed(() => "成本费用数据");

// 定义需要计算增速的列（排除年份和百分比列）
const numericColumns = [
  "sellingExpenses",
  "manageExpenses",
  "devExpenses",
  "devAndManageExpenses",
  "financialExpenses",
  "totalOperatingExpenses",
];

// 计算年化增速
const calculateGrowthRate = (
  startValue: number,
  endValue: number,
  years: number,
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
    (a, b) => parseInt(a.year) - parseInt(b.year),
  );

  // 1年年化增速（最新一年比前一年）
  const oneYear = calculateGrowthRate(
    sortedData[sortedData.length - 2][column], // 前一年
    sortedData[sortedData.length - 1][column], // 最新一年
    1,
  );

  // 5年年化增速（最新一年比5年前）
  const fiveYear = calculateGrowthRate(
    sortedData[sortedData.length - 6][column], // 5年前
    sortedData[sortedData.length - 1][column], // 最新一年
    5,
  );

  // 9年年化增速（最新一年比9年前）
  const nineYear = calculateGrowthRate(
    sortedData[0][column], // 最早一年
    sortedData[sortedData.length - 1][column], // 最新一年
    sortedData.length - 1, // 总年数减1
  );

  return {
    oneYear,
    fiveYear,
    nineYear,
  };
};

const tableData = computed(() => {
  const hasQuarter = costsExpensesData.some((v) => v.year.includes("Q"));

  // 获取原始数据并确保有足够的数据点
  const originalData = costsExpensesData.slice(0, hasQuarter ? 11 : 10);
  if (originalData.length < 2) return originalData.reverse();

  // 按年份升序排序
  const sortedData = [...originalData].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year),
  );

  // 计算所有数值列的增速
  const growthData = numericColumns.reduce(
    (acc, column) => {
      try {
        acc[column] = calculateColumnGrowth(
          sortedData.filter((v) => !v.year.includes("Q")),
          column,
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
    },
    {} as Record<string, any>,
  );

  // 创建统计行
  const statsRows = [
    {
      year: "1年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce(
        (obj, col) => {
          obj[col] = growthData[col].oneYear;
          return obj;
        },
        {} as Record<string, any>,
      ),
    },
    {
      year: "5年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce(
        (obj, col) => {
          obj[col] = growthData[col].fiveYear;
          return obj;
        },
        {} as Record<string, any>,
      ),
    },
    {
      year: "9年年化增速",
      _isStatRow: true,
      ...numericColumns.reduce(
        (obj, col) => {
          obj[col] = growthData[col].nineYear;
          return obj;
        },
        {} as Record<string, any>,
      ),
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
