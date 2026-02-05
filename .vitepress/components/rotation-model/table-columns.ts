import { formatNum, formatPercent } from "../../../fetch-data/helper";
import { Stock } from "../../service/stock";

/**
 * 列配置接口
 */
export interface ColumnConfig {
  key:
    | keyof Stock
    | "collectionRatio"
    | "cumulativeRatio"
    | "allocationShares"
    | "collectionRatioShares"
    | "cumulativeRatioShares"
    | "allocationValue"
    | "collectionRatioValue"
    | "cumulativeRatioValue";
  label: string;
  thClass?: string;
  tdClass?: string;
  getTdClass?: (data: Stock) => string;
  formatter?: (value: any, data: Stock) => string | number;
  show?: boolean; // 是否显示该列，默认为 true
}

/**
 * 表格列配置
 */
export const tableColumns: ColumnConfig[] = [
  {
    key: "waitYears",
    label: "多等<br />年数",
    thClass: "bold bg-green",
    tdClass: "bold bg-green",
    show: true,
  },
  {
    key: "longTermAverageReturnYield",
    label: "当前期<br />望收益",
    thClass: "bold orange",
    tdClass: "bold orange",
    formatter: (value: number) => formatPercent(value * 100),
    show: true,
  },
  {
    key: "dividendYield",
    label: "当前<br />股息",
    thClass: "bold bg-pink red",
    tdClass: "bold bg-pink red",
    formatter: (value: number) => formatPercent(value * 100),
    show: true,
  },
  {
    key: "dividendPayoutRatio",
    label: "分红率",
    thClass: "grey",
    tdClass: "grey",
    formatter: (value: number) => formatPercent(value * 100),
    show: true,
  },
  {
    key: "name",
    label: "公司<br />名称",
    thClass: "bold light-blue",
    tdClass: "bold light-blue",
    show: true,
  },
  {
    key: "loseYield",
    label: "买入立<br />刻亏损",
    thClass: "bold bg-green",
    tdClass: "bold bg-green",
    formatter: (value: number) => formatPercent(value),
    show: true,
  },
  {
    key: "anchor",
    label: "10%预<br />期",
    thClass: "bold red",
    tdClass: "bold red",
    formatter: (value: number) => formatNum(value, 2),
    show: true,
  },
  {
    key: "price",
    label: "当前<br />股价",
    thClass: "bold blue",
    tdClass: "bold blue",
    formatter: (value: number) => formatNum(value, 2).toFixed(2),
    show: true,
  },
  {
    key: "allocation",
    label: "目标<br />仓位",
    formatter: (value: number) => {
      return value > 0 ? formatPercent(value * 100, 0) : "--";
    },
    show: true,
  },
  {
    key: "allocationShares",
    label: "目标<br />股数",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
    {
    key: "allocationValue",
    label: "目标<br />市值",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
  {
    key: "collectionRatio",
    label: "收集<br />比例",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatPercent(value * 100, 2);
    },
    show: true,
  },
  {
    key: "collectionRatioShares",
    label: "收集<br />股数",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
    {
    key: "collectionRatioValue",
    label: "收集<br />市值",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
  {
    key: "cumulativeRatio",
    label: "累计<br />收集",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatPercent(value * 100, 2);
    },
    show: true,
  },
  {
    key: "cumulativeRatioShares",
    label: "累计<br />股数",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
  {
    key: "cumulativeRatioValue",
    label: "累计<br />市值",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: true,
  },
  // {
  //   key: "",
  //   label: "近3年低价",
  //   thClass: "bold",
  //   tdClass: "bold",
  // },
];
