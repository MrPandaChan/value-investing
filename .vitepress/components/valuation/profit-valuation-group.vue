<script setup lang="ts">
import { getStockItem } from "../../../types/stocks";
import profitValuation from "./profit-valuation.vue";
import { data } from "../../service/data";

const props = defineProps<{
  code: string;
}>();

const stockItem = getStockItem(props.code);
</script>

<template>
  <div class="profit-valuation-group-container">
    <template v-if="stockItem.profitValuationConfig">
      <profitValuation
        v-if="stockItem.profitValuationConfig?.specialOffer"
        class="valuation-item"
        :code="props.code"
        caption="特价估算"
        :growth="stockItem.profitValuationConfig?.specialOffer"
      />
      <profitValuation
        v-if="stockItem.profitValuationConfig?.conservative"
        class="valuation-item"
        :code="props.code"
        caption="保守估算"
        :growth="stockItem.profitValuationConfig?.conservative"
      />
      <profitValuation
        v-if="stockItem.profitValuationConfig?.neutral"
        class="valuation-item"
        :code="props.code"
        caption="均值估算"
        :growth="stockItem.profitValuationConfig?.neutral"
      />
      <profitValuation
        v-if="stockItem.profitValuationConfig?.optimistic"
        class="valuation-item"
        :code="props.code"
        caption="激进估算"
        :growth="stockItem.profitValuationConfig?.optimistic"
      />
    </template>
    <span v-else>请设置 profitValuationConfig</span>
  </div>
</template>

<style lang="scss" scoped>
.profit-valuation-group-container {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -6px;

  .valuation-item {
    margin: 0 6px;
  }
}
</style>
