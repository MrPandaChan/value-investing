<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { getDynamicData } from "../../../fetch-data/fetch-stock-data";
import { formatNum, formatPercent, isHKCode } from "../../../fetch-data/helper";
import { fetchAllDividendData, type ExItem } from "./fetch-dividend";

interface RowData {
  name: string;
  code: string;
  price: number;
  pe: number;
  dividend: number;
  exList: { dps: number; exDate: string }[];
}

interface MergedRowData extends RowData {
  nameRowSpan: number;
  codeRowSpan: number;
  exDateRowSpan: number;
  dpsRowSpan: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  decline: number;
}

enum PlanType {
  PRICE,
  DIVIDEND,
}

interface BasePlan {
  code: string;
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: number[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: number[];
}

type PlanItem = PricePlan | DividendPlan;

const planList: PlanItem[] = [
  {
    // 腾讯控股
    type: PlanType.PRICE,
    code: "00700",
    price: [420, 400, 380, 360],
  },
  {
    // 云南白药
    type: PlanType.DIVIDEND,
    code: "000538",
    dividend: [0.05, 0.055, 0.06],
  },
  {
    // 分众传媒
    type: PlanType.DIVIDEND,
    code: "002027",
    dividend: [0.065, 0.07, 0.075],
  },
];

const tableData = ref<RowData[]>([]);
const exListMap = ref<Record<string, ExItem[]>>({});

interface GroupMeta {
  planType: PlanType;
  dps: number;
  pricePE: number;
  realPrice: number;
}
const groupMetaMap = ref<Record<string, GroupMeta>>({});
const customPrice = reactive<Record<string, number>>({});
const customDividend = reactive<Record<string, number>>({});
const customPE = reactive<Record<string, number>>({});

async function init() {
  tableData.value = [];
  const stockCodes = planList.map((v) => v.code);
  const [dynamicDataList, exListMapResult] = await Promise.all([
    getDynamicData([...stockCodes, "133.CNHHKD"]),
    fetchAllDividendData(stockCodes),
  ]);
  exListMap.value = exListMapResult;
  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  let exchangeRate = 1.1555;
  if (exchangeTarget) {
    exchangeRate = exchangeTarget.price / 100;
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
      const exList = exListMap.value[code] || [];
      const dps = exList.reduce((pre, cur) => pre + cur.dps, 0);
      groupMetaMap.value[code] = {
        planType: item.type,
        dps,
        pricePE,
        realPrice: price,
      };
      tableData.value.push({
        name,
        code,
        price,
        pe: pricePE,
        dividend: dps / price,
        exList,
      });
      if (item.type === PlanType.PRICE) {
        for (const v of item.price) {
          tableData.value.push({
            name,
            code,
            price: v,
            pe: pricePE * (v / price),
            dividend: dps / v,
            exList,
          });
        }
      } else if (item.type === PlanType.DIVIDEND) {
        for (const v of item.dividend) {
          const targetPrice = dps / v;
          tableData.value.push({
            name,
            code,
            price: targetPrice,
            pe: pricePE * (targetPrice / price),
            dividend: v,
            exList,
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
}

function formatPrice(price: number, code: string): string {
  const prefix = isHKCode(code) ? "HK$" : "￥";
  return `${prefix}${formatNum(price, 2).toFixed(2)}`;
}

function onPriceChange(code: string) {
  const meta = groupMetaMap.value[code];
  const price = customPrice[code];
  if (meta && price > 0) {
    customDividend[code] = meta.dps / price;
    customPE[code] = meta.pricePE * (price / meta.realPrice);
  }
}

function onDividendChange(code: string) {
  const meta = groupMetaMap.value[code];
  const dividend = customDividend[code];
  if (meta && dividend > 0) {
    customPrice[code] = meta.dps / dividend;
    customPE[code] = meta.pricePE * (customPrice[code] / meta.realPrice);
  }
}

function onPEChange(code: string) {
  const meta = groupMetaMap.value[code];
  const pe = customPE[code];
  if (meta && pe > 0) {
    customPrice[code] = meta.realPrice * (pe / meta.pricePE);
    customDividend[code] = meta.dps / customPrice[code];
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

    group.forEach((row, index) => {
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

      const decline = index === 0 ? 0 : ((realPrice - price) / realPrice) * 100;

      result.push({
        ...row,
        price,
        dividend,
        pe,
        nameRowSpan: index === 0 ? group.length : 0,
        codeRowSpan: index === 0 ? group.length : 0,
        exDateRowSpan: index === 0 ? group.length : 0,
        dpsRowSpan: index === 0 ? group.length : 0,
        isFirstRow: index === 0,
        isLastRow: isLast,
        decline,
      });
    });
  }

  return result;
});
</script>

<template>
  <el-button type="primary" @click="init">手动刷新（避免高频调用）</el-button>

  <table v-if="mergedTableData.length" class="stock-pool-table">
    <thead>
      <tr>
        <th class="bold light-blue">股票名称</th>
        <th class="bold light-blue">代码</th>
        <th class="bold blue">当前股价</th>
        <th class="bold red">股息率</th>
        <th class="bold red">PE_TTM</th>
        <th class="bold bg-green">还能跌</th>
        <th class="bold">除权除息时间</th>
        <th class="bold">每股分红</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, idx) in mergedTableData"
        :key="idx"
        :class="{ 'real-time-row': row.isFirstRow }"
      >
        <td v-if="row.nameRowSpan > 0" :rowspan="row.nameRowSpan" class="bold">
          {{ row.name }}
        </td>
        <td v-if="row.codeRowSpan > 0" :rowspan="row.codeRowSpan" class="bold">
          {{ row.code }}
        </td>
        <td class="bold" :class="{ blue: !row.isFirstRow }">
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
        <td class="bold" :class="{ red: !row.isFirstRow }">
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
        <td class="bold" :class="{ red: !row.isFirstRow }">
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
        <td class="bold bg-green">
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
          <div v-for="(ex, i) in row.exList" :key="i">{{ ex.dps }}</div>
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
    padding: 4px 8px;
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
    width: 90px;

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
}
</style>
