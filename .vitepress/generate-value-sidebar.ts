/**
 * value-investing 侧边栏自动生成脚本
 *
 * 扫描 value-investing/ 目录，自动生成 VitePress sidebar。
 * - 每个子目录 = 一个侧边栏分组
 * - 每个 .md 文件 = 一个侧边栏条目
 * - 文件名（去掉 .md）即为侧边栏显示文本
 *
 * 目录结构：
 *   value-investing/
 *     投资计划/
 *       TODO.md
 *       投资计划.md
 *       ...
 *     投资理念与心法/
 *       投资心得.md
 *       ...
 */

import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type SidebarItem = {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VALUE_DIR = join(ROOT, "value-investing");

/** 分组排序：按此数组中的顺序排列，未列出的目录排在最后 */
const GROUP_ORDER = [
  "投资计划",
  "投资理念与心法",
  "市场与宏观环境",
  "公司分析与估值",
  "交易与风控",
  "AI赋能投资",
  "人物与案例",
  "复盘与阅读笔记",
  "超越投资",
];

/**
 * 生成 value-investing 侧边栏
 * 每个子目录作为一个分组，目录内的 .md 文件作为条目
 */
export function generateValueSidebar(): SidebarItem[] {
  const groups: SidebarItem[] = [];

  const entries = readdirSync(VALUE_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const groupDir = join(VALUE_DIR, entry.name);
    const items: SidebarItem[] = [];

    const files = readdirSync(groupDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".md")) continue;
      const name = file.name.replace(/\.md$/, "");
      items.push({
        text: name,
        link: `/value-investing/${entry.name}/${name}`,
      });
    }

    if (items.length > 0) {
      groups.push({ text: entry.name, items });
    }
  }

  // 按 GROUP_ORDER 排序
  groups.sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a.text);
    const ib = GROUP_ORDER.indexOf(b.text);
    if (ia === -1 && ib === -1) return a.text.localeCompare(b.text);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return groups;
}
