import axios from "axios";
import { saveJsonToFileAsync } from "./save-data";
import type { DynamicData } from "./types";
import { stocksToSecIds, v, isHKCode } from "./helper";
import * as fs from "fs";
import * as path from "path";
import { stockData } from "../types/stocks";

/**
 * 动态数据响应接口
 */
interface DynamicDataResponse {
  f2: number;
  f3: number;
  f9: number;
  f12: string;
  f18: number;
  f14: string;
  f20: number;
  f23: number;
  f38: number;
  f100: string;
  f115: number;
}

// f12  # 代码
// f3   # 涨跌幅
// f14  # 名称
// f2   # 股价
// f9   # 动态市盈率
// f14  # 名称
// f18  # 昨日收盘价
// f23  # 市净率
// f20  # 总市值
// f37  # 净资产收益率(加权)
// f38  # 总股本
// f100 # 行业
// f115 # 市盈率TTM(如果是港股，这个是昨日收盘价计算的PETTM，如果是A股，这个是实时的PETTM)
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
        fields: "f3,f12,f14,f2,f9,f23,f18,f20,f38,f115",
        secids,
        v: v(),
      },
    },
  );

  return res.data.data.diff.map((v: DynamicDataResponse) => {
    // 股票停牌的时候 f2 会返回 0，因此取 f18 替代
    const price = v.f2 > 0 ? v.f2 : v.f18;
    const change = v.f3 / 100;
    return {
      code: v.f12,
      name: v.f14,
      change,
      price: isHKCode(v.f12) ? price / 1000 : price / 100,
      marketValue: v.f20,
      PB: v.f23 / 100,
      PE_TTM: v.f115 / 100,
      totalSharesOutstanding: v.f38,
    };
  });
}

/**
 * 读取数据文件并更新dynamicData字段
 */
async function updateDynamicDataForStock(
  code: string,
  dynamicDataMap: Map<string, DynamicData>,
) {
  const dataFilePath = path.join(__dirname, "..", "data", `${code}.json`);

  // 检查文件是否存在
  if (!fs.existsSync(dataFilePath)) {
    console.log(`数据文件 ${code}.json 不存在，跳过更新`);
    return;
  }

  // 读取现有数据
  let stockData;
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    stockData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`读取 ${code}.json 文件出错:`, error);
    return;
  }

  // 从映射中获取动态数据
  const dynamicData = dynamicDataMap.get(code);
  if (!dynamicData) {
    console.log(`未获取到 ${code} 的动态数据`);
    return;
  }

  // 更新dynamicData字段
  stockData.dynamicData = dynamicData;

  // 保存更新后的数据
  await saveJsonToFileAsync(stockData, `./data/${code}.json`);
  console.log(`更新 ${code} 的动态数据成功`);
}

/**
 * 主函数：更新所有股票的动态数据
 */
export async function main() {
  console.log("开始更新动态数据...");

  // 获取所有股票代码
  const codes = stockData.map((stock) => stock.code);

  // 一次性获取所有股票的动态数据
  console.log("正在获取所有股票的动态数据...");
  const response = await axios.get(
    "https://push2.eastmoney.com/api/qt/ulist.np/get",
    {
      params: {
        fields: "f12,f14,f2,f9,f23,f18,f20,f38,f115",
        secids: stocksToSecIds(codes),
        v: v(),
      },
    },
  );

  // 创建代码到动态数据的映射
  const dynamicDataMap = new Map<string, DynamicData>();
  response.data.data.diff.forEach((v: DynamicDataResponse) => {
    const price = v.f2 > 0 ? v.f2 : v.f18;
    const dynamicData: DynamicData = {
      code: v.f12,
      price: isHKCode(v.f12) ? price / 1000 : price / 100,
      marketValue: v.f20,
      PB: v.f23 / 100,
      PE_TTM: v.f115 / 100,
      totalSharesOutstanding: v.f38,
    };
    dynamicDataMap.set(v.f12, dynamicData);
  });

  console.log(`成功获取 ${response.data.data.diff.length} 只股票的动态数据`);

  // 批量更新所有股票文件
  for (const code of codes) {
    console.log(`正在更新 ${code} 的动态数据...`);
    await updateDynamicDataForStock(code, dynamicDataMap);
  }

  console.log("动态数据更新完成！");
}

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
  main().catch(console.error);
}
