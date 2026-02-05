import { formatNum, formatPercent } from "../../../fetch-data/helper";
import { Stock } from "../../service/stock";

/**
 * 列配置接口
 */
export interface ColumnConfig {
  key: keyof Stock;
  label: string;
  thClass?: string;
  tdClass?: string;
  getTdClass?: (data: Stock) => string;
  formatter?: (value: any, data: Stock) => string | number;
}

/**
 * 表格列配置
 */
export const tableColumns: ColumnConfig[] = [
  {
    key: "waitYears",
    label: "多等年数",
    thClass: "bold bg-green",
    tdClass: "bold bg-green",
  },
  {
    key: "longTermAverageReturnYield",
    label: "当前期望收益",
    thClass: "bold orange",
    tdClass: "bold orange",
    formatter: (value: number) => formatPercent(value * 100),
  },
  {
    key: "dividendYield",
    label: "当前股息",
    thClass: "bold bg-pink red",
    tdClass: "bold bg-pink red",
    formatter: (value: number) => formatPercent(value * 100),
  },
  {
    key: "dividendPayoutRatio",
    label: "分红率",
    thClass: "grey",
    tdClass: "grey",
    formatter: (value: number) => formatPercent(value * 100),
  },
  {
    key: "name",
    label: "公司名称",
    thClass: "bold light-blue",
    tdClass: "bold light-blue",
  },
  {
    key: "loseYield",
    label: "买入立刻亏损",
    thClass: "bold bg-green",
    tdClass: "bold bg-green",
    formatter: (value: number) => formatPercent(value),
  },
  {
    key: "anchor",
    label: "10%预期",
    thClass: "bold red",
    tdClass: "bold red",
    formatter: (value: number) => formatNum(value, 2),
  },
  {
    key: "price",
    label: "当前股价",
    thClass: "blue",
    tdClass: "blue",
    formatter: (value: number) => formatNum(value, 2).toFixed(2),
  },
  // {
  //   key: "",
  //   label: "近3年低价",
  //   thClass: "bold",
  //   tdClass: "bold",
  // },
];
