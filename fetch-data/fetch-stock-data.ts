import axios from "axios";
import { saveJsonToFileAsync } from "./save-data";
import type {
  DynamicData,
  EastMoneyCashFlowResponse,
  EastMoneyData,
  EastMoneyDividendResponse,
  EastMoneyResponseWrap,
  PrimaryBusinessResponseData,
  SinaFinanceData,
  SinaResponse,
} from "./types";
import { isHKCode, stocksToSecIds, toSECUCODE, v } from "./helper";
import { stockData, type StockItem } from "../types";
/**
 * 获取股票数据
 */

const SINA_URL =
  "https://quotes.sina.cn/cn/api/openapi.php/CompanyFinanceService.getFinanceReport2022";

export const FINANCE_URL =
  "https://datacenter.eastmoney.com/securities/api/data/get";
export const FINANCE_URL_V1 =
  "https://datacenter.eastmoney.com/securities/api/data/v1/get";

/**
 * 关键指标
 */
async function getGjzb(paperCode: string) {
  const res = await axios.get<SinaResponse>(SINA_URL, {
    params: {
      paperCode,
      source: "gjzb",
      type: 0,
      page: 1,
      num: 500,
    },
  });
  if (res.data.result.status.code === 0) {
    return res.data.result.data;
  }
  return null;
}

/**
 * 资产负债表
 * type 0 1 2 3 4 分别表示，按报告期，一季报，半年报，三季报，年报
 */
async function getFzb(paperCode: string) {
  const res = await axios.get<SinaResponse>(SINA_URL, {
    params: {
      paperCode,
      source: "fzb",
      type: 0,
      page: 1,
      num: 500,
    },
  });
  if (res.data.result.status.code === 0) {
    return res.data.result.data;
  }
  return null;
}

/**
 * 利润表
 * type 0 1 2 3 4 分别表示，按报告期，一季报，半年报，三季报，年报
 */
async function getLrb(paperCode: string) {
  const res = await axios.get<SinaResponse>(SINA_URL, {
    params: {
      paperCode,
      source: "lrb",
      type: 0,
      page: 1,
      num: 500,
    },
  });
  if (res.data.result.status.code === 0) {
    return res.data.result.data;
  }
  return null;
}

/**
 * 资产负债表
 * type 0 1 2 3 4 分别表示，按报告期，一季报，半年报，三季报，年报
 */
async function getLlb(paperCode: string) {
  const res = await axios.get<SinaResponse>(SINA_URL, {
    params: {
      paperCode,
      source: "llb",
      type: 0,
      page: 1,
      num: 500,
    },
  });
  if (res.data.result.status.code === 0) {
    return res.data.result.data;
  }
  return null;
}

interface DynamicDataResponse {
  f2: number;
  f9: number;
  f12: string;
  f18: number;
  f14: string;
  f20: number;
  f23: number;
  f38: number;
  f100: string;
}

// f12  # 代码
// f14  # 名称
// f2   # 股价
// f9   # 动态市盈率
// f23  # 市净率
// f20  # 总市值
// f38  # 总股本
// f100 # 行业
// secids=AAPL,TSLA
// secids=116.00700,1.06855  // 腾讯控股（00700.HK）、亚盛医药（06855.HK）
//（部分接口可能简化为 1.00700 或 116.00700）
// secids=0.000001  // 平安银行（000001.SZ）
// secids=1.600519  // 贵州茅台（600519.SH）
// secids=1.600519,0.000001,116.00700,AAPL
export async function getDynamicData(codes: string[]): Promise<DynamicData[]> {
  const secids = stocksToSecIds(codes);

  const res = await axios.get(
    "https://push2.eastmoney.com/api/qt/ulist.np/get",
    {
      params: {
        fields: "f12,f14,f2,f9,f23,f18,f20,f38",
        secids,
        v: v(),
      },
    },
  );

  return res.data.data.diff.map((v: DynamicDataResponse) => {
    // 股票停牌的时候 f2 会返回 0，因此取 f18 替代
    const price = v.f2 > 0 ? v.f2 : v.f18;
    return {
      price: isHKCode(v.f12) ? price / 1000 : price / 100,
      marketValue: v.f20,
      PB: v.f23 / 100,
      PE: v.f9 / 100,
      totalSharesOutstanding: v.f38,
    };
  });
}

/**
 * 主营业务
 */
async function getPrimaryBusinessData(
  code: string,
): Promise<PrimaryBusinessResponseData[] | null> {
  const SECUCODE = toSECUCODE(code);
  const res = await axios.get<
    EastMoneyResponseWrap<PrimaryBusinessResponseData>
  >(FINANCE_URL_V1, {
    params: {
      reportName: "RPT_F10_FN_MAINOP",
      // 如果要全部数据可以传 ALL
      columns:
        "SECUCODE,SECURITY_CODE,REPORT_DATE,MAINOP_TYPE,ITEM_NAME,MAIN_BUSINESS_INCOME,MBI_RATIO,MAIN_BUSINESS_COST,MBC_RATIO,MAIN_BUSINESS_RPOFIT,MBR_RATIO,GROSS_RPOFIT_RATIO,RANK",
      quoteColumns: "",
      filter: `(SECUCODE="${SECUCODE}")`,
      pageNumber: 1,
      pageSize: 1000,
      sortTypes: "1,1",
      sortColumns: "MAINOP_TYPE,RANK",
      source: "HSF10",
      client: "PC",
      v: v(),
    },
  });
  if (res.data.success) {
    return res.data.result.data.sort((a, b) => {
      // 假设报告期格式为 "YYYY-MM-DD" 或类似可比较的字符串格式
      return b.REPORT_DATE.localeCompare(a.REPORT_DATE);
    });
  }
  return null;
}

/**
 * 东方财富的现金流量表
 */
async function getCashflow(
  code: string,
): Promise<EastMoneyCashFlowResponse[] | null> {
  const SECUCODE = toSECUCODE(code);
  const res = await axios.get<EastMoneyResponseWrap<EastMoneyCashFlowResponse>>(
    FINANCE_URL,
    {
      params: {
        type: "RPT_F10_FINANCE_GCASHFLOW",
        sty: "APP_F10_GCASHFLOW",
        filter: `(SECUCODE="${SECUCODE}")`,
        p: 1,
        ps: 200,
        sr: -1,
        st: "REPORT_DATE",
        source: "HFS10",
        client: "PC",
        v: v(),
      },
    },
  );
  if (res.data.success) {
    return res.data.result.data
      .sort((a, b) => {
        // 假设报告期格式为 "YYYY-MM-DD" 或类似可比较的字符串格式
        return b.REPORT_DATE.localeCompare(a.REPORT_DATE);
      })
      .map((v) => ({
        REPORT_DATE: v.REPORT_DATE, // "2025-03-31 00:00:00"
        FA_IR_DEPR: v.FA_IR_DEPR, // 补充资料-固定资产和投资性房地产折旧
        FA_IR_DEPR_YOY: v.FA_IR_DEPR_YOY,
        USERIGHT_ASSET_AMORTIZE: v.USERIGHT_ASSET_AMORTIZE, // 使用权资产折旧
        USERIGHT_ASSET_AMORTIZE_YOY: v.USERIGHT_ASSET_AMORTIZE_YOY,
        IA_AMORTIZE: v.IA_AMORTIZE, // 补充资料-无形资产摊销
        IA_AMORTIZE_YOY: v.IA_AMORTIZE_YOY,
        LPE_AMORTIZE: v.LPE_AMORTIZE, // 补充资料-长期待摊费用摊销
        LPE_AMORTIZE_YOY: v.LPE_AMORTIZE_YOY,
      }));
  }
  return null;
}

/**
 * 东方财富分红
 */
async function getDividend(
  code: string,
): Promise<EastMoneyDividendResponse[] | null> {
  const SECUCODE = toSECUCODE(code);
  const res = await axios.get<EastMoneyResponseWrap<EastMoneyDividendResponse>>(
    FINANCE_URL_V1,
    {
      params: {
        reportName: "RPT_F10_DIVIDEND_MAIN",
        columns: "ALL",
        quoteColumns: "",
        filter: `(SECUCODE="${SECUCODE}")`,
        pageNumber: 1,
        pageSize: 1000,
        sortTypes: -1,
        sortColumns: "NOTICE_DATE",
        source: "HSF10",
        client: "PC",
        v: v(),
      },
    },
  );
  if (res.data.success) {
    return res.data.result.data;
  }
  return null;
}

/**
 * 获取人民币和港币汇率
 */
export async function getExchangeRate() {
  const res = await axios.get(
    "https://push2.eastmoney.com/api/qt/ulist.np/get",
    {
      params: {
        fields: "f2",
        secids: "133.CNHHKD",
        v: v(),
      },
    },
  );
  return res.data.data.diff[0].f2 / 10000;
}

async function fetchAStockData(stockItem: StockItem) {
  const code = stockItem.code;

  const res = await Promise.all([
    getGjzb(code),
    getFzb(code),
    getLrb(code),
    getLlb(code),
    getPrimaryBusinessData(code),
    getCashflow(code),
    getDynamicData([code]),
    getDividend(code),
  ]);

  if (res.some((v) => v === null)) {
    console.log("存在 null 的数据");
  }

  const [
    gjzb,
    fzb,
    lrb,
    llb,
    primaryBusiness,
    eastMoneyCashFlow,
    dynamicData,
    dividendData,
  ] = res;

  const sinData: SinaFinanceData = {
    gjzb,
    fzb,
    lrb,
    llb,
  } as SinaFinanceData;

  const eastMoneyData: EastMoneyData = {
    primaryBusiness,
    eastMoneyCashFlow: eastMoneyCashFlow ?? [],
    dynamicData: dynamicData[0],
    dividendData,
  } as EastMoneyData;

  const data = {
    ...sinData,
    ...eastMoneyData,
  };

  await saveJsonToFileAsync(data, `./data/${code}.json`)
    .then((result) => console.log(`异步保存${result ? "成功" : "失败"}`))
    .catch((err) => console.error("异步保存出错:", err));
}

const sleep = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
};

export async function main() {
  // 检查是否有 -f 参数
  const forceUpdate = process.argv.includes("-f");

  for (let i = 0; i < stockData.length; i += 1) {
    const stock = stockData[i];
    if (!stock) {
      continue;
    }

    // 检查是否已经存在对应的数据文件
    const fs = require("fs");
    const path = require("path");
    const dataFilePath = path.join(
      __dirname,
      "..",
      "data",
      `${stock.code}.json`,
    );

    // 如果不是强制更新且文件已存在，则跳过
    if (!forceUpdate && fs.existsSync(dataFilePath)) {
      console.log(`数据文件 ${stock.code}.json 已存在，跳过更新`);
      continue;
    }

    console.log(`正在获取 ${stock.name}(${stock.code}) 的数据...`);
    if (i > 0) {
      await sleep(5000);
    }
    await fetchAStockData(stock);
    console.log(`获取 ${stock.name}(${stock.code}) 数据成功`);
  }

  console.log("数据更新完成！");
}
