<script setup lang="ts">
import {
  formatNum,
  formatPercent,
  numToAHundredMillion,
} from "../../../fetch-data/helper";
import { type ProfitValuationGrowth } from "../../../types";
import { getStockItem } from "../../../types/stocks";
import { data } from "../../service/data";
import {
  ProfitValuation,
  type ProfitValuationFutureData,
} from "../../service/profit-valuation";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    code: string;
    caption?: string;
    growth?: ProfitValuationGrowth;
  }>(),
  {
    caption: "利润估值",
  },
);

const valuationData = data[props.code].valuationData;
const dynamicData = data[props.code].dynamicData;
const stockItem = getStockItem(props.code);

const profitValuation = new ProfitValuation(
  valuationData,
  stockItem,
  dynamicData,
  props.growth,
);

const historyData = computed(() => {
  return valuationData.historyData;
});

const expectDps = (row: ProfitValuationFutureData) => {
  const lastData = historyData.value[historyData.value.length - 1];
  const ratio = row.profit / numToAHundredMillion(lastData.profit, 8);
  return formatNum(lastData.dps * ratio, 2);
};

const expectDividendRate = (row: ProfitValuationFutureData) => {
  const lastData = historyData.value[historyData.value.length - 1];
  const ratio = row.profit / numToAHundredMillion(lastData.profit, 8);
  return formatPercent(profitValuation.dividendRate.value * ratio * 100);
};
</script>

<template>
  <div class="profit-valuation-container">
    <section>
      <table class="valuation-table">
        <caption>
          {{
            `${caption}（${stockItem.name} ${stockItem.code}）`
          }}
        </caption>
        <thead>
          <tr>
            <th>年度利润</th>
            <th>净利润</th>
            <th>增长率</th>
            <th>每股收益</th>
            <th>总股本</th>
            <th>每股分红</th>
            <th>分红率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in historyData">
            <td>{{ row.year }}</td>
            <td>{{ numToAHundredMillion(row.profit, 2) }}</td>
            <td>{{ formatPercent(row.profit_tb * 100, 2) }}</td>
            <td>{{ formatNum(row.basicEps, 2) }}</td>
            <td>{{ numToAHundredMillion(row.totalSharesOutstanding, 2) }}</td>
            <td>{{ formatNum(row.dps, 2) }}</td>
            <td>{{ formatPercent(row.dividendRatio * 100) }}</td>
          </tr>
          <tr class="bold-tr">
            <td>年度利润</td>
            <td>净利润</td>
            <td>增长率</td>
            <td>每股收益</td>
            <td>当前股价PE</td>
            <td class="dividend-rate-td">当前股息率</td>
            <td class="dividend-rate-td">
              {{ formatPercent(profitValuation.dividendRate.value * 100, 2) }}
            </td>
          </tr>
          <tr
            v-for="(row, index) in profitValuation.tableData.value.slice(
              0,
              Math.ceil(profitValuation.calBackYearsNum.value),
            )"
            :key="index"
          >
            <td>{{ row.year }}</td>
            <td class="input-td">
              <input
                class="cell-input profit-input"
                type="number"
                :value="row.displayProfit"
                @focus="
                  profitValuation.handleFocus(row, 'displayProfit', 'profit')
                "
                @input="profitValuation.updateCell(index, 'profit', $event)"
                @blur="
                  profitValuation.handleBlur(row, 'displayProfit', 'profit')
                "
              />
            </td>
            <td class="input-td">
              <input
                class="cell-input growth-input"
                type="number"
                :value="row.displayGrowth"
                @focus="
                  profitValuation.handleFocus(row, 'displayGrowth', 'growth')
                "
                @input="profitValuation.updateCell(index, 'growth', $event)"
                @blur="
                  profitValuation.handleBlur(row, 'displayGrowth', 'growth')
                "
              />
              <span>%</span>
            </td>
            <td class="input-td">
              <input
                class="cell-input eps-input"
                type="number"
                :value="row.displayEps"
                @focus="profitValuation.handleFocus(row, 'displayEps', 'eps')"
                @input="profitValuation.updateCell(index, 'eps', $event)"
                @blur="profitValuation.handleBlur(row, 'displayEps', 'eps')"
              />
            </td>
            <td>{{ profitValuation.dynamicPE(row) }}</td>
            <td>{{ expectDps(row) }}</td>
            <td>{{ expectDividendRate(row) }}</td>
          </tr>
          <tr class="bold-tr">
            <td class="sum-eps-td">
              {{ profitValuation.backYearsNum }}年利润合计
            </td>
            <td class="sum-eps-td">￥{{ profitValuation.sumEps }}</td>
            <td colspan="2">当前股价</td>
            <td class="color-red">￥{{ profitValuation.price }}</td>
            <td>有息负债率</td>
            <td>
              {{
                formatPercent(valuationData.interestBearingDebtOverTotal * 100)
              }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td class="anchor-td">人民币锚点</td>
            <td class="anchor-td">
              ￥{{ formatNum(profitValuation.anchor.value, 2) }}
            </td>
            <td colspan="2" class="batting-edge-td">击球区边缘</td>
            <td class="batting-edge-td">￥{{ profitValuation.battingEdge }}</td>
            <td>资产负债率</td>
            <td>{{ formatPercent(valuationData.debtRatio) }}</td>
          </tr>
          <tr class="bold-tr">
            <td class="could-fall-another-td">还可以跌</td>
            <td class="could-fall-another-td">
              {{ profitValuation.couldFallAnother }}
            </td>
            <td colspan="2">每股现金</td>
            <td>￥{{ profitValuation.cashPerShare }}</td>
            <td>毛利率</td>
            <td>{{ formatPercent(valuationData.grossProfitMargin) }}</td>
          </tr>
          <tr class="bold-tr">
            <td>折现{{ profitValuation.backYearsNum }}年每股利润</td>
            <td>{{ profitValuation.sumPresentEps }}</td>
            <td colspan="2">折线后每股利润/年</td>
            <td>{{ profitValuation.presetEps }}</td>
            <td>净利率</td>
            <td>{{ formatPercent(valuationData.netProfitMargin) }}</td>
          </tr>
          <tr class="bold-tr">
            <td class="long-term-average-return-td">长期平均收益率</td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermAverageReturnYieldWithPrice }}
            </td>
            <td colspan="2" class="long-term-average-return-td">
              预期锚点收益率
            </td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermAverageReturnYieldWithAnchor }}
            </td>
            <td class="long-term-average-return-td">折现长期收益率</td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermAverageReturnYieldWithPresent }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td class="conservative-sell">5.5%收益率对应</td>
            <td class="conservative-sell">
              ￥{{ formatNum(profitValuation.sellPrice(0.055), 2) }}
            </td>
            <td colspan="2" class="neutral-sell">5%收益率对应</td>
            <td class="neutral-sell">
              ￥{{ formatNum(profitValuation.sellPrice(0.05), 2) }}
            </td>
            <td class="optimistic-sell">4.5%收益率对应</td>
            <td class="optimistic-sell">
              ￥{{ formatNum(profitValuation.sellPrice(0.045), 2) }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td>ROE</td>
            <td>{{ formatPercent(valuationData.roe) }}</td>
            <td colspan="2">ROIC</td>
            <td>{{ formatPercent(valuationData.roic) }}</td>
            <td>ROA</td>
            <td>{{ formatPercent(valuationData.roa) }}</td>
          </tr>
          <tr class="bold-tr">
            <td>{{ historyData[historyData.length - 1].year }}年度总分红</td>
            <td>
              ￥{{ formatNum(historyData[historyData.length - 1].dps, 2) }}
            </td>
            <td colspan="2">可交易金融资产</td>
            <td>
              {{
                numToAHundredMillion(valuationData.tradingFinancialAssets, 2)
              }}亿
            </td>
            <td>估值折扣比例</td>
            <td>
              {{
                formatPercent(profitValuation.growth.value.discount * 100, 0)
              }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td>去有息负债现金</td>
            <td>
              {{ numToAHundredMillion(profitValuation.netDebtCash, 2) }}亿
            </td>
            <td colspan="2">长期股权投资</td>
            <td>
              {{
                numToAHundredMillion(valuationData.longTermEquityInvestment, 2)
              }}亿
            </td>
            <td>当前货币资金</td>
            <td>{{ numToAHundredMillion(valuationData.cash, 2) }}亿</td>
          </tr>
          <tr class="bold-tr">
            <td>去有息每股现金</td>
            <td>￥{{ formatNum(profitValuation.netDebtCashPerShare, 2) }}</td>
            <td colspan="2">合计每股金融资产</td>
            <td>
              ￥{{ formatNum(profitValuation.totalFinancialAssetsPerShare, 2) }}
            </td>
            <td>有息负债</td>
            <td>
              {{ numToAHundredMillion(valuationData.interestBearingDebt, 2) }}亿
            </td>
          </tr>
          <tr class="bold-tr">
            <td>少数股东权益</td>
            <td>
              {{ numToAHundredMillion(valuationData.minorityInterest, 2) }}亿
            </td>
            <td colspan="2">每股少数股东权益</td>
            <td>
              ￥{{ formatNum(profitValuation.minorityInterestPerShare, 2) }}
            </td>
            <td></td>
            <td></td>
          </tr>
          <tr class="bold-tr">
            <td class="anchor-td">加其它资产锚点</td>
            <td class="anchor-td">
              ￥{{ formatNum(profitValuation.anchorWithAssets.value, 2) }}
            </td>
            <td colspan="2" class="could-fall-another-td">还可以跌</td>
            <td class="could-fall-another-td">
              {{ profitValuation.couldFallAnotherWithAssets }}
            </td>
            <td class="batting-edge-td">击球区边缘</td>
            <td class="batting-edge-td">
              ￥{{ profitValuation.anchorWithAssetsEdge }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td class="long-term-average-return-td">长期平均收益率</td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermWithAssets }}
            </td>
            <td colspan="2" class="long-term-average-return-td">
              预期锚点收益率
            </td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermAverageReturnYieldWithAnchor }}
            </td>
            <td class="long-term-average-return-td">折现长期收益率</td>
            <td class="long-term-average-return-td">
              {{ profitValuation.longTermPresentWithAssets }}
            </td>
          </tr>
          <tr class="bold-tr">
            <td class="conservative-sell">5.5%收益率对应</td>
            <td class="conservative-sell">
              ￥{{ formatNum(profitValuation.sellPriceWithAssets(0.055), 2) }}
            </td>
            <td colspan="2" class="neutral-sell">5%收益率对应</td>
            <td class="neutral-sell">
              ￥{{ formatNum(profitValuation.sellPriceWithAssets(0.05), 2) }}
            </td>
            <td class="optimistic-sell">4.5%收益率对应</td>
            <td class="optimistic-sell">
              ￥{{ formatNum(profitValuation.sellPriceWithAssets(0.045), 2) }}
            </td>
          </tr>
          <tr class="align-left">
            <td colspan="7">
              <div>
                其它资产 = (100%现金 + 75%金融资产 + 50%长期股权投资 -
                每股少数股东权益)×估值折扣
              </div>
              <div>务必根据不同行业、不同公司给予不同折扣</div>
              <div>持续思考迭代，警惕路径依赖</div>
            </td>
          </tr>
          <template v-if="profitValuation.hkMarketValuation.value">
            <tr class="bold-tr">
              <td colspan="7" class="yellow">
                {{ stockItem.hkMarketConfig ? "港股" : "B股" }}部分
              </td>
            </tr>
            <tr class="bold-tr">
              <td>当前股价</td>
              <td class="color-red">
                HK${{ profitValuation.hkMarketValuation.value.price }}
              </td>
              <td colspan="2">港币汇率</td>
              <td class="pink">
                {{
                  formatNum(
                    profitValuation.hkMarketValuation.value.exchangeRate,
                    4,
                  )
                }}
              </td>
              <td>扣税后到手分红</td>
              <td>
                HK${{
                  formatNum(profitValuation.hkMarketValuation.value.dps, 2)
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td class="orange">港币锚点</td>
              <td class="orange">
                HK${{
                  formatNum(profitValuation.hkMarketValuation.value.anchor, 2)
                }}
              </td>
              <td colspan="2" class="green">还可以跌</td>
              <td class="green">
                {{ profitValuation.hkMarketValuation.value.couldFallAnother }}
              </td>
              <td>到点税后股息率</td>
              <td>
                {{
                  formatPercent(
                    profitValuation.hkMarketValuation.value.anchorDividendRate *
                      100,
                  )
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td class="yellow">长期平均收益率</td>
              <td class="yellow">
                {{
                  profitValuation.hkMarketValuation.value
                    .longTermAverageReturnYieldWithPrice
                }}
              </td>
              <td colspan="2" class="yellow">折现后长期收益率</td>
              <td class="yellow">
                {{
                  profitValuation.hkMarketValuation.value
                    .longTermAverageReturnYieldWithPresent
                }}
              </td>
              <td>港股打折</td>
              <td>
                {{
                  formatPercent(
                    profitValuation.hkMarketValuation.value.discount * 100,
                    0,
                  )
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td class="baby-blue">击球区边缘</td>
              <td class="baby-blue">
                HK${{ profitValuation.hkMarketValuation.value.battingEdge }}
              </td>
              <td colspan="2" class="baby-blue">边缘还可以跌</td>
              <td class="baby-blue">
                {{
                  profitValuation.hkMarketValuation.value
                    .battingEdgeCouldFallAnother
                }}
              </td>
              <td>当前税后股息率</td>
              <td class="pink">
                {{
                  formatPercent(
                    profitValuation.hkMarketValuation.value.dividendRate * 100,
                  )
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td></td>
              <td></td>
              <td colspan="2"></td>
              <td></td>
              <td class="pink">A股股息多</td>
              <td class="pink">
                {{
                  formatPercent(
                    profitValuation.hkMarketValuation.value.dividendCompare *
                      100,
                  )
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td class="anchor-td">加其它资产锚点</td>
              <td class="anchor-td">
                HK${{
                  formatNum(
                    profitValuation.hkMarketValuation.value.anchorWithAssets,
                    2,
                  )
                }}
              </td>
              <td colspan="2" class="could-fall-another-td">还可以跌</td>
              <td class="could-fall-another-td">
                {{
                  profitValuation.hkMarketValuation.value
                    .couldFallAnotherWithAssets
                }}
              </td>
              <td class="batting-edge-td">击球区边缘</td>
              <td class="batting-edge-td">
                HK${{
                  profitValuation.hkMarketValuation.value.anchorWithAssetsEdge
                }}
              </td>
            </tr>
            <tr class="bold-tr">
              <td class="long-term-average-return-td">长期平均收益率</td>
              <td class="long-term-average-return-td">
                {{ profitValuation.hkMarketValuation.value.longTermWithAssets }}
              </td>
              <td colspan="2" class="long-term-average-return-td">
                折现长期收益率
              </td>
              <td class="long-term-average-return-td">
                {{
                  profitValuation.hkMarketValuation.value
                    .longTermPresentWithAssets
                }}
              </td>
              <td>到点税后股息率</td>
              <td>
                {{
                  formatPercent(
                    profitValuation.hkMarketValuation.value
                      .anchorWithAssetsDividendRate * 100,
                  )
                }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.profit-valuation-container {
  .input-td {
    background-color: #c7ecff;
  }

  .highlight-tr {
    background-color: #ffe9e8;
  }

  .cell-input {
    padding-inline: 0;
    border: none;
    outline: none;
    background-color: #c7ecff;
    text-align: center;

    &.growth-input {
      width: 30px;
    }

    &.profit-input {
      width: 50px;
    }

    &.eps-input {
      width: 70px;
    }
  }

  .sum-eps-td {
    background-color: #8ddefa;
  }

  .batting-edge-td {
    background-color: #8ddefa;
  }

  .anchor-td {
    background-color: #f88920;
  }

  .could-fall-another-td {
    background-color: #00b24f;
  }

  .long-term-average-return-td {
    background: #ffff00;
  }

  .dividend-rate-td {
    background: #ffcac8;
  }

  .conservative-sell {
    background: #00a3ff;
  }

  .neutral-sell {
    background: #f8bc00;
  }

  .optimistic-sell {
    background: #ee1e05;
  }

  .yellow {
    background: #ffff00;
  }

  .green {
    background: #00b24f;
  }

  .orange {
    background-color: #f88920;
  }

  .red {
    background: #ff0000;
  }

  .pink {
    background-color: #ffcac8;
  }

  .baby-blue {
    background-color: #8ddefa;
  }

  .color-red {
    color: #ff0000;
  }
}
</style>
