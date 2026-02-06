<script setup lang="ts">
import { ref } from "vue";
import AppTable, { type TableColumn } from "../shared/app-table.vue";
import { data } from "../../service/data";
import { computed } from "vue";
import { type Assign, type PrimaryBusinessData } from "../../../types";
import { stockData } from "../../../types/stocks";

type MergeData = Assign<
  [
    PrimaryBusinessData,
    {
      name: string;
    },
  ]
>;

const props = defineProps<{
  codes: {
    code: keyof typeof data;
    compareItems?: {
      industry: string[];
      product: string[];
      region: string[];
    };
  }[];
}>();

const description = `1. 对比主营业务分析`;

const compareData = props.codes.reduce((pre: MergeData[], item) => {
  const name = stockData.find((v) => v.code === item.code)?.name ?? "";

  let arr: MergeData[] = [];

  if (item.compareItems) {
    for (const primaryData of data[item.code].primaryBusinessData) {
      switch (primaryData.mainType) {
        case "行业":
          if (
            item.compareItems.industry.length
              ? item.compareItems.industry.some((v) =>
                  primaryData.itemName.includes(v),
                )
              : true
          ) {
            arr.push({
              ...primaryData,
              name,
            });
          }
          break;
        case "产品":
          if (
            item.compareItems.product.length
              ? item.compareItems.product.some((v) =>
                  primaryData.itemName.includes(v),
                )
              : true
          ) {
            arr.push({
              ...primaryData,
              name,
            });
          }
          break;
        case "地区":
          if (
            item.compareItems.region.length
              ? item.compareItems.region.some((v) =>
                  primaryData.itemName.includes(v),
                )
              : true
          ) {
            arr.push({
              ...primaryData,
              name,
            });
          }
          break;
        default:
          break;
      }
    }
  } else {
    arr = data[item.code].primaryBusinessData.map((v) => ({
      ...v,
      name,
    }));
  }

  return pre.concat(arr);
}, []);

// 定义表格列
const columns: TableColumn[] = [
  {
    key: "year",
    title: "年份",
    merge: {
      enable: true,
    },
  },
  {
    key: "name",
    title: "公司",
    merge: {
      enable: true,
    },
  },
  {
    key: "itemName",
    title: "类型",
  },
  {
    key: "mainBusinessIncome",
    title: "主营收入",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbiRatio",
    title: "收入比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "mainBusinessCost",
    title: "主营成本",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbcRatio",
    title: "成本比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "mainBusinessProfit",
    title: "主营利润",
    formatter: (value: number) => (value / 100000000).toFixed(2),
  },
  {
    key: "mbpRatio",
    title: "利润比例",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
  {
    key: "grossProfitRatio",
    title: "毛利率",
    formatter: (value: number) =>
      isNaN(value) ? "-" : (value * 100).toFixed(2) + "%",
  },
];

const tableData = computed(() => {
  // 获取原始数据并确保有足够的数据点
  const originalData = compareData.slice(0, compareData.length);
  if (originalData.length < 2) return originalData.reverse();

  // 按年份升序排序
  const sortedData = [...originalData].sort(
    (a, b) => parseInt(a.year) - parseInt(b.year),
  );

  return sortedData;
});

const industryTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "行业"),
);

const productTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "产品"),
);

const regionTableData = computed(() =>
  tableData.value.filter((v) => v.mainType === "地区"),
);

const activeTab = ref<"industry" | "product" | "region">("industry");

const currentTableData = computed(() => {
  switch (activeTab.value) {
    case "industry":
      return industryTableData.value;
    case "product":
      return productTableData.value;
    case "region":
      return regionTableData.value;
  }
});

const currentCaption = computed(() => {
  switch (activeTab.value) {
    case "industry":
      return "主营业务数据（行业）";
    case "product":
      return "主营业务数据（产品）";
    case "region":
      return "主营业务数据（地区）";
  }
});
</script>

<template>
  <div class="tabs">
    <button
      :class="{ active: activeTab === 'industry' }"
      @click="activeTab = 'industry'"
    >
      行业
    </button>
    <button
      :class="{ active: activeTab === 'product' }"
      @click="activeTab = 'product'"
    >
      产品
    </button>
    <button
      :class="{ active: activeTab === 'region' }"
      @click="activeTab = 'region'"
    >
      地区
    </button>
  </div>

  <AppTable
    v-if="currentTableData.length"
    :data="currentTableData"
    :columns="columns"
    :caption="currentCaption"
    default-selected-key="mainBusinessIncome"
    group-key="itemName"
    :description="description"
  />
</template>

<style scoped lang="scss">
.tabs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.tabs button.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}
</style>
