import { defineConfig } from "vitepress";
import { generateSidebar } from "./generate-sidebar.js";

const isDev = process.env.NODE_ENV !== "production";

// 自动生成行业侧边栏
const industrySidebar = generateSidebar();

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
        link: "/value-investing/getting-started/todo",
      },
      { text: "行业与企业", link: "/industry-overview" },
      { text: "投资计划", link: "/value-investing/getting-started/stock-pool" },
    ],
    sidebar: {
      "/value-investing/": [
        {
          text: "入门与计划",
          items: [
            { text: "待办清单", link: "/value-investing/getting-started/todo" },
            {
              text: "投资计划",
              link: "/value-investing/getting-started/stock-pool",
            },
            {
              text: "投资工具",
              link: "/value-investing/getting-started/investment-tools",
            },
          ],
        },
        {
          text: "投资理念与心法",
          items: [
            {
              text: "投资心得⭐",
              link: "/value-investing/philosophy/investment-insights",
            },
            {
              text: "网络资料",
              link: "/value-investing/philosophy/information",
            },
            {
              text: "研究方法",
              link: "/value-investing/philosophy/research-methods",
            },
            {
              text: "安全边际",
              link: "/value-investing/philosophy/safe-margin",
            },
            {
              text: "能力圈",
              link: "/value-investing/philosophy/circle-of-competence",
            },
            {
              text: "逆向投资",
              link: "/value-investing/philosophy/contrarian-investing",
            },
            { text: "不亏", link: "/value-investing/philosophy/no-loss" },
            {
              text: "思维格栅",
              link: "/value-investing/philosophy/lattice-of-thinking",
            },
            {
              text: "人类误判心理学",
              link: "/value-investing/philosophy/human-misjudgment",
            },
            { text: "投资错误", link: "/value-investing/philosophy/mistake" },
          ],
        },
        {
          text: "市场与宏观环境",
          items: [
            { text: "宏观", link: "/value-investing/macro-market/macro-level" },
            {
              text: "万物皆周期",
              link: "/value-investing/macro-market/cycles",
            },
            {
              text: "周期判断",
              link: "/value-investing/macro-market/judge-cycles",
            },
            { text: "景气度", link: "/value-investing/macro-market/sentiment" },
            { text: "政策", link: "/value-investing/macro-market/policy" },
            {
              text: "A股",
              link: "/value-investing/macro-market/a-market",
              items: [
                {
                  text: "《追寻价值之路》",
                  link: "/value-investing/macro-market/path-to-pursuing-value",
                },
              ],
            },
            { text: "港股", link: "/value-investing/macro-market/hk-market" },
            { text: "流动性", link: "/value-investing/macro-market/liquidity" },
          ],
        },
        {
          text: "公司分析与估值",
          items: [
            {
              text: "行业研究",
              link: "/value-investing/company-valuation/industry-research",
            },
            {
              text: "生意模式",
              link: "/value-investing/company-valuation/business-model",
            },
            {
              text: "成长空间",
              link: "/value-investing/company-valuation/growth",
            },
            { text: "护城河", link: "/value-investing/company-valuation/moat" },
            {
              text: "企业文化",
              link: "/value-investing/company-valuation/corporate-culture",
            },
            {
              text: "经营失败",
              link: "/value-investing/company-valuation/business-failure",
            },
            {
              text: "估值方法",
              link: "/value-investing/company-valuation/valuation",
            },
            {
              text: "ROE、PB、增长与回报",
              link: "/value-investing/company-valuation/roe-pb",
            },
          ],
        },
        {
          text: "交易与风控",
          items: [
            {
              text: "检查清单",
              link: "/value-investing/trading-risk/checklist",
            },
            { text: "买点", link: "/value-investing/trading-risk/entry-point" },
            {
              text: "卖出策略",
              link: "/value-investing/trading-risk/exit-strategy",
            },
            {
              text: "多空力量的对比",
              link: "/value-investing/trading-risk/compare",
            },
            {
              text: "波段",
              link: "/value-investing/trading-risk/band-trading",
            },
            { text: "网格", link: "/value-investing/trading-risk/grid" },
            {
              text: "风险管理",
              link: "/value-investing/trading-risk/risk-management",
            },
            {
              text: "投资组合",
              link: "/value-investing/trading-risk/portfolio",
            },
            {
              text: "投资回报率",
              link: "/value-investing/trading-risk/return-on-investment",
            },
          ],
        },
        {
          text: "AI 赋能投资",
          items: [
            { text: "AI工具", link: "/value-investing/ai-tools/ai-tools" },
            {
              text: "AI融合增强系统",
              link: "/value-investing/ai-tools/ai-system",
            },
            {
              text: "柏基尽调十问",
              link: "/value-investing/ai-tools/bg-ten-questions",
            },
            {
              text: "商业模式定性分析",
              link: "/value-investing/ai-tools/business-model",
            },
            {
              text: "公司八维深度解剖",
              link: "/value-investing/ai-tools/company-8d-analysis",
            },
            {
              text: "四层穿透法",
              link: "/value-investing/ai-tools/cycle-stress-test",
            },
            {
              text: "柏基魔鬼代言人",
              link: "/value-investing/ai-tools/devil-advocate-investing",
            },
            {
              text: "OODA循环",
              link: "/value-investing/ai-tools/ooda-investing",
            },
            {
              text: "行业深度研究",
              link: "/value-investing/ai-tools/industry-deep-research",
            },
            {
              text: "查理·芒格投资思想",
              link: "/value-investing/ai-tools/munger-investing",
            },
            {
              text: "分析模板",
              link: "/value-investing/ai-tools/analysis-template",
            },
            {
              text: "财报识别 TODO",
              link: "/value-investing/ai-tools/financial-detection",
            },
            { text: "播客", link: "/value-investing/ai-tools/podcast" },
          ],
        },
        {
          text: "人物与案例",
          items: [
            {
              text: "查理·芒格",
              link: "/value-investing/figures-cases/munger",
            },
            {
              text: "沃伦·巴菲特",
              link: "/value-investing/figures-cases/buffett",
            },
            { text: "彼得·林奇", link: "/value-investing/figures-cases/lynch" },
            {
              text: "约翰·邓普顿",
              link: "/value-investing/figures-cases/templeton",
            },
            { text: "冯柳", link: "/value-investing/figures-cases/fengliu" },
            {
              text: "管我财",
              link: "/value-investing/figures-cases/guanwocai",
            },
            {
              text: "学知利行",
              link: "/value-investing/figures-cases/xuezhilixing",
            },
            {
              text: "超级鹿鼎公",
              link: "/value-investing/figures-cases/ludinggong",
            },
          ],
        },
        {
          text: "复盘与阅读笔记",
          items: [
            {
              text: "复盘方法论",
              link: "/value-investing/review-notes/review-method",
            },
            {
              text: "风和投资随笔",
              link: "/value-investing/review-notes/fenghe",
            },
            {
              text: "财报背后的生意真相与投资陷阱",
              link: "/value-investing/review-notes/财报背后的生意真相与投资陷阱",
            },
            {
              text: "动量与Carry：产业视角下的投资策略",
              link: "/value-investing/review-notes/动量与Carry",
            },
          ],
        },
        {
          text: "超越投资",
          items: [
            {
              text: "超越投资的思考",
              link: "/value-investing/beyond-investing/thinking-beyond-investment",
            },
          ],
        },
      ],
      // 展开自动生成的行业侧边栏
      ...industrySidebar,
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
