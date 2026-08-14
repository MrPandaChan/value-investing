/**
 * 自动化侧边栏生成脚本
 *
 * 扫描 industry/ 目录，动态生成 VitePress sidebar。
 *
 * 目录结构（三级：一级行业 → 细分赛道 → 公司）：
 *   industry/
 *     汽车/                          ← 一级行业（申万）
 *       投研资料/行业总览.md          ← 一级行业总览
 *       乘用车/                      ← 细分赛道
 *         投研资料/行业总览.md        ← 赛道总览
 *         比亚迪/index.md            ← 公司
 *         比亚迪/notes/              ← 笔记（collapsed 分组）
 *         比亚迪/tracking/           ← 跟踪（collapsed 分组）
 *
 * 不拆赛道的行业（如煤炭、银行），公司直接挂一级行业下：
 *   industry/
 *     煤炭/
 *       投研资料/行业总览.md
 *       中国神华/index.md
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
  // 日期文件名（如 2026-08-11）保留 "-"，不做转空格处理
  if (/^\d{4}-\d{1,2}(-\d{1,2})?$/.test(name)) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");
}

/** 判断目录是否为「赛道」：赛道下含投研资料目录 */
function isSegment(dir: string): boolean {
  return existsSync(join(dir, "投研资料"));
}

/** 判断目录是否为「公司」：含 index.md */
function isCompany(dir: string): boolean {
  return existsSync(join(dir, "index.md"));
}

/**
 * 构建公司分组（全部展开，不折叠）
 * 公司下所有文档（含 notes/tracking）扁平列出
 */
function buildCompanyGroup(
  routePrefix: string,
  companyName: string,
  companyDir: string,
): SidebarItem {
  const prefix = `${routePrefix}/${companyName}`;
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
 * 构建「投研资料」目录下的侧边栏 items
 * （行业总览/赛道总览 + 其他 md + notes 子目录）
 */
function buildTouyanItems(
  touyanDir: string,
  prefix: string,
  overviewText: string,
): SidebarItem[] {
  const items: SidebarItem[] = [];

  if (existsSync(join(touyanDir, "行业总览.md"))) {
    items.push({ text: overviewText, link: `${prefix}/行业总览` });
  }

  // 投研资料目录下其他 md 文件
  for (const f of readdirSync(touyanDir)) {
    if (f === "行业总览.md" || !f.endsWith(".md")) continue;
    const mod = getModuleName(f);
    items.push({ text: getDisplayName(mod), link: `${prefix}/${mod}` });
  }

  // notes 子目录
  const notesDir = join(touyanDir, "notes");
  if (existsSync(notesDir)) {
    const subFiles = readdirSync(notesDir).filter((f) => f.endsWith(".md"));
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

  return items;
}

/**
 * 扫描单个一级行业 → 返回分组数组
 */
function scanIndustry(
  industryDir: string,
  industryName: string,
): SidebarItem[] | null {
  const groups: SidebarItem[] = [];
  const industryPrefix = `/industry/${industryName}`;

  // 1. 一级行业投研资料（行业总览 + 其他资料）
  const industryTouyan = join(industryDir, "投研资料");
  if (existsSync(industryTouyan)) {
    groups.push(
      ...buildTouyanItems(
        industryTouyan,
        `${industryPrefix}/投研资料`,
        "行业总览",
      ),
    );
  }

  // 2. 赛道 / 公司
  for (const entry of readdirSync(industryDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    if (entry.name === "投研资料") continue;

    const subDir = join(industryDir, entry.name);

    if (isSegment(subDir)) {
      // 赛道：赛道总览 + 赛道资料 + 公司
      const segPrefix = `${industryPrefix}/${entry.name}`;
      const segmentItems: SidebarItem[] = buildTouyanItems(
        join(subDir, "投研资料"),
        `${segPrefix}/投研资料`,
        "赛道总览",
      );

      for (const c of readdirSync(subDir, { withFileTypes: true })) {
        if (!c.isDirectory() || c.name.startsWith(".")) continue;
        if (c.name === "投研资料") continue;
        const companyDir = join(subDir, c.name);
        if (isCompany(companyDir)) {
          segmentItems.push(buildCompanyGroup(segPrefix, c.name, companyDir));
        }
      }

      groups.push({ text: entry.name, items: segmentItems, collapsed: false });
    } else if (isCompany(subDir)) {
      // 不拆赛道的行业：公司直接挂一级
      groups.push(buildCompanyGroup(industryPrefix, entry.name, subDir));
    }
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

/** 构建单个公司的文件映射 */
function buildCompanyFiles(
  companyDir: string,
  prefix: string,
): CompanyFilesData {
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

  return data;
}

export function getCompanyFilesMap(): Record<string, CompanyFilesData> {
  const map: Record<string, CompanyFilesData> = {};

  if (!existsSync(INDUSTRY_DIR)) return map;

  for (const industryEntry of readdirSync(INDUSTRY_DIR, {
    withFileTypes: true,
  })) {
    if (!industryEntry.isDirectory() || industryEntry.name.startsWith("."))
      continue;

    const industryDir = join(INDUSTRY_DIR, industryEntry.name);
    const industryPrefix = `/industry/${industryEntry.name}`;

    for (const segEntry of readdirSync(industryDir, {
      withFileTypes: true,
    })) {
      if (!segEntry.isDirectory() || segEntry.name.startsWith(".")) continue;
      if (segEntry.name === "投研资料") continue;

      const segDir = join(industryDir, segEntry.name);

      if (isSegment(segDir)) {
        // 赛道下公司
        const segPrefix = `${industryPrefix}/${segEntry.name}`;
        for (const companyEntry of readdirSync(segDir, {
          withFileTypes: true,
        })) {
          if (!companyEntry.isDirectory() || companyEntry.name.startsWith("."))
            continue;
          if (companyEntry.name === "投研资料") continue;

          const companyDir = join(segDir, companyEntry.name);
          if (isCompany(companyDir)) {
            map[`${segPrefix}/${companyEntry.name}/`] = buildCompanyFiles(
              companyDir,
              `${segPrefix}/${companyEntry.name}`,
            );
          }
        }
      } else if (isCompany(segDir)) {
        // 不拆赛道行业：公司直接挂一级
        map[`${industryPrefix}/${segEntry.name}/`] = buildCompanyFiles(
          segDir,
          `${industryPrefix}/${segEntry.name}`,
        );
      }
    }
  }

  return map;
}

/** 行业树节点类型 */
export type CompanyNode = { name: string; route: string };
export type SegmentNode = {
  name: string;
  route: string;
  companies: CompanyNode[];
};
export type IndustryNode = {
  name: string;
  route: string;
  segments: SegmentNode[];
  companies: CompanyNode[];
};

/** 获取行业树（用于总览页） */
export function getIndustryTree(): IndustryNode[] {
  const tree: IndustryNode[] = [];
  if (!existsSync(INDUSTRY_DIR)) return tree;

  for (const e of readdirSync(INDUSTRY_DIR, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const dir = join(INDUSTRY_DIR, e.name);
    const industryPrefix = `/industry/${e.name}`;
    const segments: SegmentNode[] = [];
    const companies: CompanyNode[] = [];

    for (const s of readdirSync(dir, { withFileTypes: true })) {
      if (!s.isDirectory() || s.name.startsWith(".")) continue;
      if (s.name === "投研资料") continue;

      const subDir = join(dir, s.name);

      if (isSegment(subDir)) {
        const segPrefix = `${industryPrefix}/${s.name}`;
        const segCompanies: CompanyNode[] = [];
        for (const c of readdirSync(subDir, { withFileTypes: true })) {
          if (!c.isDirectory() || c.name.startsWith(".")) continue;
          if (c.name === "投研资料") continue;
          if (isCompany(join(subDir, c.name))) {
            segCompanies.push({ name: c.name, route: `${segPrefix}/${c.name}/` });
          }
        }
        segments.push({
          name: s.name,
          route: `${segPrefix}/投研资料/行业总览`,
          companies: segCompanies,
        });
      } else if (isCompany(subDir)) {
        companies.push({ name: s.name, route: `${industryPrefix}/${s.name}/` });
      }
    }

    tree.push({
      name: e.name,
      route: `${industryPrefix}/投研资料/行业总览`,
      segments,
      companies,
    });
  }

  return tree;
}
