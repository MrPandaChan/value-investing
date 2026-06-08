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
        link: "/value-investing/value-investing/information",
      },
      { text: "行业与企业", link: "/industry-overview" },
      { text: "股票池", link: "/value-investing/frameworks/stock-pool" },
    ],
    sidebar: {
      "/value-investing/": [
        {
          text: "待办清单",
          items: [
            {
              text: "TODO",
              link: "/value-investing/todo/todo",
            },
          ],
        },
        {
          text: "价值投资",
          items: [
            {
              text: "网络资料",
              link: "/value-investing/value-investing/information",
            },
            {
              text: "投资心得⭐",
              link: "/value-investing/value-investing/investment-insights",
            },
            {
              text: "投资工具",
              link: "/value-investing/value-investing/investment-tools",
            },
            {
              text: "投资回报率",
              link: "/value-investing/value-investing/return-on-investment",
            },
            {
              text: "研究方法",
              link: "/value-investing/value-investing/research-methods",
            },
            {
              text: "宏观",
              link: "/value-investing/value-investing/macro-level",
            },
            {
              text: "能力圈",
              link: "/value-investing/value-investing/circle-of-competence",
            },
            {
              text: "逆向投资",
              link: "/value-investing/value-investing/contrarian-investing",
            },
            {
              text: "卖出策略",
              link: "/value-investing/value-investing/exit-strategy",
            },
            {
              text: "风险管理",
              link: "/value-investing/value-investing/risk-management",
            },
            {
              text: "投资组合",
              link: "/value-investing/value-investing/portfolio",
            },
            {
              text: "检查清单",
              link: "/value-investing/value-investing/checklist",
            },
            {
              text: "投资错误",
              link: "/value-investing/value-investing/mistake",
            },
            {
              text: "不亏",
              link: "/value-investing/value-investing/no-loss",
            },
            {
              text: "安全边际",
              link: "/value-investing/value-investing/safe-margin",
            },
            {
              text: "思维格栅",
              link: "/value-investing/value-investing/lattice-of-thinking",
            },
            {
              text: "人类误判心理学",
              link: "/value-investing/value-investing/human-misjudgment",
            },
          ],
        },
        {
          text: "AI",
          items: [
            {
              text: "AI工具",
              link: "/value-investing/ai/ai-tools",
            },
            {
              text: "AI融合增强系统",
              link: "/value-investing/ai/ai-system",
            },
          ],
        },
        {
          text: "AI SKILL",
          items: [
            {
              text: "柏基尽调十问",
              link: "/value-investing/ai-skill/bg-ten-questions",
            },
            {
              text: "商业模式定性分析",
              link: "/value-investing/ai-skill/business-model",
            },
            {
              text: "公司八维深度解剖",
              link: "/value-investing/ai-skill/company-8d-analysis",
            },
            {
              text: "四层穿透法",
              link: "/value-investing/ai-skill/cycle-stress-test",
            },
            {
              text: "柏基魔鬼代言人",
              link: "/value-investing/ai-skill/devil-advocate-investing",
            },
            {
              text: "OODA循环，对信息进行及时的分析与调整",
              link: "/value-investing/ai-skill/ooda-investing",
            },
            {
              text: "行业深度研究",
              link: "/value-investing/ai-skill/industry-deep-research",
            },
            {
              text: "查理·芒格投资思想",
              link: "/value-investing/ai-skill/munger-investing",
            },
            {
              text: "分析模板",
              link: "/value-investing/ai-skill/analysis-template",
            },
            {
              text: "财报识别 TODO",
              link: "/value-investing/ai-skill/financial-detection",
            },
            {
              text: "播客",
              link: "/value-investing/ai-skill/podcast",
            },
          ],
        },
        {
          text: "周期",
          items: [
            { text: "万物皆周期", link: "/value-investing/cycles/cycles" },
            {
              text: "周期判断",
              link: "/value-investing/cycles/judge-cycles",
            },
            { text: "景气度", link: "/value-investing/cycles/sentiment" },
          ],
        },
        {
          text: "政策",
          items: [{ text: "政策", link: "/value-investing/policy/policy" }],
        },
        {
          text: "商业",
          items: [
            {
              text: "行业研究",
              link: "/value-investing/business/industry-research",
            },
            {
              text: "生意模式",
              link: "/value-investing/business/business-model",
            },
            {
              text: "成长空间",
              link: "/value-investing/business/growth",
            },
            {
              text: "护城河",
              link: "/value-investing/business/moat",
            },
          ],
        },
        {
          text: "估值思维",
          items: [
            {
              text: "估值方法",
              link: "/value-investing/valuation/valuation",
            },
            {
              text: "ROE、PB、增长与回报",
              link: "/value-investing/valuation/roe-pb",
            },
          ],
        },
        {
          text: "公司治理",
          items: [
            {
              text: "企业文化",
              link: "/value-investing/governance/corporate-culture",
            },
            {
              text: "经营失败",
              link: "/value-investing/governance/business-failure",
            },
          ],
        },
        {
          text: "股票市场",
          items: [
            {
              text: "A股",
              link: "/value-investing/market/a-market",
              items: [
                {
                  text: "《追寻价值之路》",
                  link: "/value-investing/market/path-to-pursuing-value",
                },
              ],
            },
            {
              text: "港股",
              link: "/value-investing/market/hk-market",
            },
            {
              text: "流动性",
              link: "/value-investing/market/liquidity",
            },
          ],
        },
        {
          text: "操作策略",
          items: [
            {
              text: "多空力量的对比",
              link: "/value-investing/analysis/compare",
            },
            {
              text: "波段",
              link: "/value-investing/analysis/band-trading",
            },
            {
              text: "买点",
              link: "/value-investing/analysis/entry-point",
            },
            {
              text: "网格",
              link: "/value-investing/analysis/grid",
            },
          ],
        },
        {
          text: "超越投资",
          items: [
            {
              text: "超越投资的思考",
              link: "/value-investing/thinking-beyond-investment/thinking-beyond-investment",
            },
          ],
        },
        {
          text: "人物&案例",
          items: [
            {
              text: "查理·芒格",
              link: "/value-investing/figures-and-cases/munger",
            },
            {
              text: "沃伦·巴菲特",
              link: "/value-investing/figures-and-cases/buffett",
            },
            {
              text: "彼得·林奇",
              link: "/value-investing/figures-and-cases/lynch",
            },
            {
              text: "约翰·邓普顿",
              link: "/value-investing/figures-and-cases/templeton",
            },
            {
              text: "冯柳",
              link: "/value-investing/figures-and-cases/fengliu",
            },
            {
              text: "管我财",
              link: "/value-investing/figures-and-cases/guanwocai",
            },
            {
              text: "学知利行",
              link: "/value-investing/figures-and-cases/xuezhilixing",
            },
            {
              text: "超级鹿鼎公",
              link: "/value-investing/figures-and-cases/ludinggong",
            },
          ],
        },
        {
          text: "总结",
          items: [
            {
              text: "复盘方法论",
              link: "/value-investing/summary/review-method",
            },
            { text: "2025", link: "/value-investing/summary/2025" },
          ],
        },
        {
          text: "笔记",
          items: [
            {
              text: "风和投资随笔",
              link: "/value-investing/notes/fenghe",
            },
            {
              text: "财报背后的生意真相与投资陷阱",
              link: "/value-investing/notes/财报背后的生意真相与投资陷阱",
            },
            {
              text: "动量与Carry：产业视角下的投资策略",
              link: "/value-investing/notes/动量与Carry",
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
