<script setup lang="ts">
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";

const props = defineProps<{
  code: keyof typeof data;
}>();

const workingCapitalData = data[props.code].workingCapitalData;

const description = `
把企业看成一个投入产出系统，目的是服务客户，客户满意，企业获得收入，实现商业循环。

1. 需要资本性支出购置设备、无形资产和固定设施等，例如制造企业，需要生产设施才能生产产品，其中最重要的是固定资产；
2. 投入流动资金，例如商业销售，要先垫钱备货；
3. 投入人力，任何资产都需要人去经营。

总体而言，要投入 3 项资源：固定资产、WC 和人力。这 3 项投入能帮助我们理解企业商业模式和驱动力，而这 3 项投入隐藏在财务数据后面，我们要进行数据处理才能得到。

WC（营运资金）=应收账款和票据+预付账款+存货+合同资产-应付账款和票据-预收账款-合同负债

WC 是投入，产出就是收入，所以衡量 WC 投入产出效率的指标是：1 元收入需要的 WC=WC÷ 销售收入。

WC 是个期末时间点数字，而销售收入是期间数字。理论上这两个数相除，要把 WC 做期间化处理，一般就是（期初+期末）/2。

现实中，很多时候我们看趋势变化，所以如果统一都用期末数，影响也不大，如果 WC 期初期末变动剧烈，可以考虑再进一步优化数据，通常用期末数已经足够。另外，应收款项融资需要加回来包括在应收账款和票据中，在 WC 分析场景下，该项目只是应收票据融资后，会计将贴现票据分类处理，性质并没有变化，仍然是企业营运中垫付资金。应付账款和票据，其中票据只包括商业承兑汇票，这是供应商给的信用，而很多情况下银行承兑汇票需预存全额保证金，实际是货币资金置换而不是供应商信用，对于大多数制造类企业来说，商业承兑汇票数量较少，简化可以直接用应付账款而不考虑应付票据的明细情况。

（新增 WC）是本年 WC-上年 WC，代表本期 WC 的增量，也就是企业在经营中本年需要新投入的资金数，这个属于再投资范围。

WC 两个用途：

1. 工具用途。财务分析的尽头是估值，如果用 DCF，需要预测未来自由现金流，而自由现金流等于净利润减去保证净利润产生的再投资，再投资包括两部分：增量 WC 和 CAPEX。现在你就明白我们为什么要算 1 元收入需要的 WC。
2. 识别商业模式和判断企业竞争地位。正常情况下，企业需要垫付流动资金，而垫付多少取决于生意是怎么做的，以及该企业与上下游企业之间的竞争地位。我们需要把它放在背景中去对比（一种是对比不同行业、不同商业模式下指标的变化，另一种是与同行业公司对比）​。

- **WC > 0 （正数）**： 意味着你垫付出去的钱，多于你占用的钱。你的生意需要**额外的运营资金**来周转。这通常会占用公司的现金，对现金流不利。
- **WC < 0 （负数）**： 意味着你占用的上下游的钱，多于你垫付出去的钱。你的生意不仅不需要自己掏钱周转，反而**能把别人的钱当成“无息贷款”**来用。这对现金流极为有利。

WC 是实际经营性流动资产减去经营性流动负债，衡量净流动资产的投入产出效率，表示企业为了服务客户取得收入在净流动资产方面的投入。`;

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
  },
  {
    key: "wcPerYuanRevenue",
    title: "1元收入需要的WC",
    formatter: (value: number) => (isNaN(value) ? "-" : value.toFixed(2)),
  },
  {
    key: "wc",
    title: "WC",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "receivables",
    title: "应收",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "prepayments",
    title: "预付款项",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "inventory",
    title: "存货",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "accountsPayable",
    title: "应付",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "customerAdvances",
    title: "预收",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "contractLiabilities",
    title: "合同负债",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "receivablesToRevenueRatio",
    title: "应收占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "prepaymentsToRevenueRatio",
    title: "预付占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "inventoryToRevenueRatio",
    title: "存货占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "accountsPayableToRevenueRatio",
    title: "应付占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "advancesToRevenueRatio",
    title: "预收占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "contractLiabilitiesToRevenueRatio",
    title: "合同负债占收入比重",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "changeInWC",
    title: "新增WC",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
];

// 表格标题
const tableCaption = computed(() => "营运资金数据");

// 定义需要计算增速的列（排除年份和百分比列）
const numericColumns = [
  "wcPerYuanRevenue",
  "wc",
  "receivables",
  "prepayments",
  "inventory",
  "accountsPayable",
  "customerAdvances",
  "contractLiabilities",
  "changeInWC",
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
  const hasQuarter = workingCapitalData.some((v) => v.year.includes("Q"));

  // 获取原始数据并确保有足够的数据点
  const originalData = workingCapitalData.slice(0, hasQuarter ? 11 : 10);
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
