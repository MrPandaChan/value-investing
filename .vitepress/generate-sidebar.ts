/**
 * 自动化侧边栏生成脚本
 *
 * 扫描 industry/ 目录，动态生成 VitePress sidebar。
 * - 每个行业下按「行业总览」「公司A」「公司B」…分为独立分组
 * - 全部分组默认展开，不折叠
 *
 * 目录结构：
 *   industry/
 *     石油石化/
 *       石油石化/index.md      ← 行业总览
 *       中国海油/index.md      ← 公司
 *       中国海油/notes/        ← 笔记（扁平铺开）
 *       中国海油/tracking/     ← 跟踪（扁平铺开）
 */

import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type SidebarItem = {
  text: string;
  link?: string;
  items?: SidebarItem[];
};

type SidebarConfig = Record<string, SidebarItem[]>;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDUSTRY_DIR = join(ROOT, "industry");

/** 公司文档模块的中文标签 */
const MODULE_LABELS: Record<string, string> = {
  index: "公司总览",
  "business-model": "商业模式",
  moat: "护城河",
  financials: "财务分析",
  "8d-analysis": "八维分析",
  valuation: "估值",
  risk: "风险",
};

function getModuleName(filename: string): string {
  return filename.replace(/\.md$/, "");
}

function getDisplayName(name: string): string {
  if (MODULE_LABELS[name]) return MODULE_LABELS[name];
  if (/[\u4e00-\u9fff]/.test(name)) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");
}

/**
 * 构建公司分组（全部展开，不折叠）
 * 公司下所有文档（含 notes/tracking）扁平列出
 */
function buildCompanyGroup(
  industryName: string,
  companyName: string,
  companyDir: string
): SidebarItem {
  const prefix = `/industry/${industryName}/${companyName}`;
  const items: SidebarItem[] = [{ text: "公司总览", link: `${prefix}/index` }];

  const entries = readdirSync(companyDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(companyDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "tracking" || entry.name === "notes") {
        const subFiles = readdirSync(fullPath).filter((f) => f.endsWith(".md"));
        const label = entry.name === "tracking" ? "跟踪" : "笔记";

        for (const f of subFiles) {
          items.push({
            text: `${label}：${getDisplayName(getModuleName(f))}`,
            link: `${prefix}/${entry.name}/${getModuleName(f)}`,
          });
        }
      }
    } else if (
      entry.name.endsWith(".md") &&
      getModuleName(entry.name) !== "index"
    ) {
      const moduleName = getModuleName(entry.name);
      items.push({
        text: getDisplayName(moduleName),
        link: `${prefix}/${moduleName}`,
      });
    }
  }

  return { text: companyName, items };
}

/**
 * 构建行业总览分组
 */
function buildIndustryOverviewGroup(
  industryDir: string,
  industryName: string
): SidebarItem | null {
  const selfDir = join(industryDir, industryName);
  if (!existsSync(join(selfDir, "index.md"))) return null;

  const prefix = `/industry/${industryName}/${industryName}`;
  const items: SidebarItem[] = [{ text: "行业总览", link: `${prefix}/index` }];

  // 行业资料目录下其他 md 文件
  const entries = readdirSync(selfDir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      entry.name !== "index.md"
    ) {
      const mod = getModuleName(entry.name);
      items.push({ text: getDisplayName(mod), link: `${prefix}/${mod}` });
    }
  }

  return { text: industryName, items };
}

/**
 * 扫描单个行业 → 返回分组数组
 */
function scanIndustry(
  industryDir: string,
  industryName: string
): SidebarItem[] | null {
  const groups: SidebarItem[] = [];

  // 1. 行业总览分组
  const overview = buildIndustryOverviewGroup(industryDir, industryName);
  if (overview) groups.push(overview);

  // 2. 公司分组
  const entries = readdirSync(industryDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === industryName) continue; // 跳过同名资料目录

    const companyDir = join(industryDir, entry.name);
    if (!existsSync(join(companyDir, "index.md"))) continue;

    groups.push(buildCompanyGroup(industryName, entry.name, companyDir));
  }

  return groups.length > 0 ? groups : null;
}

export function generateSidebar(): SidebarConfig {
  const sidebar: SidebarConfig = {};

  if (!existsSync(INDUSTRY_DIR)) return sidebar;

  for (const entry of readdirSync(INDUSTRY_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const groups = scanIndustry(join(INDUSTRY_DIR, entry.name), entry.name);
    if (groups) {
      sidebar[`/industry/${entry.name}/`] = groups;
    }
  }

  return sidebar;
}

/** 获取行业树（用于总览页） */
export function getIndustryTree() {
  const tree: {
    name: string;
    route: string;
    companies: { name: string; route: string }[];
  }[] = [];
  if (!existsSync(INDUSTRY_DIR)) return tree;

  for (const e of readdirSync(INDUSTRY_DIR, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const dir = join(INDUSTRY_DIR, e.name);
    const companies: { name: string; route: string }[] = [];

    for (const s of readdirSync(dir, { withFileTypes: true })) {
      if (!s.isDirectory() || s.name === e.name) continue;
      if (existsSync(join(dir, s.name, "index.md"))) {
        companies.push({
          name: s.name,
          route: `/industry/${e.name}/${s.name}/`,
        });
      }
    }

    if (companies.length > 0 || existsSync(join(dir, e.name, "index.md"))) {
      tree.push({
        name: e.name,
        route: `/industry/${e.name}/${e.name}/`,
        companies,
      });
    }
  }

  return tree;
}
