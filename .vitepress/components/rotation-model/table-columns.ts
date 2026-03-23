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
    | "cumulativeRatioValue"
    | "theoreticalShares"
    | "theoreticalValue";
  label: string;
  thClass?: string;
  tdClass?: string;
  getTdClass?: (data: Stock) => string;
  formatter?: (value: any, data: Stock) => string | number;
  show: boolean; // 是否显示该列，默认为 true
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
    show: false,
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
    thClass: "bold",
    tdClass: "bold",
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
    show: false,
  },
  {
    key: "allocationValue",
    label: "目标<br />市值",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: false,
  },
  {
    key: "collectionRatio",
    label: "收集<br />比例",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatPercent(value * 100, 2);
    },
    show: false,
  },
  {
    key: "collectionRatioShares",
    label: "收集<br />股数",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: false,
  },
  {
    key: "collectionRatioValue",
    label: "收集<br />市值",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatNum(value, 0);
    },
    show: false,
  },
  {
    key: "cumulativeRatio",
    label: "累计<br />收集",
    formatter: (value: number | undefined) => {
      if (value === undefined || value === 0) return "--";
      return formatPercent(value * 100, 2);
    },
    show: false,
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
  //   key: "theoreticalShares",
  //   label: "理论<br />股数",
  //   formatter: (value: number | undefined) => {
  //     if (value === undefined || value === 0) return "--";
  //     return formatNum(value, 0);
  //   },
  //   show: true,
  // },
  // {
  //   key: "theoreticalValue",
  //   label: "理论<br />市值",
  //   formatter: (value: number | undefined) => {
  //     if (value === undefined || value === 0) return "--";
  //     return formatNum(value, 0);
  //   },
  //   show: true,
  // },
  {
    key: "pe",
    label: "市盈率<br />TTM",
    thClass: "bold red",
    tdClass: "bold red",
    show: true,
  },
  {
    key: "pb",
    label: "市净率",
    thClass: "bold",
    tdClass: "bold",
    show: true,
  },
  // {
  //   key: "",
  //   label: "近3年低价",
  //   thClass: "bold",
  //   tdClass: "bold",
  // },
];
