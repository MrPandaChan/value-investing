<script lang="ts" setup>
import { computed } from "vue";
import { stocks, TagKey, type StockTag } from "../../my-data/stock-pool";

const props = defineProps<{
  /** 股票代码，用于从股票池中查询 tags 与 remark */
  code: string;
  /** 显示名称（名称来自行情数据，需由调用方传入） */
  name?: string;
}>();

const stock = computed(() => stocks.find((s) => s.code === props.code));

/** 标签 → CSS 类名（配色） */
const TAG_CLASS: Record<string, string> = {
  [TagKey.DOMESTIC]: "tag-domestic",
  [TagKey.EXPORT]: "tag-export",
  [TagKey.RATE]: "tag-rate",
  [TagKey.COMMODITY]: "tag-commodity",
  [TagKey.FX]: "tag-fx",
  [TagKey.POLICY]: "tag-policy",
  [TagKey.LOW_LIQUIDITY]: "tag-liquidity",
};

interface TagBadge {
  key: TagKey;
  text: string;
  className: string;
  /** weight >= 1 视为强依赖，加粗显示 */
  strong: boolean;
}

const badges = computed<TagBadge[]>(() => {
  const tags = stock.value?.tags;
  if (!tags) return [];
  return tags
    .filter((t) => (t.weight ?? 1) > 0)
    .map((t) => {
      const w = t.weight ?? 1;
      return {
        key: t.tag,
        text: w >= 1 ? t.tag : `${t.tag}${w}`,
        className: TAG_CLASS[t.tag] ?? "tag-default",
        strong: w >= 1,
      };
    });
});

/** 备注：剥离 markdown 符号，转为纯文本 */
const remarkText = computed(() =>
  stock.value?.remark ? stock.value.remark.replace(/\*\*/g, "") : "",
);
</script>

<template>
  <el-popover
    placement="bottom-start"
    :width="320"
    trigger="hover"
    popper-class="extra-info-popper"
  >
    <template #reference>
      <slot />
    </template>

    <div class="extra-info-body">
      <div class="extra-info-header">
        <span v-if="name" class="extra-info-name">{{ name }}</span>
        <span class="extra-info-code">{{ code }}</span>
      </div>

      <template v-if="badges.length">
        <div class="extra-info-section-title">共同依赖</div>
        <div class="extra-info-tags">
          <span
            v-for="b in badges"
            :key="b.key"
            class="tag-badge"
            :class="[b.className, { strong: b.strong }]"
            >{{ b.text }}</span
          >
        </div>
      </template>

      <template v-if="remarkText">
        <div class="extra-info-section-title">备注</div>
        <div class="extra-info-remark">{{ remarkText }}</div>
      </template>

      <!-- 扩展位：更多额外信息通过具名插槽注入 -->
      <slot name="extra" />
    </div>
  </el-popover>
</template>

<style lang="scss">
.extra-info-popper {
  .extra-info-body {
    font-size: 12px;
    line-height: 1.7;
  }

  .extra-info-header {
    font-weight: bold;
    margin-bottom: 6px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .extra-info-name {
    font-size: 14px;
  }

  .extra-info-code {
    font-weight: normal;
    opacity: 0.6;
  }

  .extra-info-section-title {
    font-weight: bold;
    margin: 8px 0 4px;
    font-size: 12px;
    opacity: 0.8;
  }

  .extra-info-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .tag-badge {
    display: inline-block;
    font-size: 11px;
    line-height: 16px;
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;

    &.strong {
      font-weight: bold;
    }
  }

  .tag-domestic {
    background-color: rgba(41, 114, 244, 0.15);
    color: #2972f4;
  }
  .tag-export {
    background-color: rgba(0, 176, 80, 0.15);
    color: #00a84a;
  }
  .tag-rate {
    background-color: rgba(255, 0, 0, 0.12);
    color: #d92020;
  }
  .tag-commodity {
    background-color: rgba(248, 136, 37, 0.16);
    color: #c96a12;
  }
  .tag-fx {
    background-color: rgba(123, 97, 255, 0.14);
    color: #6d4fd6;
  }
  .tag-policy {
    background-color: rgba(0, 0, 0, 0.08);
    color: #666;
  }
  .tag-liquidity {
    background-color: rgba(180, 132, 60, 0.16);
    color: #8a6a2f;
  }
  .tag-default {
    background-color: rgba(0, 0, 0, 0.08);
  }

  .extra-info-remark {
    white-space: normal;
  }
}

html.dark .extra-info-popper {
  .tag-domestic {
    background-color: rgba(136, 187, 255, 0.18);
    color: #88bbff;
  }
  .tag-export {
    background-color: rgba(102, 238, 102, 0.16);
    color: #66ee66;
  }
  .tag-rate {
    background-color: rgba(255, 136, 136, 0.16);
    color: #ff8888;
  }
  .tag-commodity {
    background-color: rgba(255, 184, 96, 0.18);
    color: #ffb860;
  }
  .tag-fx {
    background-color: rgba(160, 140, 255, 0.18);
    color: #a08cff;
  }
  .tag-policy {
    background-color: rgba(255, 255, 255, 0.12);
    color: #bbb;
  }
  .tag-liquidity {
    background-color: rgba(210, 165, 100, 0.18);
    color: #d2a564;
  }
  .tag-default {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
