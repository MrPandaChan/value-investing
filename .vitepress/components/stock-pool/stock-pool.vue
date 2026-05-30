<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getDynamicData } from "../../../fetch-data/fetch-stock-data";
import {
  formatNum,
  formatPercent,
  canConvertToCNY,
  getCurrencyPrefix,
  isBCode,
  isHKCode,
} from "../../../fetch-data/helper";
import { fetchAllDividendData, type ExItem } from "./fetch-dividend";
import { PlanType, planList } from "./plan";

interface RowData {
  name: string;
  code: string;
  price: number;
  pe: number;
  dividend: number;
  quantity: number;
  url?: string;
  remark?: string;
  exList: { dps: number; exDate: string }[];
}

interface MergedRowData extends RowData {
  nameRowSpan: number;

  exDateRowSpan: number;
  dpsRowSpan: number;
  annualDpsRowSpan: number;
  remarkRowSpan: number;
  annualDps: number;
  adjustedAnnualDps?: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  decline: number;
  totalMarketCap?: number;
  rowKey: string;
}

const tableData = ref<RowData[]>([]);
const exListMap = ref<Record<string, ExItem[]>>({});

interface GroupMeta {
  planType: PlanType;
  dps: number;
  effectiveDps: number; // 调整后年分红 = dps * dividendAdjust，用于计划行目标价反推
  pricePE: number;
  realPrice: number;
  dividendAdjust?: number;
}
const groupMetaMap = ref<Record<string, GroupMeta>>({});
const customPrice = reactive<Record<string, number>>({});
const customDividend = reactive<Record<string, number>>({});
const customPE = reactive<Record<string, number>>({});
const exchangeRate = ref(1.1555); // 港币兑人民币汇率

const STORAGE_KEY = "stock-pool-data";

// 基于 planList 结构自动生成指纹，planList 变更时自动失效旧缓存
function computeFingerprint(): string {
  const entries = planList.map((item) => {
    const base = {
      code: item.code,
      type: item.type === PlanType.PRICE ? "PRICE" : "DIVIDEND",
      dpy: item.dividendPerYear,
      adj: item.dividendAdjust,
      remark: item.remark,
    };
    if (item.type === PlanType.PRICE) {
      return {
        ...base,
        entries: item.price.map((e) => ({ v: e.value, q: e.quantity })),
      };
    }
    return {
      ...base,
      entries: item.dividend.map((e) => ({ v: e.value, q: e.quantity })),
    };
  });
  return JSON.stringify(entries);
}

// 按股票 code 去重存储，避免 name/url/exList 重复
interface StockStorage {
  name: string;
  url?: string;
  remark?: string;
  rows: {
    price: number;
    pe: number;
    dividend: number;
    quantity: number;
  }[];
  exList: { dps: number; exDate: string }[];
  meta: GroupMeta;
}

interface StorageData {
  version: string;
  stocks: Record<string, StockStorage>;
  customPrice: Record<string, number>;
  customDividend: Record<string, number>;
  customPE: Record<string, number>;
}

function saveToStorage() {
  const stocks: Record<string, StockStorage> = {};
  const codes = [...new Set(tableData.value.map((r) => r.code))];
  for (const code of codes) {
    const rows = tableData.value.filter((r) => r.code === code);
    const first = rows[0];
    stocks[code] = {
      name: first.name,
      url: first.url,
      remark: first.remark,
      rows: rows.map((r) => ({
        price: r.price,
        pe: r.pe,
        dividend: r.dividend,
        quantity: r.quantity,
      })),
      exList: first.exList,
      meta: groupMetaMap.value[code],
    };
  }
  const data: StorageData = {
    version: computeFingerprint(),
    stocks,
    customPrice: { ...customPrice },
    customDividend: { ...customDividend },
    customPE: { ...customPE },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data: StorageData = JSON.parse(raw);
    // 指纹不匹配则丢弃旧缓存，用最新 planList 重新初始化
    if (data.version !== computeFingerprint()) return false;
    const codes = Object.keys(data.stocks || {});
    if (!codes.length) return false;

    tableData.value = [];
    groupMetaMap.value = {};
    for (const code of codes) {
      const s = data.stocks[code];
      if (!s) continue;
      groupMetaMap.value[code] = s.meta;
      for (const r of s.rows) {
        tableData.value.push({
          name: s.name,
          code,
          price: r.price,
          pe: r.pe,
          dividend: r.dividend,
          quantity: r.quantity,
          url: s.url,
          exList: s.exList,
          remark: s.remark,
        });
      }
    }

    Object.keys(customPrice).forEach((k) => delete customPrice[k]);
    Object.keys(customDividend).forEach((k) => delete customDividend[k]);
    Object.keys(customPE).forEach((k) => delete customPE[k]);
    Object.assign(customPrice, data.customPrice || {});
    Object.assign(customDividend, data.customDividend || {});
    Object.assign(customPE, data.customPE || {});
    return true;
  } catch {
    // ignore
  }
  return false;
}

onMounted(() => {
  loadFromStorage();
});

watch(
  [customPrice, customDividend, customPE],
  () => {
    if (tableData.value.length) saveToStorage();
  },
  { deep: true },
);

async function init() {
  tableData.value = [];
  const stockCodes = planList.map((v) => v.code);
  const [dynamicDataList, exListMapResult] = await Promise.all([
    getDynamicData([...stockCodes, "133.CNHHKD"]),
    fetchAllDividendData(stockCodes),
  ]);
  exListMap.value = exListMapResult;
  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  if (exchangeTarget) {
    exchangeRate.value = exchangeTarget.price / 100;
  }
  // 港股人民币分红按汇率转为港币（字符串中的港币计算值不准确）
  for (const item of planList) {
    if (isHKCode(item.code)) {
      const exList = exListMap.value[item.code];
      if (exList) {
        for (const ex of exList) {
          if (ex.isRmb) {
            ex.dps = ex.dps * exchangeRate.value;
            delete ex.isRmb;
          }
        }
      }
    }
  }
  // B股分红数据为人民币，转为港币后再计算股息率
  for (const item of planList) {
    if (isBCode(item.code)) {
      const exList = exListMap.value[item.code];
      if (exList) {
        for (const ex of exList) {
          ex.dps = ex.dps * exchangeRate.value;
        }
      }
    }
  }

  for (let i = 0; i < stockCodes.length; i += 1) {
    const item = planList[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (dynamicData) {
      const {
        name,
        code,
        price,
        prevClose: originPrevClose,
        PE_TTM,
      } = dynamicData;
      const prevClose = isHKCode(code)
        ? originPrevClose / 1000
        : originPrevClose / 100;
      // 港股 PE_TTM 是以收盘价来算的
      const pricePE = isHKCode(code)
        ? PE_TTM * (1 + (price - prevClose) / prevClose)
        : PE_TTM;
      const rawExList = exListMap.value[code] || [];
      const exList = item.dividendPerYear
        ? rawExList.slice(0, item.dividendPerYear)
        : rawExList;
      const dps =
        Math.round(exList.reduce((pre, cur) => pre + cur.dps, 0) * 100) / 100;
      const effectiveDps =
        item.dividendAdjust != null
          ? Math.round(dps * item.dividendAdjust * 100) / 100
          : dps;
      groupMetaMap.value[code] = {
        planType: item.type,
        dps,
        effectiveDps,
        pricePE,
        realPrice: price,
        dividendAdjust: item.dividendAdjust,
      };
      tableData.value.push({
        name,
        code,
        price,
        pe: pricePE,
        dividend: effectiveDps / price,
        quantity: 0,
        url: item.url,
        exList,
        remark: item.remark,
      });
      if (item.type === PlanType.PRICE) {
        for (let pi = 0; pi < item.price.length; pi++) {
          const v = item.price[pi];
          tableData.value.push({
            name,
            code,
            price: v.value,
            pe: pricePE * (v.value / price),
            dividend: effectiveDps / v.value,
            quantity: v.quantity,
            url: item.url,
            exList,
            remark: item.remark,
          });
        }
      } else if (item.type === PlanType.DIVIDEND) {
        for (let pi = 0; pi < item.dividend.length; pi++) {
          const v = item.dividend[pi];
          const targetPrice = effectiveDps / v.value;
          tableData.value.push({
            name,
            code,
            price: targetPrice,
            pe: pricePE * (targetPrice / price),
            dividend: v.value,
            quantity: v.quantity,
            url: item.url,
            exList,
            remark: item.remark,
          });
        }
      }
    }
  }

  // 初始化 customPrice / customDividend / customPE 为每个公司最后一行的值
  // 先清空
  Object.keys(customPrice).forEach((k) => delete customPrice[k]);
  Object.keys(customDividend).forEach((k) => delete customDividend[k]);
  Object.keys(customPE).forEach((k) => delete customPE[k]);
  for (const item of planList) {
    const rows = tableData.value.filter((r) => r.code === item.code);
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      customPrice[item.code] = lastRow.price;
      customDividend[item.code] = lastRow.dividend;
      customPE[item.code] = lastRow.pe;
    }
  }
  saveToStorage();
}

async function refresh() {
  if (!tableData.value.length) {
    return init();
  }
  const stockCodes = planList.map((v) => v.code);
  const dynamicDataList = await getDynamicData([...stockCodes, "133.CNHHKD"]);

  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  if (exchangeTarget) {
    exchangeRate.value = exchangeTarget.price / 100;
  }

  for (let i = 0; i < stockCodes.length; i++) {
    const item = planList[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (!dynamicData) continue;

    const { price, prevClose: originPrevClose, PE_TTM } = dynamicData;
    const code = item.code;
    const prevClose = isHKCode(code)
      ? originPrevClose / 1000
      : originPrevClose / 100;
    const pricePE = isHKCode(code)
      ? PE_TTM * (1 + (price - prevClose) / prevClose)
      : PE_TTM;
    const meta = groupMetaMap.value[code];
    const dps = meta?.dps || 0;
    const effectiveDps =
      item.dividendAdjust != null
        ? Math.round(dps * item.dividendAdjust * 100) / 100
        : dps;

    groupMetaMap.value[code] = {
      ...(meta || {
        planType: item.type,
        dps: 0,
        effectiveDps: 0,
        dividendAdjust: undefined,
      }),
      pricePE,
      realPrice: price,
    };

    // 更新 tableData 中该 code 的行
    const rows = tableData.value.filter((r) => r.code === code);
    rows.forEach((row, index) => {
      if (index === 0) {
        // 实时行
        row.price = price;
        row.pe = pricePE;
        row.dividend = effectiveDps / price;
      } else {
        // 计划行
        if (item.type === PlanType.PRICE) {
          const planPrice = item.price[index - 1].value;
          row.price = planPrice;
          row.pe = pricePE * (planPrice / price);
          row.dividend = effectiveDps / planPrice;
        } else {
          const planDiv = item.dividend[index - 1].value;
          const targetPrice = effectiveDps / planDiv;
          row.price = targetPrice;
          row.pe = pricePE * (targetPrice / price);
          row.dividend = planDiv;
        }
      }
    });

    // 更新 custom 行
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      customPrice[code] = lastRow.price;
      customDividend[code] = lastRow.dividend;
      customPE[code] = lastRow.pe;
    }
  }
  saveToStorage();
}

function formatPrice(price: number, code: string): string {
  const prefix = getCurrencyPrefix(code);
  return `${prefix}${formatNum(price, 2).toFixed(2)}`;
}

function onPriceChange(code: string) {
  const meta = groupMetaMap.value[code];
  const price = customPrice[code];
  if (meta && price > 0) {
    customDividend[code] = meta.effectiveDps / price;
    customPE[code] = meta.pricePE * (price / meta.realPrice);
  }
}

function onDividendChange(code: string) {
  const meta = groupMetaMap.value[code];
  const dividend = customDividend[code];
  if (meta && dividend > 0) {
    customPrice[code] = meta.effectiveDps / dividend;
    customPE[code] = meta.pricePE * (customPrice[code] / meta.realPrice);
  }
}

function onPEChange(code: string) {
  const meta = groupMetaMap.value[code];
  const pe = customPE[code];
  if (meta && pe > 0) {
    customPrice[code] = meta.realPrice * (pe / meta.pricePE);
    customDividend[code] = meta.effectiveDps / customPrice[code];
  }
}

// 按 code 分组，为 name 和 code 列计算 rowspan
const mergedTableData = computed(() => {
  const result: MergedRowData[] = [];
  const data = tableData.value;

  let i = 0;
  while (i < data.length) {
    const code = data[i].code;
    const group: RowData[] = [];
    while (i < data.length && data[i].code === code) {
      group.push(data[i]);
      i++;
    }

    const meta = groupMetaMap.value[code];
    const realPrice = meta ? meta.realPrice : group[0].price; // 第一行为实时股价

    // 先计算每行的实际 price（处理 custom 行）
    const resolvedRows = group.map((row, index) => {
      const isLast = index === group.length - 1 && index > 0;
      let price = row.price;
      let dividend = row.dividend;
      let pe = row.pe;

      if (isLast && meta) {
        const cp = customPrice[code];
        const cd = customDividend[code];
        const cpe = customPE[code];
        if (cp !== undefined) price = cp;
        if (cd !== undefined) dividend = cd;
        if (cpe !== undefined) pe = cpe;
      }

      return { ...row, price, dividend, pe };
    });

    // 计划市值合计：所有计划行（index > 0）的 quantity * price 之和
    const totalMarketCap = resolvedRows
      .slice(1)
      .reduce(
        (sum, r) => sum + (r.quantity && r.price ? r.quantity * r.price : 0),
        0,
      );

    resolvedRows.forEach((row, index) => {
      const isLast = index === group.length - 1 && index > 0;
      const decline =
        index === 0 ? 0 : ((realPrice - row.price) / realPrice) * 100;
      const annualDps = row.exList.reduce((pre, cur) => pre + cur.dps, 0);
      const adjustedAnnualDps =
        meta?.dividendAdjust != null
          ? annualDps * meta.dividendAdjust
          : undefined;

      result.push({
        ...row,
        nameRowSpan: index === 0 ? group.length : 0,
        exDateRowSpan: index === 0 ? group.length : 0,
        dpsRowSpan: index === 0 ? group.length : 0,
        annualDpsRowSpan: index === 0 ? group.length : 0,
        remarkRowSpan: index === 0 ? group.length : 0,
        annualDps,
        adjustedAnnualDps,
        isFirstRow: index === 0,
        isLastRow: isLast,
        decline,
        totalMarketCap: index === 0 ? totalMarketCap : undefined,
        rowKey: `${code}-${index}`,
      });
    });
  }

  return result;
});
</script>

<template>
  <el-button type="primary" @click="refresh">刷新实时数据</el-button>
  <el-button type="primary" @click="init"
    >初始化所有数据（避免高频调用）</el-button
  >

  <table v-if="mergedTableData.length" class="stock-pool-table">
    <thead>
      <tr>
        <th class="bold light-blue">股票名称 / 代码</th>
        <th class="bold blue">股价</th>
        <th class="bold red">股息率</th>
        <th class="bold red">PE_TTM</th>
        <th class="bold bg-green">还要跌</th>
        <th class="bold">除权除息</th>
        <th class="bold">每股分红</th>
        <th class="bold bg-pink red">年分红</th>
        <th class="bold">计划股数</th>
        <th class="bold">计划市值</th>
        <th class="bold">备注</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, idx) in mergedTableData"
        :key="idx"
        :class="{ 'real-time-row': row.isFirstRow }"
      >
        <td v-if="row.nameRowSpan > 0" :rowspan="row.nameRowSpan" class="bold">
          <div>
            <a v-if="row.url" :href="row.url" class="stock-link">{{
              row.name
            }}</a>
            <span v-else>{{ row.name }}</span>
          </div>
          <div class="stock-code">{{ row.code }}</div>
        </td>
        <td
          class="bold"
          :class="[
            row.isFirstRow ? 'red' : 'blue',
            { 'bg-pink': row.decline < 5 && !row.isFirstRow },
          ]"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="customPrice[row.code]"
            :precision="2"
            :controls="false"
            size="small"
            class="plan-price-input"
            @change="onPriceChange(row.code)"
          />
          <span v-else>{{ formatPrice(row.price, row.code) }}</span>
        </td>
        <td
          class="bold"
          :class="{
            red: !row.isFirstRow,
            'bg-pink': row.decline < 5 && !row.isFirstRow,
          }"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="customDividend[row.code]"
            :precision="4"
            :controls="false"
            size="small"
            class="plan-dividend-input"
            @change="onDividendChange(row.code)"
          />
          <span v-else>{{ formatPercent(row.dividend * 100) }}</span>
        </td>
        <td
          class="bold"
          :class="{
            red: !row.isFirstRow,
            'bg-pink': row.decline < 5 && !row.isFirstRow,
          }"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="customPE[row.code]"
            :precision="2"
            :controls="false"
            size="small"
            class="plan-pe-input"
            @change="onPEChange(row.code)"
          />
          <span v-else>{{ formatNum(row.pe, 2).toFixed(2) }}</span>
        </td>
        <td
          class="bold"
          :class="
            row.decline < 5 && !row.isFirstRow ? 'bg-light-red' : 'bg-green'
          "
        >
          {{ row.decline === 0 ? "-" : formatPercent(row.decline) }}
        </td>
        <td
          v-if="row.exDateRowSpan > 0"
          :rowspan="row.exDateRowSpan"
          class="bold"
        >
          <div v-for="(ex, i) in row.exList" :key="i">{{ ex.exDate }}</div>
        </td>
        <td v-if="row.dpsRowSpan > 0" :rowspan="row.dpsRowSpan" class="bold">
          <div v-for="(ex, i) in row.exList" :key="i">
            {{ getCurrencyPrefix(row.code) }}{{ Number(ex.dps.toFixed(4)) }}
          </div>
        </td>
        <td
          v-if="row.annualDpsRowSpan > 0"
          :rowspan="row.annualDpsRowSpan"
          class="bold bg-pink red"
        >
          <div>
            {{ getCurrencyPrefix(row.code)
            }}{{ row.annualDps ? row.annualDps.toFixed(2) : "-" }}
          </div>
          <div v-if="row.adjustedAnnualDps !== undefined">
            {{ getCurrencyPrefix(row.code)
            }}{{ row.adjustedAnnualDps.toFixed(2) }}
          </div>
        </td>
        <td class="bold">
          {{ row.quantity || "-" }}
        </td>
        <td class="bold">
          <template
            v-if="row.totalMarketCap !== undefined && row.totalMarketCap > 0"
          >
            <template v-if="canConvertToCNY(row.code)">
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ row.totalMarketCap.toFixed(0) }}
              </div>
              <div>￥{{ (row.totalMarketCap / exchangeRate).toFixed(0) }}</div>
            </template>
            <template v-else>
              {{ getCurrencyPrefix(row.code)
              }}{{ row.totalMarketCap.toFixed(0) }}
            </template>
          </template>
          <template v-else-if="row.quantity && row.price">
            <template v-if="canConvertToCNY(row.code)">
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ (row.quantity * row.price).toFixed(0) }}
              </div>
              <div>
                ￥{{ ((row.quantity * row.price) / exchangeRate).toFixed(0) }}
              </div>
            </template>
            <template v-else>
              {{ getCurrencyPrefix(row.code)
              }}{{ (row.quantity * row.price).toFixed(0) }}
            </template>
          </template>
          <span v-else>-</span>
        </td>
        <td
          v-if="row.remarkRowSpan > 0"
          :rowspan="row.remarkRowSpan"
          class="remark-cell"
        >
          {{ row.remark }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss">
.stock-pool-table {
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 13px;
  color: #000;
  margin-top: 16px;

  th,
  td {
    line-height: 22px;
    white-space: nowrap;
    padding: 4px 6px;
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

  // 消除表头底部与表体顶部边框叠加：表体第一行去掉上边框
  tbody tr:first-child td {
    border-top-width: 0;
  }

  .bold {
    font-weight: bold;
  }

  .light-blue {
    color: #00a3f5;
  }

  .blue {
    color: #2972f4;
  }

  .red {
    color: #ff0000;
  }

  .orange {
    color: #f88825;
  }

  .bg-green {
    background-color: #00b050;
  }

  .bg-pink {
    background-color: #ffe9e8;
  }

  .bg-light-red {
    background-color: #ff9c99;
  }

  .stock-link {
    font-weight: bold;
    color: #00a3f5;
    text-decoration: underline;
    cursor: pointer;
  }

  .stock-code {
    font-size: 12px;
    color: #888;
    font-weight: normal;
  }

  .plan-price-input {
    width: 80px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: #2972f4;
      padding: 1px 4px;
    }
  }

  .plan-dividend-input {
    width: 70px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: #ff0000;
      padding: 1px 4px;
    }
  }

  .plan-pe-input {
    width: 60px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: #ff0000;
      padding: 1px 4px;
    }
  }

  .remark-cell {
    white-space: normal;
    max-width: 140px;
    text-align: left;
  }
}
</style>
