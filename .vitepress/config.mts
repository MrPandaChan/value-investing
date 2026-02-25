import { defineConfig } from "vitepress";

const isDev = process.env.NODE_ENV !== "production";

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
        link: "/value-investing/value-investing/information.md",
      },
      { text: "行业与企业", link: "/company/model/rotation-model.md" },
    ],
    sidebar: {
      "/value-investing/": [
        {
          text: "待办清单",
          items: [
            {
              text: "TODO",
              link: "/value-investing/todo/todo.md",
            },
          ],
        },
        {
          text: "价值投资",
          items: [
            {
              text: "网络资料",
              link: "/value-investing/value-investing/information.md",
            },
            {
              text: "投资工具",
              link: "/value-investing/value-investing/investment-tools.md",
            },
            {
              text: "AI工具",
              link: "/value-investing/value-investing/ai-tools.md",
            },
            {
              text: "AI融合增强系统",
              link: "/value-investing/value-investing/ai-system.md",
            },
            {
              text: "投资回报率",
              link: "/value-investing/value-investing/return-on-investment.md",
            },
            {
              text: "研究方法",
              link: "/value-investing/value-investing/research-methods.md",
            },
            {
              text: "宏观",
              link: "/value-investing/value-investing/macro-level.md",
            },
            {
              text: "心得",
              link: "/value-investing/value-investing/investment-insights.md",
            },
            {
              text: "能力圈",
              link: "/value-investing/value-investing/circle-of-competence.md",
            },
            {
              text: "逆向投资",
              link: "/value-investing/value-investing/contrarian-investing.md",
            },
            {
              text: "卖出策略",
              link: "/value-investing/value-investing/exit-strategy.md",
            },
            {
              text: "风险管理",
              link: "/value-investing/value-investing/risk-management.md",
            },
            {
              text: "投资组合",
              link: "/value-investing/value-investing/portfolio.md",
            },
            {
              text: "检查清单",
              link: "/value-investing/value-investing/checklist.md",
            },
            {
              text: "投资错误",
              link: "/value-investing/value-investing/mistake.md",
            },
            {
              text: "不亏",
              link: "/value-investing/value-investing/no-loss.md",
            },
            {
              text: "人物及案例",
              link: "/value-investing/value-investing/figures-and-cases.md",
            },
          ],
        },
        {
          text: "周期",
          items: [
            { text: "万物皆周期", link: "/value-investing/cycles/cycles.md" },
            {
              text: "周期判断",
              link: "/value-investing/cycles/judge-cycles.md",
            },
            { text: "景气度", link: "/value-investing/cycles/sentiment.md" },
          ],
        },
        {
          text: "政策",
          items: [{ text: "政策", link: "/value-investing/policy/policy.md" }],
        },
        {
          text: "商业",
          items: [
            {
              text: "行业研究",
              link: "/value-investing/business/industry-research.md",
            },
            {
              text: "生意模式",
              link: "/value-investing/business/business-model.md",
            },
            {
              text: "成长空间",
              link: "/value-investing/business/growth.md",
            },
            {
              text: "护城河",
              link: "/value-investing/business/moat.md",
            },
          ],
        },
        {
          text: "估值思维",
          items: [
            {
              text: "估值方法",
              link: "/value-investing/valuation/valuation.md",
            },
            {
              text: "ROE、PB、增长与回报",
              link: "/value-investing/valuation/roe-pb.md",
            },
          ],
        },
        {
          text: "公司治理",
          items: [
            {
              text: "企业文化",
              link: "/value-investing/governance/corporate-culture.md",
            },
            {
              text: "经营失败",
              link: "/value-investing/governance/business-failure.md",
            },
          ],
        },
        {
          text: "股票市场",
          items: [
            {
              text: "A股",
              link: "/value-investing/market/a-market.md",
              items: [
                {
                  text: "《追寻价值之路》",
                  link: "/value-investing/market/path-to-pursuing-value.md",
                },
              ],
            },
            {
              text: "港股",
              link: "/value-investing/market/hk-market.md",
            },
            {
              text: "流动性",
              link: "/value-investing/market/liquidity.md",
            },
          ],
        },
        {
          text: "技术分析",
          items: [
            {
              text: "多空力量的对比",
              link: "/value-investing/analysis/compare.md",
            },
            {
              text: "波段",
              link: "/value-investing/analysis/band-trading.md",
            },
          ],
        },
        {
          text: "超越投资",
          items: [
            {
              text: "超越投资的思考",
              link: "",
            },
          ],
        },
        {
          text: "总结",
          items: [
            {
              text: "复盘方法论",
              link: "/value-investing/summary/review-method.md",
            },
            { text: "2025", link: "/value-investing/summary/2025.md" },
          ],
        },
        {
          text: "笔记",
          items: [
            {
              text: "风和投资随笔",
              link: "/value-investing/notes/fenghe.md",
            },
          ],
        },
      ],
      "/company/": [
        ...(isDev
          ? [
              {
                text: "持仓组合",
                items: [
                  {
                    text: "透视盈余",
                    link: "/company/portfolio/portfolio.md",
                  },
                ],
              },
            ]
          : []),
        {
          text: "投资模型",
          items: [
            {
              text: "价值轮动模型",
              link: "/company/model/rotation-model.md",
            },
            {
              text: "企业价值评估模型",
              link: "/company/model/value-evaluation.md",
            },
          ],
        },
        {
          text: "互联网",
          items: [
            {
              text: "腾讯控股",
              link: "/company/internet/tencent.md",
            },
          ],
        },
        {
          text: "消费品",
          items: [
            {
              text: "消费品行业概述",
              link: "/company/consumer/consumer.md",
            },
            {
              text: "制造业概述",
              link: "/company/manufacturing/manufacturing.md",
            },
            {
              text: "白酒",
              link: "/company/chinese-sprites/chinese-sprites.md",
              items: [
                {
                  text: "贵州茅台",
                  link: "/company/chinese-sprites/moutai.md",
                },
                {
                  text: "五粮液",
                  link: "/company/chinese-sprites/wuliangye.md",
                },
                {
                  text: "泸州老窖",
                  link: "/company/chinese-sprites/luzhoulaojiao.md",
                },
                {
                  text: "古井贡",
                  link: "/company/chinese-sprites/gujinggong.md",
                },
                {
                  text: "山西汾酒",
                  link: "/company/chinese-sprites/shanxifenjiu.md",
                },
              ],
            },
            {
              text: "白色家电",
              link: "/company/home-appliance/home-appliance.md",
              items: [
                { text: "格力", link: "/company/home-appliance/gree.md" },
                { text: "美的", link: "/company/home-appliance/midea.md" },
                { text: "海尔", link: "/company/home-appliance/haier.md" },
              ],
            },
            {
              text: "乳制品",
              items: [{ text: "伊利股份", link: "/company/dairy/yili.md" }],
            },
            {
              text: "汽车",
              link: "/company/car/car.md",
              items: [
                { text: "比亚迪", link: "/company/car/byd.md" },
                { text: "宇通客车", link: "/company/car/yutong.md " },
                { text: "福耀玻璃", link: "/company/car/fuyao.md" },
              ],
            },
            {
              text: "摩托车",
              link: "/company/motorcycle/motorcycle.md",
              items: [
                { text: "九号公司", link: "/company/motorcycle/ninebot.md" },
                { text: "爱玛科技", link: "/company/motorcycle/aima.md" },
              ],
            },
          ],
        },
        {
          text: "航运",
          items: [{ text: "中远海控", link: "/company/shipping/cosco.md" }],
        },
        // {
        //   text: "分析示例",
        //   items: [{ text: "格力", link: "/company/example/example.md" }],
        // },
        {
          text: "农业化工",
          items: [
            {
              text: "盐湖股份",
              link: "/company/agricultural-chemicals/yanhu.md",
            },
          ],
        },
        {
          text: "中药",
          link: "/company/chinese-medicine/chinese-medicine.md",
          items: [
            { text: "云南白药", link: "/company/chinese-medicine/yunnan.md" },
            { text: "羚锐制药", link: "/company/chinese-medicine/lingrui.md" },
            { text: "东阿阿胶", link: "/company/chinese-medicine/donge.md" },
          ],
        },
        {
          text: "港口",
          link: "/company/port/port.md",
          items: [
            { text: "青岛港", link: "/company/port/qingdao.md" },
            { text: "上港集团", link: "/company/port/shanggang.md" },
            { text: "唐山港", link: "/company/port/tangshan.md" },
          ],
        },
        {
          text: "电力",
          link: "/company/electricity/electricity.md",
          items: [
            { text: "长江电力", link: "/company/electricity/yangtze.md" },
            { text: "国投电力", link: "/company/electricity/guotou.md" },
          ],
        },
        {
          text: "物流",
          link: "/company/logistics/logistics.md",
          items: [{ text: "顺丰控股", link: "/company/logistics/shunfeng.md" }],
        },
        {
          text: "塑料包装",
          items: [{ text: "永新股份", link: "/company/packaging/yongxin.md" }],
        },
        {
          text: "煤炭",
          link: "/company/coal/coal.md",
          items: [
            { text: "中国神华", link: "/company/coal/shenhua.md" },
            { text: "陕西煤业", link: "/company/coal/shanxi.md" },
            { text: "中煤能源", link: "/company/coal/zhongmei.md" },
            { text: "兖矿能源", link: "/company/coal/yankuang.md" },
          ],
        },
        {
          text: "石油",
          link: "/company/oil/oil.md",
          items: [
            { text: "中国海油", link: "/company/oil/cnooc.md" },
            { text: "中国石油", link: "/company/oil/cnpc.md" },
            { text: "中国石化", link: "/company/oil/sinopec.md" },
          ],
        },
        {
          text: "运营商",
          link: "/company/operator/operator.md",
          items: [
            { text: "中国移动", link: "/company/operator/mobile.md" },
            { text: "中国电信", link: "/company/operator/telecom.md" },
            { text: "中国联通", link: "/company/operator/unicom.md" },
          ],
        },
        {
          text: "农药",
          items: [{ text: "广信股份", link: "/company/pesticide/guangxin.md" }],
        },
        {
          text: "化学制品",
          items: [{ text: "万华化学", link: "/company/chemicals/wanhua.md" }],
        },
        {
          text: "银行",
          link: "/company/bank/bank.md",
          items: [
            {
              text: "价值投资之银行大博弈",
              link: "/company/bank/play-a-game.md",
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
