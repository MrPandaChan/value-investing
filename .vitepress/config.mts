import { defineConfig } from "vitepress";
import { generateSidebar, getIndustryTree, getCompanyFilesMap } from "./generate-sidebar.js";
import { generateValueSidebar } from "./generate-value-sidebar.js";

const isDev = process.env.NODE_ENV !== "production";

// 自动生成侧边栏
const industrySidebar = generateSidebar();
const valueSidebar = generateValueSidebar();

// https://vitepress.dev/reference/site-config
export default defineConfig({
  head: [
    ["link", { rel: "icon", href: "/value-investing/favicon.ico" }],
  ],
  vite: {
    plugins: [
      {
        name: "virtual-industry-tree",
        resolveId(id) {
          if (id === "virtual:industry-tree") return "\0virtual:industry-tree";
        },
        load(id) {
          if (id === "\0virtual:industry-tree") {
            return `export default ${JSON.stringify(getIndustryTree())}`;
          }
        },
      },
      {
        name: "virtual-company-files",
        resolveId(id) {
          if (id === "virtual:company-files") return "\0virtual:company-files";
        },
        load(id) {
          if (id === "\0virtual:company-files") {
            return `export default ${JSON.stringify(getCompanyFilesMap())}`;
          }
        },
      },
    ],
  },
  // 自定义CSS变量，调整内容区域宽度
  appearance: true,
  lastUpdated: true,
  title: "Value Investing",
  description: "A VitePress Site",
  outDir: "docs",
  base: "/value-investing/",
  markdown: {
    breaks: true,
    math: true,
  },
  themeConfig: {
    outline: {
      level: [2, 3],
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      {
        text: "投资框架",
        link: "/value-investing/投资理念与心法/网络资料",
      },
      { text: "行业与企业", link: "/industry-overview" },
      { text: "投资计划", link: "/value-investing/入门与计划/投资计划" },
    ],
    sidebar: {
      "/value-investing/": valueSidebar,
      // 展开自动生成的行业侧边栏
      ...industrySidebar,
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
