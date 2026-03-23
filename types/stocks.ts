import { type StockItem } from "./index";
import { chineseSpiritsStockData } from "./stocks/chinese-spirits";
import { homeApplianceStockData } from "./stocks/home-appliance";
import { carStockData } from "./stocks/car";
import { electricityStockData } from "./stocks/electricity";
import { coalStockData } from "./stocks/coal";
import { operatorStockData } from "./stocks/operator";
import { oilStockData } from "./stocks/oil";
import { portStockData } from "./stocks/port";
import { chineseMedicineStockData } from "./stocks/chinese-medicine";
import { pesticideStockData } from "./stocks/pesticide";
import { dairyStockData } from "./stocks/dairy";
import { bankStockData } from "./stocks/bank";
import { chemicalsStockData } from "./stocks/chemicals";
import { nonferrousMetalsStockData } from "./stocks/nonferrous-metals";
import { otherStockData } from "./stocks/other";
import { internetStockData } from "./stocks/internet";

export const stockData: StockItem[] = [
  ...bankStockData,
  ...carStockData,
  ...chemicalsStockData,
  ...chineseMedicineStockData,
  ...chineseSpiritsStockData,
  ...coalStockData,
  ...dairyStockData,
  ...electricityStockData,
  ...homeApplianceStockData,
  ...internetStockData,
  ...nonferrousMetalsStockData,
  ...oilStockData,
  ...operatorStockData,
  ...otherStockData,
  ...pesticideStockData,
  ...portStockData,
];

(function validate() {
  const map: Record<string, number> = {};
  for (const item of stockData) {
    const val = map[item.code];
    if (typeof val === "number") {
      map[item.code] = val + 1;
      console.warn(`存在重复的 code：${item.code}_${item.name}`);
    } else {
      map[item.code] = 1;
    }
  }
})();

export const getStockItem = (code: string) => {
  const item = stockData.find((v) => v.code === code);
  if (!item) {
    console.log(`cannot find ${code}.`);
  }

  return item!;
};
