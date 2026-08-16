<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";
import tree from "virtual:industry-tree";

type CompanyNode = { name: string; route: string };
type SegmentNode = {
  name: string;
  route: string;
  companies: CompanyNode[];
};
type IndustryNode = {
  name: string;
  route: string;
  segments: SegmentNode[];
  companies: CompanyNode[];
};

const industries = tree as IndustryNode[];

const totalSegments = computed(() =>
  industries.reduce((s, i) => s + i.segments.length, 0),
);

const totalCompanies = computed(() =>
  industries.reduce(
    (s, i) =>
      s +
      i.companies.length +
      i.segments.reduce((x, seg) => x + seg.companies.length, 0),
    0,
  ),
);

function companyCount(ind: IndustryNode): number {
  return (
    ind.companies.length +
    ind.segments.reduce((s, seg) => s + seg.companies.length, 0)
  );
}
</script>

<template>
  <div class="root">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">行业与企业</h1>
      <p class="hero-sub">
        {{ industries.length }} 个行业 · {{ totalSegments }} 条赛道 ·
        {{ totalCompanies }} 家公司深度研究
      </p>
      <nav class="hero-links">
        <a
          :href="withBase('/value-investing/投资计划/投资计划')"
          class="hero-btn"
        >
          <span class="hero-btn-icon">→</span>
          查看投资计划
        </a>
      </nav>
    </section>

    <!-- 行业列表 -->
    <section class="industries">
      <article v-for="ind in industries" :key="ind.name" class="industry">
        <header class="industry-header">
          <a :href="withBase(ind.route)" class="industry-name">
            {{ ind.name }}
          </a>
          <span class="industry-meta">
            <template v-if="ind.segments.length">
              {{ ind.segments.length }} 赛道
            </template>
            <span
              v-if="ind.segments.length && companyCount(ind)"
              class="meta-dot"
              >·</span
            >
            {{ companyCount(ind) }} 家公司
          </span>
        </header>

        <!-- 拆赛道：按赛道分组展示 -->
        <div v-if="ind.segments.length" class="segments">
          <div v-for="seg in ind.segments" :key="seg.name" class="segment">
            <a :href="withBase(seg.route)" class="segment-name">
              {{ seg.name }}
            </a>
            <div class="segment-companies">
              <a
                v-for="c in seg.companies"
                :key="c.route"
                :href="withBase(c.route)"
                class="company-tag"
              >
                {{ c.name }}
              </a>
              <span v-if="!seg.companies.length" class="segment-empty">
                暂无公司 · 待研究
              </span>
            </div>
          </div>
        </div>

        <!-- 不拆赛道：直接列公司 -->
        <div v-else class="companies">
          <a
            v-for="c in ind.companies"
            :key="c.route"
            :href="withBase(c.route)"
            class="company-tag"
          >
            {{ c.name }}
          </a>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.root {
  width: 100%;
  padding: 40px clamp(16px, 4vw, 64px) 80px;
  box-sizing: border-box;
}

/* ===== Hero ===== */
.hero {
  text-align: center;
  margin-bottom: 40px;
}
.hero-title {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0 0 10px;
  background: linear-gradient(
    135deg,
    var(--vp-c-brand-1) 0%,
    var(--vp-c-brand-2) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0 0 22px;
}
.hero-links {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  padding: 8px 20px;
  text-decoration: none;
  transition: all 0.2s;
}
.hero-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.hero-btn-icon {
  font-size: 15px;
  transition: transform 0.2s;
}
.hero-btn:hover .hero-btn-icon {
  transform: translateX(3px);
}

/* ===== 行业网格 ===== */
.industries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  /* 不设置 align-items，默认 stretch：同一行卡片等高，消除底部参差空白 */
}

.industry {
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 20px 22px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.industry:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12);
}

.industry-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.industry-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: opacity 0.2s;
}
.industry-name:hover {
  opacity: 0.75;
}
.industry-meta {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
.meta-dot {
  margin: 0 4px;
}

/* ===== 赛道分组 ===== */
.segments {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.segment {
  padding-left: 12px;
  border-left: 2px solid var(--vp-c-divider);
  transition: border-color 0.2s;
}
.segment:hover {
  border-left-color: var(--vp-c-brand-1);
}
.segment-name {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  margin-bottom: 7px;
  transition: color 0.2s;
}
.segment-name:hover {
  color: var(--vp-c-brand-1);
}
.segment-companies {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ===== 公司 tag ===== */
.companies {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
}
.company-tag {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 4px 10px;
  text-decoration: none;
  transition: all 0.15s;
}
.company-tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.segment-empty {
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-style: italic;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .root {
    padding: 24px 16px 60px;
  }
  .industries {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 28px;
  }
}
</style>
