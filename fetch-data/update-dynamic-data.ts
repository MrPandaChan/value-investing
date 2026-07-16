import axios from "axios";
import { saveJsonToFileAsync } from "./save-data";
import type { DynamicData } from "./types";
import { stocksToTencentCodes } from "./helper";
import * as fs from "fs";
import * as path from "path";
import { stockData } from "../types/stocks";

/**
  if (!codes.length) return [];

  const tencentCodesStr = stocksToTencentCodes(codes);

  const res = await axios.get("https://qt.gtimg.cn/q=", {
    params: {
      q: tencentCodesStr,
      fmt: "json",
    },
  });

  const raw = res.data;

  return codes
    .map((originalCode) => {
      const tcKey = stocksToTencentCodes([originalCode]);
      const item = raw[tcKey];

      if (!item || !Array.isArray(item) || item.length < 40) return null;

      const code: string = item[2] || originalCode;
      const price = parseFloat(item[3]) || 0;
      const marketValue = parseFloat(item[44]) || 0;
      const PB = parseFloat(item[46]) || 0;
      const PE_TTM = parseFloat(item[39]) || 0;
      const totalSharesOutstanding = parseInt(item[72], 10) || 0;

      return {
        code,
        price,
        marketValue,
        PB,
        PE_TTM,
        totalSharesOutstanding,
      };
    })
    .filter(Boolean) as DynamicData[];
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

  // 用腾讯接口一次性获取所有股票的动态数据
  console.log("正在获取所有股票的动态数据...");
  const tencentCodesStr = stocksToTencentCodes(codes);
  const response = await axios.get("https://qt.gtimg.cn/q=", {
    params: {
      q: tencentCodesStr,
      fmt: "json",
    },
  });

  const raw = response.data;

  // 创建代码到动态数据的映射
  const dynamicDataMap = new Map<string, DynamicData>();
  for (const code of codes) {
    const tcKey = stocksToTencentCodes([code]);
    const item = raw[tcKey];
    if (!item || !Array.isArray(item) || item.length < 40) continue;

    const price = parseFloat(item[3]) || 0;
    const dynamicData: DynamicData = {
      code: item[2] || code,
      price,
      marketValue: parseFloat(item[44]) || 0,
      PB: parseFloat(item[46]) || 0,
      PE_TTM: parseFloat(item[39]) || 0,
      totalSharesOutstanding: parseInt(item[72], 10) || 0,
    };
    dynamicDataMap.set(code, dynamicData);
  }

  console.log(`成功获取 ${dynamicDataMap.size} 只股票的动态数据`);

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
