<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import filesMap from "virtual:company-files";
import type { CompanyFilesData } from "../../generate-sidebar.js";

const { page } = useData();

const currentData = computed<CompanyFilesData | null>(() => {
  const route = page.value.filePath;
  // 匹配 /industry/{行业}/{公司}/index.md 模式
  const match = route.match(/^industry\/([^/]+)\/([^/]+)\/index\.md$/);
  if (!match) return null;

  const key = `/industry/${match[1]}/${match[2]}/`;
  return (filesMap as Record<string, CompanyFilesData>)[key] ?? null;
});

const hasContent = computed(() => {
  const d = currentData.value;
  if (!d) return false;
  return d.files.length > 0 || d.tracking.length > 0 || d.notes.length > 0;
});
</script>

<template>
  <div v-if="hasContent" class="company-menu">
    <div class="menu-title">文档目录</div>
    <nav class="menu-list">
      <a
        v-for="item in currentData!.files"
        :key="item.link"
        :href="withBase(item.link)"
        class="menu-item"
      >
        {{ item.label }}
      </a>
      <template v-if="currentData!.tracking.length > 0">
        <div class="menu-group-label">企业跟踪</div>
        <a
          v-for="item in currentData!.tracking"
          :key="item.link"
          :href="withBase(item.link)"
          class="menu-item menu-sub"
        >
          {{ item.label }}
        </a>
      </template>
      <template v-if="currentData!.notes.length > 0">
        <div class="menu-group-label">笔记</div>
        <a
          v-for="item in currentData!.notes"
          :key="item.link"
          :href="withBase(item.link)"
          class="menu-item menu-sub"
        >
          {{ item.label }}
        </a>
      </template>
    </nav>
  </div>
</template>

<style scoped>
.company-menu {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-border);
}

.menu-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.menu-item {
  display: inline-block;
  font-size: 13px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  padding: 4px 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  transition: all 0.15s;
}

.menu-item:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.menu-group-label {
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  margin-top: 8px;
  padding: 2px 0;
}

.menu-sub {
  font-size: 12px;
  opacity: 0.85;
}
</style>
