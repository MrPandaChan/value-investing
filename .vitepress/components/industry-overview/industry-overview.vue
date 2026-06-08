<script setup lang="ts">
import { withBase } from "vitepress";
import tree from "./industry-tree.json";

const industries = tree as {
  name: string;
  route: string;
  companies: { name: string; route: string }[];
}[];
const total = industries.reduce((s, i) => s + i.companies.length, 0);
</script>

<template>
  <div class="root">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">行业与企业</h1>
      <p class="hero-sub">
        {{ industries.length }} 个行业覆盖 · {{ total }} 家公司深度研究
      </p>
      <nav class="hero-links">
        <a
          :href="withBase('/value-investing/frameworks/stock-pool')"
          class="hero-btn"
        >
          <span class="hero-btn-icon">→</span>
          查看股票池
        </a>
      </nav>
    </section>

    <!-- Grid -->
    <section class="grid">
      <a
        v-for="ind in industries"
        :key="ind.name"
        :href="withBase(ind.route)"
        class="card"
      >
        <div class="card-top">
          <h3 class="card-name">{{ ind.name }}</h3>
          <span class="card-count">{{ ind.companies.length }}</span>
        </div>

        <div v-if="ind.companies.length" class="card-companies">
          <span v-for="c in ind.companies" :key="c.route" class="card-tag">
            {{ c.name }}
          </span>
        </div>
        <div v-else class="card-note">行业研究笔记</div>
      </a>
    </section>
  </div>
</template>

<style scoped>
.root {
  max-width: 1800px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-title {
  font-size: 34px;
  line-height: 34px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.card {
  display: block;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  padding: 20px 22px 18px;
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  margin: 0;
}
.card-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 20px;
  padding: 2px 10px;
  flex-shrink: 0;
}
.card-companies {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.card-tag {
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border-radius: 5px;
  padding: 3px 9px;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.card:hover .card-tag {
  border-color: var(--vp-c-border);
}
.card-note {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>
