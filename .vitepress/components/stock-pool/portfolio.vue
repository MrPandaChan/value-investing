<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import {
  formatNum,
  formatPercent,
  canConvertToCNY,
  isHKCode,
} from "../../../fetch-data/helper";
import { cash, stocks } from "../../my-data/stock-pool";
import { useStockPoolData } from "./use-stock-pool-data";
import { getEffectiveEventDps, type ExItem } from "./fetch-dividend";

const { tableData, groupMetaMap, exchangeRate, refresh } = useStockPoolData();

/** 是否在组合中显示现金行 */
const showCash = ref(false);

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
  paidDividend: number; // 已分红（人民币）
  unpaidDividend: number; // 未分红（人民币）
  eps: number; // 每股净利润（人民币）
  dividendRate: number; // 股息率（扣税后）
  dividendTax: number; // 股息扣税（人民币，基于 dividendAdjust）
  netDividend: number; // 扣税后股息（人民币，调整后）
  holdingNetProfit: number; // 持有净利润（人民币）
  retainedNetProfit: number; // 公司留存部分（人民币）
  peTtm: number;
  qualityScore: number; // 综合素质评分 0-5
  rowspan: number;
}

/** 格式化扣税金额：扣掉（正数）显示 -，增加（负数）显示 +，零显示 - */
function formatTax(tax: number): string {
  if (tax === 0 || Math.abs(tax) < 0.005) return "-";
  const abs = formatNum(Math.abs(tax), 2).toFixed(2);
  return tax > 0 ? `-${abs}` : `+${abs}`;
}

/** 计算已分红的每股分红（派息日落在今年1月1日至今天的分红之和） */
function getPaidDps(exList: ExItem[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  return exList
    .filter((ex) => {
      if (!ex.payDate || ex.payDate === "-") return false;
      const payDate = new Date(ex.payDate.replace(/\//g, "-"));
      return payDate >= yearStart && payDate <= today;
    })
    .reduce((sum, ex) => sum + getEffectiveEventDps(ex), 0);
}

const portfolioData = computed<PortfolioRow[]>(() => {
  // 仅包含有持有股数且有可用元数据的股票
  const heldStocks = stocks.filter(
    (s) => s.sharesHeld && s.sharesHeld > 0 && groupMetaMap.value[s.code],
  );

  const cashVal = showCash.value ? cash.value || 0 : 0;
  const result: PortfolioRow[] = [];
  let idx = 1;

  // 无持仓股票时，若有现金且显示现金则仅显示现金行
  if (!heldStocks.length) {
    if (cashVal > 0) {
      result.push({
        index: 1,
        name: "现金",
        code: "__cash__",
        sharesHeld: 0,
        holdingValue: cashVal,
        shareholdingRatio: 1,
        industry: "现金",
        industryRatio: 1,
        expectedDividend: 0,
        paidDividend: 0,
        unpaidDividend: 0,
        eps: 0,
        dividendRate: 0,
        dividendTax: 0,
        netDividend: 0,
        holdingNetProfit: 0,
        retainedNetProfit: 0,
        peTtm: 0,
        qualityScore: 0,
        rowspan: 1,
      });
    }
    return result;
  }

  // 计算每只股票的指标
  const items = heldStocks.map((s) => {
    const meta = groupMetaMap.value[s.code]!;
    const nameRow = tableData.value.find((r) => r.code === s.code);
    const rawName = nameRow?.name || s.code;
    // 港股后面加上 H
    const name = isHKCode(s.code) ? `${rawName}H` : rawName;
    const sharesHeld = s.sharesHeld!;
    const price = meta.realPrice;
    const qualityScore = s.qualityScore;

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

    // 已分红 = 已过派息日的分红 dps 之和 * sharesHeld（转为人民币）
    // 使用与 meta.dps 相同的过滤后 exList，避免已分红超过预计分红
    const exList = nameRow?.exList || [];
    const paidDps = getPaidDps(exList);
    const rawPaidDividend = paidDps * sharesHeld;
    const paidDividend = canConvertToCNY(s.code)
      ? rawPaidDividend / exchangeRate.value
      : rawPaidDividend;
    // 未分红 = 预计分红 - 已分红
    const unpaidDividend = expectedDividend - paidDividend;

    // 每股净利润 = 当前股价 / PE_TTM（转为人民币）
    const rawEps = meta.pricePE > 0 ? price / meta.pricePE : 0;
    const eps = canConvertToCNY(s.code) ? rawEps / exchangeRate.value : rawEps;
    // 持有净利润 = 每股净利润 * 持有股数（人民币）
    const holdingNetProfit = eps * sharesHeld;
    // 公司留存部分 = 持有净利润 - 预计分红（人民币）
    const retainedNetProfit = holdingNetProfit - expectedDividend;

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
      paidDividend,
      unpaidDividend,
      eps,
      dividendRate,
      dividendTax,
      netDividend,
      holdingNetProfit,
      retainedNetProfit,
      peTtm: meta.pricePE,
      qualityScore,
      industry: s.industry,
    };
  });

  // 组合总市值（含现金）
  const totalHoldingValue =
    items.reduce((sum, i) => sum + i.holdingValue, 0) + cashVal;

  // 持股比例（基于含现金的总市值）
  items.forEach((i) => {
    i.shareholdingRatio =
      totalHoldingValue > 0 ? i.holdingValue / totalHoldingValue : 0;
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
  for (const [, arr] of industryMap) {
    const industryTotal = arr.reduce((sum, i) => sum + i.holdingValue, 0);
    const industryRatio =
      totalHoldingValue > 0 ? industryTotal / totalHoldingValue : 0;
    arr.forEach((item, i) => {
      result.push({
        ...item,
        index: idx++,
        industryRatio,
        rowspan: i === 0 ? arr.length : 0,
      });
    });
  }

  // 现金行（放到最后，参与总市值和比例计算；showCash=false 时 cashVal=0 跳过）
  if (cashVal > 0) {
    result.push({
      index: idx++,
      name: "现金",
      code: "__cash__",
      sharesHeld: 0,
      holdingValue: cashVal,
      shareholdingRatio:
        totalHoldingValue > 0 ? cashVal / totalHoldingValue : 0,
      industry: "现金",
      industryRatio: totalHoldingValue > 0 ? cashVal / totalHoldingValue : 0,
      expectedDividend: 0,
      paidDividend: 0,
      unpaidDividend: 0,
      eps: 0,
      dividendRate: 0,
      dividendTax: 0,
      netDividend: 0,
      holdingNetProfit: 0,
      retainedNetProfit: 0,
      peTtm: 0,
      qualityScore: 0,
      rowspan: 1,
    });
  }

  return result;
});

/** 加权综合素质得分（不含现金，按持股比例归一化加权） */
const compositeQualityScore = computed(() => {
  const rows = portfolioData.value.filter((r) => r.code !== "__cash__");
  if (!rows.length) return 0;
  const totalRatio = rows.reduce((sum, r) => sum + r.shareholdingRatio, 0);
  if (totalRatio === 0) return 0;
  return (
    rows.reduce(
      (sum, r) => sum + (r.shareholdingRatio / totalRatio) * r.qualityScore,
      0,
    ) || 0
  );
});

const totals = computed(() => {
  const rows = portfolioData.value;
  const sumHoldingValue = rows.reduce((s, r) => s + r.holdingValue, 0);
  const sumExpectedDividend = rows.reduce((s, r) => s + r.expectedDividend, 0);
  const sumPaidDividend = rows.reduce((s, r) => s + r.paidDividend, 0);
  const sumUnpaidDividend = rows.reduce((s, r) => s + r.unpaidDividend, 0);
  const sumDividendTax = rows.reduce((s, r) => s + r.dividendTax, 0);
  const sumNetDividend = rows.reduce((s, r) => s + r.netDividend, 0);
  const sumHoldingNetProfit = rows.reduce((s, r) => s + r.holdingNetProfit, 0);
  const sumRetainedNetProfit = rows.reduce(
    (s, r) => s + r.retainedNetProfit,
    0,
  );
  const sumDividendRate =
    sumHoldingValue > 0 ? sumNetDividend / sumHoldingValue : 0;
  const sumDividendTaxRate =
    sumHoldingValue > 0 ? sumDividendTax / sumHoldingValue : 0;
  const sumHoldingNetProfitMargin =
    sumHoldingValue > 0 ? sumHoldingNetProfit / sumHoldingValue : 0;
  const sumRetainedNetProfitRate =
    sumHoldingValue > 0 ? sumRetainedNetProfit / sumHoldingValue : 0;

  // 透视盈余 = 持有净利润总额 - 股息扣税总额
  const perspectiveSurplus = sumHoldingNetProfit - sumDividendTax;
  const perspectiveSurplusRate =
    sumHoldingValue > 0 ? perspectiveSurplus / sumHoldingValue : 0;

  return {
    sumHoldingValue,
    sumExpectedDividend,
    sumPaidDividend,
    sumUnpaidDividend,
    sumDividendTax,
    sumNetDividend,
    sumHoldingNetProfit,
    sumRetainedNetProfit,
    sumDividendRate,
    sumDividendTaxRate,
    sumHoldingNetProfitMargin,
    sumRetainedNetProfitRate,
    perspectiveSurplus,
    perspectiveSurplusRate,
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
          <th>序号</th>
          <th class="bold">持仓公司</th>
          <th>持有股数</th>
          <th>持有市值</th>
          <th class="bold">持股比例</th>
          <th class="bold">行业</th>
          <th class="bold">行业比例</th>
          <th class="dps">预计分红</th>
          <th>已分红</th>
          <th>未分红</th>
          <th class="eps">EPS</th>
          <th>PE_TTM</th>
          <th class="bold">股息率</th>
          <th>股息扣税</th>
          <th>扣税后股息</th>
          <th class="holding-net-profit">持有净利润</th>
          <th class="retained">留存部分</th>
          <th class="bold">安心指数</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in portfolioData" :key="item.code">
          <td>{{ item.index }}</td>
          <td class="bold">{{ item.name }}</td>
          <td>{{ item.sharesHeld }}</td>
          <td>￥{{ formatNum(item.holdingValue, 2).toFixed(2) }}</td>
          <td class="bold">
            {{ formatPercent(item.shareholdingRatio * 100) }}
          </td>
          <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold">
            {{ item.industry }}
          </td>
          <td v-if="item.rowspan > 0" :rowspan="item.rowspan" class="bold">
            {{ formatPercent(item.industryRatio * 100) }}
          </td>
          <td class="dps">
            {{ formatNum(item.expectedDividend, 2).toFixed(2) }}
          </td>
          <td>{{ formatNum(item.paidDividend, 2).toFixed(2) }}</td>
          <td>{{ formatNum(item.unpaidDividend, 2).toFixed(2) }}</td>
          <td class="eps">{{ formatNum(item.eps, 3).toFixed(3) }}</td>
          <td>{{ formatNum(item.peTtm, 2).toFixed(2) }}</td>
          <td class="bold">{{ formatPercent(item.dividendRate * 100) }}</td>
          <td>{{ formatTax(item.dividendTax) }}</td>
          <td>{{ formatNum(item.netDividend, 2).toFixed(2) }}</td>
          <td class="holding-net-profit">
            {{ formatNum(item.holdingNetProfit, 2).toFixed(2) }}
          </td>
          <td class="retained">
            {{ formatNum(item.retainedNetProfit, 2).toFixed(2) }}
          </td>
          <td>
            <el-rate
              v-if="item.code !== '__cash__'"
              :model-value="item.qualityScore"
              disabled
              class="moat-rate"
            />
            <span v-else>-</span>
          </td>
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
          <td class="bold">
            {{ formatNum(totals.sumPaidDividend, 2).toFixed(2) }}
          </td>
          <td class="bold">
            {{ formatNum(totals.sumUnpaidDividend, 2).toFixed(2) }}
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td class="bold">
            {{ formatTax(totals.sumDividendTax) }}
          </td>
          <td class="bold sum-net-dividend">
            {{ formatNum(totals.sumNetDividend, 2).toFixed(2) }}
          </td>
          <td class="bold sum-holding-net-profit">
            {{ formatNum(totals.sumHoldingNetProfit, 2).toFixed(2) }}
          </td>
          <td class="bold retained">
            {{ formatNum(totals.sumRetainedNetProfit, 2).toFixed(2) }}
          </td>
          <td class="bold">
            {{ compositeQualityScore.toFixed(2) }}
          </td>
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
          <td></td>
          <td></td>
          <td></td>
          <td>{{ formatPercent(totals.sumDividendTaxRate * 100) }}</td>
          <td class="sum-dividend-rate">
            {{ formatPercent(totals.sumDividendRate * 100) }}
          </td>
          <td class="sum-holding-net-profit-margin">
            {{ formatPercent(totals.sumHoldingNetProfitMargin * 100) }}
          </td>
          <td class="retained">
            {{ formatPercent(totals.sumRetainedNetProfitRate * 100) }}
          </td>
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
          <td></td>
          <td></td>
          <td></td>
          <td>股息税率</td>
          <td class="sum-dividend-rate">组合股息率</td>
          <td class="sum-holding-net-profit-margin">总收益率</td>
          <td class="retained">公司留存率</td>
          <td class="bold">安心指数</td>
        </tr>
      </tbody>
    </table>

    <footer class="portfolio-footer">
      <table class="portfolio-table surplus-table">
        <tbody>
          <tr>
            <td>透视盈余</td>
            <td>{{ formatNum(totals.perspectiveSurplus, 2) }}</td>
          </tr>
          <tr>
            <td>透视盈余收益率</td>
            <td>
              {{ formatPercent(totals.perspectiveSurplusRate * 100) }}
            </td>
          </tr>
          <tr>
            <td>PE_TTM</td>
            <td>{{ (1 / totals.perspectiveSurplusRate).toFixed(2) }}</td>
          </tr>
          <tr>
            <td>组合综合素质得分</td>
            <td class="bold">
              {{ compositeQualityScore.toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>

      <el-switch
        class="cash-switch"
        v-model="showCash"
        active-text="显示现金"
        inactive-text="隐藏现金"
      />
    </footer>
  </div>
</template>

<style lang="scss">
/* 定义颜色变量（暗黑模式通过 html.dark 切换） */
.portfolio-container {
  --pf-text: #000;
  --pf-bg: var(--vp-c-bg);
  --pf-border: #000;
  --pf-bg-dps: #ffcac8;
  --pf-bg-eps: #9adeff;
  --pf-bg-surplus: #f88920;
}

html.dark .portfolio-container {
  --pf-text: var(--vp-c-text-1);
  --pf-bg: var(--vp-c-bg);
  --pf-border: var(--vp-c-divider);
  --pf-bg-dps: #4a3030;
  --pf-bg-eps: #2a455a;
  --pf-bg-surplus: #a05510;
}
</style>

<style lang="scss" scoped>
.portfolio-container {
  .portfolio-table {
    border-collapse: collapse;
    border-spacing: 0;
    font-size: 13px;
    color: var(--pf-text);
    margin-top: 16px;

    caption {
      font-size: 15px;
      font-weight: bold;
      text-align: left;
      padding: 8px 0;
      color: var(--pf-text);
    }

    th,
    td {
      line-height: 22px;
      white-space: nowrap;
      padding: 2px 4px;
      color: var(--pf-text);
      font-weight: normal;
      border: 1px solid var(--pf-border);
      text-align: center;
      vertical-align: top;
      background-color: var(--pf-bg);
    }

    thead th {
      padding: 6px 8px;
      font-weight: normal;
      background-color: var(--pf-bg);
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
      background-color: var(--pf-bg-dps);
    }

    .eps {
      background-color: var(--pf-bg-eps);
    }

    .holding-net-profit {
      background-color: var(--pf-bg-eps);
    }

    .retained {
      background-color: var(--pf-bg);
    }

    .sum-net-dividend {
      background-color: var(--pf-bg-dps);
    }

    .sum-holding-net-profit {
      background-color: var(--pf-bg-eps);
    }

    .sum-dividend-rate {
      background-color: var(--pf-bg-dps);
    }

    .sum-holding-net-profit-margin {
      background-color: var(--pf-bg-eps);
    }

    .bold-tr {
      font-weight: bold;
    }
  }

  .surplus-table {
    margin-top: 8px;

    tr {
      border-top: 1px solid var(--pf-border);
    }

    td {
      font-weight: bold;
      padding: 4px 6px;
      background-color: var(--pf-bg-surplus);
    }
  }

  .portfolio-footer {
    display: flex;
    justify-content: flex-start;
  }

  .cash-switch {
    margin-left: 16px;
  }

  .moat-rate {
    --el-rate-fill-color: #f7ba2a;
    --el-rate-icon-size: 10px;
    --el-rate-icon-margin: 0px;
    justify-content: center;
  }
}
</style>
