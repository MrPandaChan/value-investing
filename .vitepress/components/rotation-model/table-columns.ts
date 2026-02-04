import { Stock } from "../../service/stock";

/**
 * 列配置接口
 */
export interface ColumnConfig {
  key: string;
  label: string;
  thClass?: string;
  tdClass?: string;
  getTdClass?: (data: Stock) => string;
  formatter?: (value: any, data: Stock) => string | number;
}

/**
 * 表格列配置
 */
export const tableColumns: ColumnConfig[] = [];
