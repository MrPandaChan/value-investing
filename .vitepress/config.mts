import { defineConfig } from "vitepress";

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
      { text: "行业与企业", link: "/company/chinese-sprites/wuliangye.md" },
    ],
    sidebar: {
      "/value-investing/": [
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
          ],
        },
        {
          text: "投资风格",
          items: [
            {
              text: "主题股投资",
              link: "/value-investing/investment-style/thematic.md",
            },
            {
              text: "成长股投资",
              link: "/value-investing/investment-style/growth.md",
            },
            {
              text: "价值股投资",
              link: "/value-investing/investment-style/value.md",
            },
            {
              text: "周期股投资",
              link: "/value-investing/investment-style/cyclical.md",
            },
          ],
        },
        {
          text: "周期",
          items: [
            { text: "周期", link: "/value-investing/cycles/cycles.md" },
            { text: "人口周期", link: "/value-investing/cycles/population.md" },
            {
              text: "技术生命周期",
              link: "/value-investing/cycles/technology.md",
            },
            { text: "经济周期", link: "/value-investing/cycles/economic.md" },
            { text: "资本周期", link: "/value-investing/cycles/capital.md" },
            { text: "库存周期", link: "/value-investing/cycles/inventory.md" },
            { text: "政治周期", link: "/value-investing/cycles/political.md" },
          ],
        },
        {
          text: "生意模式",
          items: [
            {
              text: "生意模式",
              link: "/value-investing/business-model/business-model.md",
            },
            {
              text: "成行空间",
              link: "/value-investing/business-model/growth.md",
            },
            {
              text: "护城河",
              link: "/value-investing/business-model/moat.md",
            },
            {
              text: "竞争优势",
              link: "/value-investing/business-model/competitive-advantage.md",
            },
            {
              text: "财务分析",
              link: "/value-investing/business-model/financial-analysis.md",
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
              text: "绝对估值",
              link: "/value-investing/valuation/absolute.md",
            },
            {
              text: "相对估值",
              link: "/value-investing/valuation/relative.md",
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
            {
              text: "管理层",
              link: "/value-investing/governance/management.md",
            },
            {
              text: "组织和规则",
              link: "/value-investing/governance/organization.md",
            },
            {
              text: "行为判断",
              link: "/value-investing/governance/behavior.md",
            },
          ],
        },
        {
          text: "股票市场",
          items: [
            {
              text: "港股",
              link: "/value-investing/market/hk-market.md",
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
      ],
      "/company/": [
        {
          text: "持仓组合",
          items: [
            {
              text: "透视盈余",
              link: "/company/portfolio/portfolio.md",
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
          text: "银行",
          link: "/company/bank/bank.md",
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
