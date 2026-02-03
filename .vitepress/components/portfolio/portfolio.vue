<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";
import {
  getDynamicData,
  getExchangeRate,
} from "../../../fetch-data/fetch-stock-data";
import { formatNum, formatPercent } from "../../../fetch-data/helper";
import { data } from "../../service/data";

const props = withDefaults(
  defineProps<{
    currentValue?: boolean; // 当前股价模式
  }>(),
  {
    currentValue: false,
  },
);

interface BasicItem {
  code: string;
  hkCode?: string;
  name: string;
  industry: string; // 行业
  costBasis: number; // 持有成本
  sharesHeld: number; // 持有股数
  dividendTaxRatio: number; // 股息税率
}

interface StockItem extends BasicItem {
  shareholdingValue: number; // 持有市值
  shareholdingRatio: number; // 持股比例
  industryRatio: number;
  rowspan: number;
  dps: number; // 每股分红
  eps: number; // 每股净利润
  dividend: number; // 股息
  dividendTax: number; // 股息税
  netDividend: number; // 税后股息
  dividendRate: number; // 股息率
  holdingNetProfit: number; // 持有净利润
  retainedNetProfit: number; // 公司留存部分
  paybackPeriod: number; // 当前利润回本年数
}

interface portfolio {
  stocks: StockItem[];
  sumShareHoldingValue: number; // 组合总成本
  sumDividendTax: number; // 股息扣税总额
  sumNetDividend: number; // 股息总额
  sumDividendRate: number; // 股息率
  sumHoldingNetProfit: number; // 持有净利润总额
  sumRetainedNetProfit: number; // 公司留存部分总额
  sumRetainedNetProfitRate: number; // 公司留存率
  sumPaybackPeriod: number; // 组合利润回本年数
  sumDividendTaxRate: number; // 股息税率
  sumHoldingNetProfitMargin: number; // 持有净利润率
  perspectiveSurplus: number; // 透视盈余
  perspectiveSurplusRate: number; // 透视盈余收益率
}

const basicStocks = ref<BasicItem[]>([
  {
    code: "000858",
    name: "五粮液",
    industry: "白酒",
    costBasis: 117.9088,
    sharesHeld: 500,
    dividendTaxRatio: 0,
  },
  {
    code: "000651",
    name: "格力电器",
    industry: "白色家电",
    costBasis: 41.02,
    sharesHeld: 800,
    dividendTaxRatio: 0,
  },
  {
    code: "002594",
    name: "比亚迪",
    industry: "乘用车",
    costBasis: 99.86,
    sharesHeld: 200,
    dividendTaxRatio: 0,
  },
  {
    code: "000596",
    hkCode: "200596",
    industry: "白酒",
    name: "古井贡B",
    costBasis: 83,
    sharesHeld: 700,
    dividendTaxRatio: 0,
  },
  {
    code: "600938",
    hkCode: "00883",
    name: "中国海洋石油H",
    industry: "能源",
    // costBasis: 18.436, // 16.8898
    costBasis: 16.4654,
    sharesHeld: 1000,
    dividendTaxRatio: 0.28,
  },
  {
    code: "600900",
    name: "长江电力",
    industry: "电力",
    costBasis: 27.1961,
    sharesHeld: 1200,
    dividendTaxRatio: 0,
  },
  {
    code: "601919",
    hkCode: "01919",
    name: "中远海控H",
    industry: "航运",
    // costBasis: 12.091, // 11.0769
    costBasis: 11.1144,
    sharesHeld: 1000,
    dividendTaxRatio: 0.2,
  },
  {
    code: "600886",
    name: "国投电力",
    industry: "电力",
    costBasis: 13.4289,
    sharesHeld: 800,
    dividendTaxRatio: 0,
  },
  {
    code: "600690",
    name: "海尔智家",
    industry: "白色家电",
    costBasis: 24.7536,
    sharesHeld: 400,
    dividendTaxRatio: 0,
  },
  {
    code: "601088",
    name: "中国神华",
    industry: "能源",
    costBasis: 25.927,
    sharesHeld: 100,
    dividendTaxRatio: 0,
  },
  {
    code: "601919",
    name: "中远海控",
    industry: "航运",
    costBasis: 14.775,
    sharesHeld: 200,
    dividendTaxRatio: 0,
  },
  {
    code: "600941",
    name: "中国移动",
    industry: "电信运营商",
    costBasis: 99.311,
    sharesHeld: 500,
    dividendTaxRatio: 0,
  },
  {
    code: "601298",
    hkCode: "06198",
    name: "青岛港H",
    industry: "港口",
    costBasis: 6.3292,
    sharesHeld: 1000,
    dividendTaxRatio: 0.2,
  },
  {
    code: "600036",
    name: "招商银行",
    industry: "银行",
    costBasis: 38.1121,
    sharesHeld: 600,
    dividendTaxRatio: 0,
  },
]);

const useCurrentValue = async () => {
  const codes = basicStocks.value.map((v) => (v.hkCode ? v.hkCode : v.code));
  const arr = await getDynamicData(codes);
  const exchangeRate = await getExchangeRate();

  for (let i = 0; i < basicStocks.value.length; i += 1) {
    const item = basicStocks.value[i];
    if (item.hkCode) {
      // H 股的价格转换为 A 股的价格
      item.costBasis = arr[i].price / exchangeRate;
    } else {
      item.costBasis = arr[i].price;
    }
  }
};

const aCash = 321000;
const bCash = 916.89;
const cash = 240532.79;

let total = ref(0);

const calculateCash = async () => {
  const exchangeRate = await getExchangeRate();

  total.value = aCash + bCash / exchangeRate + cash;
};

// const calHkPrice = async () => {
//   const exchangeRate = await getExchangeRate();

//   for (let i = 0; i < basicStocks.value.length; i += 1) {
//     const item = basicStocks.value[i];
//     if (item.hkCode) {
//       item.costBasis = item.costBasis / exchangeRate;
//     }
//   }
// };

onBeforeMount(() => {
  calculateCash();
  if (props.currentValue) {
    useCurrentValue();
  }
  // else {
  //   calHkPrice();
  // }
});

const portfolio = computed<portfolio>(() => {
  const sumShareHoldingValue = basicStocks.value.reduce((pre, cur) => {
    const value = cur.costBasis * cur.sharesHeld;
    return pre + value;
  }, 0);

  const sortedStocks: Omit<StockItem, "industryRatio" | "rowspan">[] =
    basicStocks.value
      .map((v) => {
        const { valuationData, dynamicData, recentYearData } = data[v.code];
        const lastValuationHistoryData =
          valuationData.historyData[valuationData.historyData.length - 1];
        // 每股分红
        const dps =
          lastValuationHistoryData.totalDividend /
          dynamicData.totalSharesOutstanding;

        const shareholdingValue = v.costBasis * v.sharesHeld;
        const eps =
          recentYearData.netProfit / dynamicData.totalSharesOutstanding;

        const dividend = dps * v.sharesHeld;
        const dividendTax = dividend * v.dividendTaxRatio;
        const netDividend = dividend - dividendTax;
        const dividendRate = netDividend / shareholdingValue;
        const holdingNetProfit = eps * v.sharesHeld;
        const retainedNetProfit = holdingNetProfit - dividend;
        const paybackPeriod = v.costBasis / eps;

        return {
          ...v,
          shareholdingValue,
          shareholdingRatio: shareholdingValue / sumShareHoldingValue,
          dps,
          eps,
          dividend,
          dividendTax,
          netDividend,
          dividendRate,
          holdingNetProfit,
          retainedNetProfit,
          paybackPeriod,
        };
      })
      .sort((a, b) => b.shareholdingValue - a.shareholdingValue);

  const industryMap = new Map<
    string,
    Omit<StockItem, "industryRatio" | "rowspan">[]
  >();
  for (const stock of sortedStocks) {
    const exist = industryMap.get(stock.industry);
    if (exist) {
      exist.push(stock);
    } else {
      industryMap.set(stock.industry, [stock]);
    }
  }
  const stocks: StockItem[] = [];
  for (const arr of Array.from(industryMap.values())) {
    const total = arr.reduce((pre, cur) => pre + cur.shareholdingValue, 0);
    stocks.push(
      ...arr.map((v, i) => {
        return {
          ...v,
          rowspan: i === 0 ? arr.length : 0,
          industryRatio: total / sumShareHoldingValue,
        };
      }),
    );
  }

  let sumNetDividend = 0;
  let sumDividendTax = 0;
  let sumHoldingNetProfit = 0;
  let sumRetainedNetProfit = 0;

  for (const stock of stocks) {
    sumDividendTax += stock.dividendTax;
    sumNetDividend += stock.netDividend;
    sumHoldingNetProfit += stock.holdingNetProfit;
    sumRetainedNetProfit += stock.retainedNetProfit;
  }

  const sumDividendRate = sumNetDividend / sumShareHoldingValue;
  const sumPaybackPeriod = sumShareHoldingValue / sumHoldingNetProfit;

  const sumDividendTaxRate = sumDividendTax / sumShareHoldingValue;
  const sumHoldingNetProfitMargin = sumHoldingNetProfit / sumShareHoldingValue;
  const sumRetainedNetProfitRate = sumRetainedNetProfit / sumShareHoldingValue;

  // 透视盈余 = 持股总收益 - 分红时所得税
  const perspectiveSurplus = sumHoldingNetProfit - sumDividendTax;
  const perspectiveSurplusRate = perspectiveSurplus / sumShareHoldingValue;

  return {
    stocks,
    sumShareHoldingValue,
    sumDividendTax,
    sumNetDividend,
    sumDividendRate,
    sumHoldingNetProfit,
    sumRetainedNetProfit,
    sumPaybackPeriod,
    sumDividendTaxRate,
    sumHoldingNetProfitMargin,
    perspectiveSurplus,
    perspectiveSurplusRate,
    sumRetainedNetProfitRate,
  };
});
</script>

<template>
  <div class="portfolio-container">
    <section>
      <table class="valuation-table">
        <caption>
          {{
            props.currentValue ? "当前股价" : ""
          }}持仓组合透视盈余
        </caption>
        <thead>
          <tr>
            <th>序列号</th>
            <th>持股公司</th>
            <th>{{ props.currentValue ? "当前股价" : "持仓成本" }}</th>
            <th>持有股数</th>
            <th>持仓金额</th>
            <th>持股比例</th>
            <th>行业</th>
            <th>行业比例</th>
            <th>预计分红</th>
            <th>每股净利润</th>
            <th>股息率</th>
            <th>股息扣税</th>
            <th>扣税后股息</th>
            <th>持有净利润</th>
            <th>公司留存部分</th>
            <th>净利润回本年数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in portfolio.stocks" :keys="i">
            <td>{{ i + 1 }}</td>
            <td class="bold-td">{{ item.name }}</td>
            <td class="bold-td cost-basis">
              ￥{{ formatNum(item.costBasis, 3) }}
            </td>
            <td class="bold-td">{{ item.sharesHeld }}</td>
            <td>{{ formatNum(item.shareholdingValue, 2) }}</td>
            <td class="bold-td">
              {{ formatPercent(item.shareholdingRatio * 100) }}
            </td>
            <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold-td">
              {{ item.industry }}
            </td>
            <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold-td">
              {{ formatPercent(item.industryRatio * 100) }}
            </td>
            <td class="dps">{{ formatNum(item.dps, 2).toFixed(2) }}</td>
            <td class="eps">{{ formatNum(item.eps, 2).toFixed(2) }}</td>
            <td>{{ formatPercent(item.dividendRate * 100) }}</td>
            <td>{{ formatNum(item.dividendTax, 2).toFixed(2) }}</td>
            <td>{{ formatNum(item.netDividend, 2).toFixed(2) }}</td>
            <td>{{ formatNum(item.holdingNetProfit, 2).toFixed(2) }}</td>
            <td>{{ formatNum(item.retainedNetProfit, 2).toFixed(2) }}</td>
            <td>{{ formatNum(item.paybackPeriod, 2).toFixed(2) }}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td class="bold-td">组合总市值</td>
            <td>
              {{ formatNum(portfolio.sumShareHoldingValue, 2).toFixed(2) }}
            </td>
            <td>100.00%</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="bold-td">
              {{ formatNum(portfolio.sumDividendTax, 2).toFixed(2) }}
            </td>
            <td class="bold-td sum-net-dividend">
              {{ formatNum(portfolio.sumNetDividend, 2).toFixed(2) }}
            </td>
            <td class="bold-td sum-holding-net-profit">
              {{ formatNum(portfolio.sumHoldingNetProfit, 2).toFixed(2) }}
            </td>
            <td class="bold-td">
              {{ formatNum(portfolio.sumRetainedNetProfit, 2).toFixed(2) }}
            </td>
            <td class="bold-td">
              {{ formatNum(portfolio.sumPaybackPeriod, 2).toFixed(2) }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              {{ formatPercent(portfolio.sumDividendTaxRate * 100) }}
            </td>
            <td class="sum-dividend-rate">
              {{ formatPercent(portfolio.sumDividendRate * 100) }}
            </td>
            <td class="sum-holding-net-profit-margin">
              {{ formatPercent(portfolio.sumHoldingNetProfitMargin * 100) }}
            </td>
            <td>
              {{ formatPercent(portfolio.sumRetainedNetProfitRate * 100) }}
            </td>
            <td></td>
          </tr>
          <tr class="bold-tr">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>股息税率</td>
            <td class="sum-dividend-rate">组合股息率</td>
            <td class="sum-holding-net-profit-margin">总收益率</td>
            <td>公司留存率</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <footer class="portfolio-footer">
        <table class="valuation-table surplus-table">
          <tbody>
            <tr>
              <td>A股可用</td>
              <td>￥{{ aCash }}</td>
            </tr>
            <tr>
              <td>B股可用</td>
              <td>HK${{ bCash }}</td>
            </tr>
            <tr>
              <td>现金</td>
              <td>￥{{ cash }}</td>
            </tr>
            <tr>
              <td>可用合计</td>
              <td>￥{{ total.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <table class="valuation-table surplus-table">
          <tbody>
            <tr>
              <td>透视盈余</td>
              <td>{{ formatNum(portfolio.perspectiveSurplus, 2) }}</td>
            </tr>
            <tr>
              <td>透视盈余收益率</td>
              <td>
                {{ formatPercent(portfolio.perspectiveSurplusRate * 100) }}
              </td>
            </tr>
          </tbody>
        </table>
      </footer>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.portfolio-container {
  .cost-basis {
    color: #ff0000;
  }

  .dps {
    background-color: #ffcac8;
  }

  .eps {
    background-color: #9adeff;
  }

  .sum-net-dividend {
    // background-color: #ff0000;
    background-color: #ffcac8;
  }

  .sum-holding-net-profit {
    // background-color: #ff0000;
    background-color: #9adeff;
  }

  .sum-dividend-rate {
    background-color: #ffcac8;
  }

  .sum-holding-net-profit-margin {
    background-color: #9adeff;
  }

  .surplus-table {
    td {
      font-weight: bold;
      background-color: #f88920;
    }

    + .surplus-table {
      margin-left: 24px;
    }
  }
}

.portfolio-footer {
  display: flex;
  justify-content: flex-start;
}
</style>
