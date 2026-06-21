<script lang="ts" setup>
import { computed, onMounted } from "vue";
import {
  formatNum,
  formatPercent,
  canConvertToCNY,
} from "../../../fetch-data/helper";
import { stocks } from "../../my-data/stock-pool";
import { useStockPoolData } from "./use-stock-pool-data";

const { tableData, groupMetaMap, exchangeRate, refresh } = useStockPoolData();

interface PortfolioRow {
  index: number;
  name: string;
  code: string;
  sharesHeld: number;
  holdingValue: number; // 持有金额（人民币）
  shareholdingRatio: number; // 持股比例
  industry: string;
  industryRatio: number; // 行业比例
  expectedDividend: number; // 预计分红（人民币，调整前）
  dividendRate: number; // 股息率（扣税后）
  dividendTax: number; // 股息扣税（人民币，基于 dividendAdjust）
  netDividend: number; // 扣税后股息（人民币，调整后）
  peTtm: number;
  rowspan: number;
}

/** 格式化扣税金额：扣掉（正数）显示 -，增加（负数）显示 +，零显示 - */
function formatTax(tax: number): string {
  if (tax === 0 || Math.abs(tax) < 0.005) return "-";
  const abs = formatNum(Math.abs(tax), 2).toFixed(2);
  return tax > 0 ? `-${abs}` : `+${abs}`;
}

const portfolioData = computed<PortfolioRow[]>(() => {
  // 仅包含有持有股数且有可用元数据的股票
  const heldStocks = stocks.filter(
    (s) => s.sharesHeld && s.sharesHeld > 0 && groupMetaMap.value[s.code],
  );

  if (!heldStocks.length) return [];

  // 计算每只股票的指标
  const items = heldStocks.map((s) => {
    const meta = groupMetaMap.value[s.code]!;
    const nameRow = tableData.value.find((r) => r.code === s.code);
    const name = nameRow?.name || s.code;
    const sharesHeld = s.sharesHeld!;
    const price = meta.realPrice;

    // 持有金额（转为人民币）
    const rawHoldingValue = sharesHeld * price;
    const holdingValue = canConvertToCNY(s.code)
      ? rawHoldingValue / exchangeRate.value
      : rawHoldingValue;

    // 预计分红 = 原始分红 dps * sharesHeld（转为人民币）
    const rawExpectedDividend = meta.dps * sharesHeld;
    const expectedDividend = canConvertToCNY(s.code)
      ? rawExpectedDividend / exchangeRate.value
      : rawExpectedDividend;

    // 扣税后股息 = 调整后分红 effectiveDps * sharesHeld（转为人民币）
    const rawNetDividend = meta.effectiveDps * sharesHeld;
    const netDividend = canConvertToCNY(s.code)
      ? rawNetDividend / exchangeRate.value
      : rawNetDividend;

    // 股息扣税 = 预计分红 - 扣税后股息（基于 dividendAdjust）
    // dividendAdjust < 1 时为正数（扣税），> 1 时为负数（增长抵消扣税）
    const dividendTax = expectedDividend - netDividend;
    const dividendRate = holdingValue > 0 ? netDividend / holdingValue : 0;

    return {
      name,
      code: s.code,
      sharesHeld,
      holdingValue,
      shareholdingRatio: 0,
      expectedDividend,
      dividendRate,
      dividendTax,
      netDividend,
      peTtm: meta.pricePE,
      industry: s.industry,
    };
  });

  // 组合总市值
  const totalHoldingValue = items.reduce((sum, i) => sum + i.holdingValue, 0);

  // 持股比例
  items.forEach((i) => {
    i.shareholdingRatio = i.holdingValue / totalHoldingValue;
  });

  // 按持有金额降序排列
  items.sort((a, b) => b.holdingValue - a.holdingValue);

  // 按行业分组（保留排序顺序，行业按最大持仓排序）
  const industryMap = new Map<string, typeof items>();
  for (const item of items) {
    const arr = industryMap.get(item.industry) || [];
    arr.push(item);
    industryMap.set(item.industry, arr);
  }

  // 构建结果，计算行业比例和 rowspan
  const result: PortfolioRow[] = [];
  let idx = 1;
  for (const [, arr] of industryMap) {
    const industryTotal = arr.reduce((sum, i) => sum + i.holdingValue, 0);
    const industryRatio = industryTotal / totalHoldingValue;
    arr.forEach((item, i) => {
      result.push({
        ...item,
        index: idx++,
        industryRatio,
        rowspan: i === 0 ? arr.length : 0,
      });
    });
  }

  return result;
});

const totals = computed(() => {
  const rows = portfolioData.value;
  const sumHoldingValue = rows.reduce((s, r) => s + r.holdingValue, 0);
  const sumExpectedDividend = rows.reduce(
    (s, r) => s + r.expectedDividend,
    0,
  );
  const sumDividendTax = rows.reduce((s, r) => s + r.dividendTax, 0);
  const sumNetDividend = rows.reduce((s, r) => s + r.netDividend, 0);
  const sumDividendRate =
    sumHoldingValue > 0 ? sumNetDividend / sumHoldingValue : 0;
  const sumDividendTaxRate =
    sumHoldingValue > 0 ? sumDividendTax / sumHoldingValue : 0;

  // 透视盈余 = 持有净利润总额 - 股息扣税总额
  // 持有净利润依赖每股净利润（暂无数据），故透视盈余暂不可计算
  return {
    sumHoldingValue,
    sumExpectedDividend,
    sumDividendTax,
    sumNetDividend,
    sumDividendRate,
    sumDividendTaxRate,
    perspectiveSurplus: null as number | null,
    perspectiveSurplusRate: null as number | null,
  };
});

onMounted(() => {
  // 若数据尚未加载（例如本组件先于 stock-pool 挂载），触发刷新
  if (!tableData.value.length) {
    refresh();
  }
});
</script>

<template>
  <div v-if="portfolioData.length" class="portfolio-container">
    <table class="portfolio-table">
      <thead>
        <tr>
          <th>序列号</th>
          <th>持仓公司</th>
          <th>持有股数</th>
          <th>持有市值</th>
          <th>持股比例</th>
          <th>行业</th>
          <th>行业比例</th>
          <th>预计分红</th>
          <th>每股净利润</th>
          <th>股息率</th>
          <th>股息扣税</th>
          <th>扣税后股息</th>
          <th>持有净利润</th>
          <th>留存部分</th>
          <th>PE_TTM</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in portfolioData" :key="item.code">
          <td>{{ item.index }}</td>
          <td class="bold">{{ item.name }}</td>
          <td>{{ item.sharesHeld }}</td>
          <td>￥{{ formatNum(item.holdingValue, 2).toFixed(2) }}</td>
          <td>{{ formatPercent(item.shareholdingRatio * 100) }}</td>
          <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold">
            {{ item.industry }}
          </td>
          <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold">
            {{ formatPercent(item.industryRatio * 100) }}
          </td>
          <td class="dps">
            {{ formatNum(item.expectedDividend, 2).toFixed(2) }}
          </td>
          <td class="eps">-</td>
          <td>{{ formatPercent(item.dividendRate * 100) }}</td>
          <td>{{ formatTax(item.dividendTax) }}</td>
          <td>{{ formatNum(item.netDividend, 2).toFixed(2) }}</td>
          <td class="holding-net-profit">-</td>
          <td class="retained">-</td>
          <td>{{ formatNum(item.peTtm, 2).toFixed(2) }}</td>
        </tr>
        <!-- 合计行 -->
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td class="bold">
            ￥{{ formatNum(totals.sumHoldingValue, 2).toFixed(2) }}
          </td>
          <td class="bold">100.00%</td>
          <td></td>
          <td></td>
          <td class="bold dps">
            {{ formatNum(totals.sumExpectedDividend, 2).toFixed(2) }}
          </td>
          <td></td>
          <td></td>
          <td class="bold">
            {{ formatTax(totals.sumDividendTax) }}
          </td>
          <td class="bold sum-net-dividend">
            {{ formatNum(totals.sumNetDividend, 2).toFixed(2) }}
          </td>
          <td class="bold sum-holding-net-profit">-</td>
          <td class="bold retained">-</td>
          <td></td>
        </tr>
        <!-- 比率行 -->
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
          <td>{{ formatPercent(totals.sumDividendTaxRate * 100) }}</td>
          <td class="sum-dividend-rate">
            {{ formatPercent(totals.sumDividendRate * 100) }}
          </td>
          <td class="sum-holding-net-profit-margin">-</td>
          <td class="retained">-</td>
          <td></td>
        </tr>
        <!-- 标签行 -->
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
          <td>股息税率</td>
          <td class="sum-dividend-rate">组合股息率</td>
          <td class="sum-holding-net-profit-margin">总收益率</td>
          <td class="retained">公司留存率</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <footer class="portfolio-footer">
      <table class="portfolio-table surplus-table">
        <tbody>
          <tr>
            <td>透视盈余</td>
            <td>
              {{
                totals.perspectiveSurplus !== null
                  ? formatNum(totals.perspectiveSurplus, 2)
                  : "-"
              }}
            </td>
          </tr>
          <tr>
            <td>透视盈余收益率</td>
            <td>
              {{
                totals.perspectiveSurplusRate !== null
                  ? formatPercent(totals.perspectiveSurplusRate * 100)
                  : "-"
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.portfolio-container {
  .portfolio-table {
    border-collapse: collapse;
    border-spacing: 0;
    font-size: 13px;
    color: #000;
    margin-top: 16px;

    caption {
      font-size: 15px;
      font-weight: bold;
      text-align: left;
      padding: 8px 0;
      color: #000;
    }

    th,
    td {
      line-height: 22px;
      white-space: nowrap;
      padding: 2px;
      color: #000;
      font-weight: normal;
      border: 1px solid #000;
      text-align: center;
      vertical-align: top;
      background-color: #fff;
    }

    thead th {
      padding: 6px 8px;
      border-bottom-width: 1px;
    }

    // 消除表头底部与表体顶部边框叠加
    tbody tr:first-child td {
      border-top-width: 0;
    }

    .bold {
      font-weight: bold;
    }

    .dps {
      background-color: #ffcac8;
    }

    .eps {
      background-color: #9adeff;
    }

    .holding-net-profit {
      background-color: #9adeff;
    }

    .retained {
      background-color: #fff;
    }

    .sum-net-dividend {
      background-color: #ffcac8;
    }

    .sum-holding-net-profit {
      background-color: #9adeff;
    }

    .sum-dividend-rate {
      background-color: #ffcac8;
    }

    .sum-holding-net-profit-margin {
      background-color: #9adeff;
    }

    .bold-tr {
      font-weight: bold;
    }
  }

  .surplus-table {
    margin-top: 8px;

    td {
      font-weight: bold;
      background-color: #f88920;
      color: #fff;
    }
  }
}
</style>
