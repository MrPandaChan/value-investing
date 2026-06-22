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
 *       中国海油/notes/        ← 笔记（collapsed 分组）
 *       中国海油/tracking/     ← 跟踪（collapsed 分组）
 */

import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type SidebarItem = {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
};

type SidebarConfig = Record<string, SidebarItem[]>;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDUSTRY_DIR = join(ROOT, "industry");

/** 公司文档模块的中文标签 */
const MODULE_LABELS: Record<string, string> = {
  index: "公司总览",
  "business-model": "商业模式",
  "ai-report": "AI分析报告",
  moat: "护城河",
  financials: "财务分析",
  "8d-analysis": "八维分析",
  insights: "insights",
  valuation: "估值和结论",
  risk: "风险",
};

/** 公司侧边栏排序权重（数字越小越靠前） */
const ITEM_ORDER: Record<string, number> = {
  公司总览: 0,
  商业模式: 1,
  财务分析: 2,
  八维分析: 3,
  AI分析报告: 4,
  insights: 5,
  估值和结论: 6,
  企业跟踪: 7,
  笔记: 8,
};

function getSortKey(item: SidebarItem): number {
  // 笔记：以 "笔记：" 开头
  if (item.text?.startsWith("笔记：")) return ITEM_ORDER["笔记"] ?? 7;
  // 按文本精确匹配
  if (item.text && item.text in ITEM_ORDER) return ITEM_ORDER[item.text];
  // 兜底排最后
  return 99;
}

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
  companyDir: string,
): SidebarItem {
  const prefix = `/industry/${industryName}/${companyName}`;
  const items: SidebarItem[] = [{ text: "公司总览", link: `${prefix}/index` }];

  const entries = readdirSync(companyDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(companyDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "tracking") {
        // tracking 作为可折叠分组
        const subFiles = readdirSync(fullPath).filter((f) => f.endsWith(".md"));
        if (subFiles.length > 0) {
          items.push({
            text: "企业跟踪",
            collapsed: true,
            items: subFiles.map((f) => ({
              text: getDisplayName(getModuleName(f)),
              link: `${prefix}/tracking/${getModuleName(f)}`,
            })),
          });
        }
      } else if (entry.name === "notes") {
        const subFiles = readdirSync(fullPath).filter((f) => f.endsWith(".md"));
        if (subFiles.length > 0) {
          items.push({
            text: "笔记",
            collapsed: true,
            items: subFiles.map((f) => ({
              text: getDisplayName(getModuleName(f)),
              link: `${prefix}/notes/${getModuleName(f)}`,
            })),
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

  // 按指定顺序排序
  items.sort((a, b) => getSortKey(a) - getSortKey(b));

  return { text: companyName, items };
}

/**
 * 构建行业总览分组
 */
function buildIndustryOverviewGroup(
  industryDir: string,
  industryName: string,
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
  industryName: string,
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

/** 获取所有公司文件映射（用于 company-menu 组件） */
export type CompanyFileEntry = {
  name: string;
  label: string;
  link: string;
};

export type CompanyFilesData = {
  files: CompanyFileEntry[];
  tracking: CompanyFileEntry[];
  notes: CompanyFileEntry[];
};

export function getCompanyFilesMap(): Record<string, CompanyFilesData> {
  const map: Record<string, CompanyFilesData> = {};

  if (!existsSync(INDUSTRY_DIR)) return map;

  for (const industryEntry of readdirSync(INDUSTRY_DIR, { withFileTypes: true })) {
    if (!industryEntry.isDirectory() || industryEntry.name.startsWith(".")) continue;

    const industryDir = join(INDUSTRY_DIR, industryEntry.name);

    for (const companyEntry of readdirSync(industryDir, { withFileTypes: true })) {
      if (!companyEntry.isDirectory()) continue;
      // 跳过行业资料目录（与行业同名的目录）
      if (companyEntry.name === industryEntry.name) continue;

      const companyDir = join(industryDir, companyEntry.name);
      if (!existsSync(join(companyDir, "index.md"))) continue;

      const route = `/industry/${industryEntry.name}/${companyEntry.name}/`;
      const prefix = `/industry/${industryEntry.name}/${companyEntry.name}`;
      const data: CompanyFilesData = { files: [], tracking: [], notes: [] };

      for (const entry of readdirSync(companyDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const subDir = join(companyDir, entry.name);
          if (entry.name === "tracking") {
            const subFiles = readdirSync(subDir).filter((f) => f.endsWith(".md"));
            data.tracking = subFiles.map((f) => {
              const name = getModuleName(f);
              return {
                name,
                label: getDisplayName(name),
                link: `${prefix}/tracking/${name}`,
              };
            });
          } else if (entry.name === "notes") {
            const subFiles = readdirSync(subDir).filter((f) => f.endsWith(".md"));
            data.notes = subFiles.map((f) => {
              const name = getModuleName(f);
              return {
                name,
                label: getDisplayName(name),
                link: `${prefix}/notes/${name}`,
              };
            });
          }
        } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
          const modName = getModuleName(entry.name);
          data.files.push({
            name: modName,
            label: getDisplayName(modName),
            link: `${prefix}/${modName}`,
          });
        }
      }

      // 按 ITEM_ORDER 排序
      data.files.sort((a, b) => {
        const orderA = ITEM_ORDER[a.label] ?? 99;
        const orderB = ITEM_ORDER[b.label] ?? 99;
        return orderA - orderB;
      });

      map[route] = data;
    }
  }

  return map;
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
