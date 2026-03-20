import type { EastMoneyCashFlowResponse } from "./types";

/**
 * 将股票代码转换为东方财富接口的secId格式
 *
 * @param {string} stockCode - 股票代码（如 600636 或 '000001'）
 */
export function toSECUCODE(stockCode: string) {
  const code = stockCode.trim();

  // 判断市场类型
  if (/^(6|9|688|689)\d+$/.test(code)) {
    // 沪市A股（6/9开头，科创板688/689开头）
    return `${code}.SH`;
  } else if (/^(0|3|2)\d{5}$/.test(code)) {
    // 深市A股（0/3开头，创业板30开头，B股2开头）
    return `${code}.SZ`;
  } else if (/^0\d{4}$/.test(code)) {
    // 港股（假设00开头为港股，需根据实际情况调整）
    return `${code}.HK`;
  } else if (/^[A-Za-z]+$/.test(code)) {
    // 美股（纯字母代码如AAPL）
    return `${code}.US`;
  }

  // 默认返回沪市格式（可根据需求调整）
  return `${code}.SH`;
}

/**
 * 生成 17 位随机数
 */
export const v = () =>
  Math.random().toString().replace(".", "").padEnd(17, "0").slice(0, 17);

/**
 * Date 类型转换成指定格式日期
 *
 * formats 参数可以是
 * 1. Y-m-d
 * 2. Y-m-d H:i:s
 * 3. Y年m月d日
 * 4. Y年m月d日 H时i分
 * 5. ...自定义，总之会把 Y|m|d|H|i|s 替换成相应的时间
 *
 * @static
 * @category date
 * @since 1.0.0
 * @author qiushiming
 * @lastEditors
 *
 * @param {Date} date Date
 * @param {string} [formats = 'Y-m-d'] 转换格式
 * @returns {string} 格式化后的时间
 *
 * @example
 * formatDate(11111111111111, 'Y年m月d日 H时i分')
 * // => '2322年02月06日 03时45分'
 *
 * formatDate(new Date('2020/01/01'), 'Y-m-d')
 * // => '2020-01-01'
 */
export default function formatDate(
  time?: object | string | number | null,
  formats = "Y-m-d",
): string {
  if (time === undefined || !time) {
    return "";
  }
  let date: Date;
  if (typeof time === "object") {
    date = time as Date;
  } else {
    if (typeof time === "string") {
      if (/^[0-9]+$/.test(time)) {
        // support "1616484158427"
        time = parseInt(time);
      } else {
        // support safari
        // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
        time = time.replace(new RegExp(/-/gm), "/");
      }
    }
    if (typeof time === "number" && time.toString().length === 10) {
      time = time * 1000;
    }
    date = new Date(time);
  }

  return formats.replace(/Y|m|d|H|i|s/gi, (matches) => {
    const result: Record<string, number> = {
      Y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      H: date.getHours(),
      i: date.getMinutes(),
      s: date.getSeconds(),
    };
    return result[matches]!.toString().padStart(2, "0");
  });
}

/**
 * 将股票代码转换为东方财富接口的secId格式
 *
 * @param {string} stockCode - 股票代码（如 600636 或 '000001'）
 * @returns {string} 符合secIds格式的字符串（如 '1.600636'）
 */
export function toEastMoneySecId(stockCode: string) {
  const code = stockCode.trim();

  // 判断市场类型
  if (/^(6|9|688|689)\d+$/.test(code)) {
    // 沪市A股（6/9开头，科创板688/689开头）
    return `1.${code}`;
  } else if (/^(0|3|2)\d{5}$/.test(code)) {
    // 深市A股（0/3开头，创业板30开头，B股2开头）
    return `0.${code}`;
  } else if (/^0\d{4}$/.test(code)) {
    // 港股（假设00开头为港股，需根据实际情况调整）
    return `116.${code}`;
  } else if (/^[A-Za-z]+$/.test(code)) {
    // 美股（纯字母代码如AAPL）
    return code.toUpperCase(); // 或返回 `US.${code}` 根据接口要求
  } else if (/CNHHKD$/.test(code)) {
    return code;
  }

  // 默认返回沪市格式（可根据需求调整）
  return `1.${code}`;
}

export function stocksToSecIds(stocks: string[]) {
  return stocks.map((v) => toEastMoneySecId(v)).join(",");
}

export function isHKCode(code: string) {
  return toSECUCODE(code).endsWith(".HK");
}

/**
 * 折旧和摊销
 *
 * @param cashFlow
 * @returns
 */
export function amortize(cashFlow: EastMoneyCashFlowResponse) {
  // 折旧摊销 = 固定资产折旧、油气资产折耗、生产性生物资产折旧 + 使用权资产摊销 + 无形资产摊销 + 长期待摊费用摊销
  const FA_IR_DEPR = cashFlow?.FA_IR_DEPR ?? 0;
  const USERIGHT_ASSET_AMORTIZE = cashFlow?.USERIGHT_ASSET_AMORTIZE ?? 0;
  const IA_AMORTIZE = cashFlow?.IA_AMORTIZE ?? 0;
  const LPE_AMORTIZE = cashFlow?.LPE_AMORTIZE ?? 0;
  return FA_IR_DEPR + USERIGHT_ASSET_AMORTIZE + IA_AMORTIZE + LPE_AMORTIZE;
}

export function formatNum(num: number, fractionDigits = 1) {
  if (fractionDigits < 0) {
    throw new Error("小数位数不能为负数");
  }

  // 处理 NaN 和 Infinity
  if (!Number.isFinite(num)) {
    return num;
  }

  // 转换为字符串再处理可以避免一些浮点数精度问题
  const str = num.toString();
  const decimalIndex = str.indexOf(".");

  if (decimalIndex === -1 || fractionDigits === 0) {
    return Math.round(num);
  }

  const factor = Math.pow(10, fractionDigits);
  return Math.round(num * factor) / factor;
}

// 转换为亿
export function numToAHundredMillion(num: number, fractionDigits = 1): number {
  return formatNum(num / 100000000, fractionDigits);
}

export function formatPercent(value: number, fractionDigits = 2) {
  return typeof value === "number" ? `${value.toFixed(fractionDigits)}%` : "-";
}

/**
 * 计算单笔未来现金流的现值
 * @param futureValue 未来价值
 * @param discountRate 折现率（小数形式，如0.05表示5%）
 * @param periods 期数
 * @returns 现值
 */
export function presentValue(
  futureValue: number,
  discountRate: number,
  periods: number,
): number {
  if (discountRate <= -1) {
    throw new Error("折现率不能小于或等于-100%");
  }
  if (periods < 0) {
    throw new Error("期数不能为负数");
  }

  return futureValue / Math.pow(1 + discountRate, periods);
}

/**
 * 计算年化收益
 */
export function calAnnualizedGrowthRate(
  current: number,
  base: number,
  year: number,
) {
  if (current < 0 || base < 0) {
    // 如果有负数，无法直接计算，因此用总增长率法计算近似的年化收益
    // 总增长率 =  (最终值 - 初始值) / Math.abs(初始值)
    const total = (current - base) / Math.abs(base);
    const val = Math.pow(1 + total, 1 / year) - 1;
    return val;
  }

  const result = Math.pow(current / base, 1 / year) - 1;
  return result;
}

export function getPayVal(str: string) {
  const val = str.replace(/^.*?派(.*?)元.*?/, "$1");
  const result = parseFloat(val);
  return isNaN(result) ? 0 : result / 10;
}
