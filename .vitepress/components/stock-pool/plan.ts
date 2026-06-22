export enum PlanType {
  PRICE,
  DIVIDEND,
}

interface PlanEntry {
  value: number;
  quantity: number; // 计划买入股数
}

interface BasePlan {
  code: string;
  url?: string;
  remark?: string;
  /** 最多买入的仓位比例，如 0.2 表示买入 20% 仓位 */
  maxPositionRatio: number;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: PlanEntry[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: PlanEntry[];
}

type PlanItem = PricePlan | DividendPlan;

const planList: PlanItem[] = [
  {
    // 腾讯控股
    type: PlanType.PRICE,
    code: "00700",
    dividendAdjust: 0.8,
    maxPositionRatio: 0.2,
    url: "/value-investing/industry/互联网/腾讯控股/",
    price: [
      { value: 420, quantity: 100 },
      { value: 400, quantity: 200 },
      { value: 380, quantity: 200 },
    ],
  },
  {
    // 福耀玻璃
    type: PlanType.PRICE,
    code: "600660",
    url: "/value-investing/industry/汽车/福耀玻璃/",
    maxPositionRatio: 0.1,
    price: [
      { value: 50, quantity: 300 },
      { value: 48, quantity: 400 },
      { value: 46, quantity: 400 },
    ],
  },
  {
    // 云南白药
    type: PlanType.PRICE,
    code: "000538",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/中药/云南白药/",
    price: [{ value: 46.5, quantity: 400 }],
  },
  {
    // 东阿阿胶
    type: PlanType.PRICE,
    code: "000423",
    dividendPerYear: 2,
    maxPositionRatio: 0.05,
    remark: "几乎100%分红率，一般6月/9月分红",
    url: "/value-investing/industry/中药/东阿阿胶/",
    price: [
      { value: 48.1, quantity: 200 },
      { value: 46.5, quantity: 300 },
      { value: 45, quantity: 500 },
    ],
  },
  {
    // 羚锐制药
    type: PlanType.PRICE,
    code: "600285",
    dividendPerYear: 1,
    maxPositionRatio: 0.03,
    remark: "预估6月中分红",
    url: "/value-investing/industry/中药/羚锐制药/",
    price: [
      { value: 20.2, quantity: 400 },
      { value: 19.2, quantity: 600 },
      { value: 18.2, quantity: 800 },
    ],
  },
  {
    // 分众传媒
    type: PlanType.DIVIDEND,
    code: "002027",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/传媒/分众传媒/",
    dividend: [
      { value: 0.065, quantity: 1600 },
      { value: 0.07, quantity: 2200 },
      { value: 0.075, quantity: 3000 },
    ],
  },
  // 青岛港H
  {
    type: PlanType.DIVIDEND,
    code: "06198",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    dividend: [
      {
        value: 0.047,
        quantity: 6000,
      },
    ],
  },
  // 青岛港A
  {
    type: PlanType.DIVIDEND,
    code: "601298",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.047,
        quantity: 2000,
      },
    ],
  },
  // 永新股份
  {
    type: PlanType.PRICE,
    code: "002014",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/塑料包装/永新股份/",
    remark: "2025年分红率有降低，分红比过去两年低",
    price: [
      {
        value: 9.7,
        quantity: 1400,
      },
      {
        value: 9.2,
        quantity: 1600,
      },
    ],
  },
  // 招商银行
  {
    type: PlanType.PRICE,
    code: "600036",
    dividendPerYear: 2,
    maxPositionRatio: 0.1,
    remark: "预估07-15左右分红，分完后计划减1块",
    price: [
      {
        value: 36.5,
        quantity: 1000,
      },
      {
        value: 35.5,
        quantity: 1000,
      },
    ],
  },
  // 美的集团
  {
    type: PlanType.PRICE,
    code: "000333",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/家电/美的/",
    dividendPerYear: 2,
    remark: "预估6月15左右分红",
    price: [
      {
        value: 75,
        quantity: 400,
      },
      {
        value: 71,
        quantity: 600,
      },
    ],
  },
  // 海尔智家
  {
    type: PlanType.PRICE,
    code: "600690",
    maxPositionRatio: 0.08,
    url: "/value-investing/industry/家电/海尔/",
    dividendPerYear: 2,
    remark: "预估7月/8月分红",
    price: [
      {
        value: 19.5,
        quantity: 1000,
      },
    ],
  },
  // 格力电器
  {
    type: PlanType.PRICE,
    code: "000651",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/家电/格力/",
    dividendPerYear: 2,
    remark: "预估8月分红",
    price: [
      {
        value: 37,
        quantity: 200,
      },
    ],
  },
  // 中国移动
  {
    type: PlanType.PRICE,
    code: "600941",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/电信服务/中国移动/",
    dividendPerYear: 2,
    price: [
      {
        value: 92,
        quantity: 100,
      },
      {
        value: 90,
        quantity: 200,
      },
    ],
  },
  // 中国电信
  {
    type: PlanType.DIVIDEND,
    code: "601728",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/电信服务/中国电信/",
    dividendPerYear: 2,
    remark: "预估9月初分红",
    dividend: [
      {
        value: 0.05,
        quantity: 2000,
      },
    ],
  },
  // 中国铁塔
  {
    type: PlanType.DIVIDEND,
    code: "00788",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/电信服务/中国铁塔/",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark: "0.8 × 1.3 预估今年30%增长",
    dividend: [
      {
        value: 0.058,
        quantity: 2000,
      },
      {
        value: 0.063,
        quantity: 3000,
      },
    ],
  },
  // 长江电力
  {
    type: PlanType.DIVIDEND,
    code: "600900",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/电力/长江电力/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    dividend: [
      {
        value: 0.04,
        quantity: 2000,
      },
    ],
  },
  // 国投电力
  {
    type: PlanType.DIVIDEND,
    code: "600886",
    maxPositionRatio: 0.08,
    url: "/value-investing/industry/电力/国投电力/",
    dividendPerYear: 1,
    remark: "预估8月分红",
    dividend: [
      {
        value: 0.04,
        quantity: 3000,
      },
    ],
  },
  // 中国海油
  {
    type: PlanType.DIVIDEND,
    code: "600938",
    maxPositionRatio: 0.2,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    dividend: [
      {
        value: 0.055,
        quantity: 1400,
      },
    ],
  },
  // 中国海洋石油
  {
    type: PlanType.DIVIDEND,
    code: "00883",
    maxPositionRatio: 0.2,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    dividend: [
      {
        value: 0.055,
        quantity: 2200,
      },
    ],
  },
  // 紫金矿业
  {
    type: PlanType.PRICE,
    code: "601899",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/有色金属/紫金矿业/",
    dividendPerYear: 2,
    price: [
      {
        value: 26.61,
        quantity: 500,
      },
      {
        value: 25.61,
        quantity: 800,
      },
      {
        value: 24.61,
        quantity: 1000,
      },
    ],
  },
  // 保利物业
  {
    type: PlanType.PRICE,
    code: "06049",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/物业/保利物业/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    price: [
      {
        value: 27.5,
        quantity: 400,
      },
      {
        value: 26,
        quantity: 800,
      },
    ],
  },
  // 赛轮轮胎
  {
    type: PlanType.PRICE,
    code: "601058",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/汽车/赛轮轮胎/",
    dividendPerYear: 2,
    remark: "刚分红完，减去0.18",
    price: [
      {
        value: 11.82,
        quantity: 600,
      },
      {
        value: 11.32,
        quantity: 800,
      },
      {
        value: 10.82,
        quantity: 1000,
      },
    ],
  },
  // 申洲国际
  {
    type: PlanType.DIVIDEND,
    code: "02313",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/纺织服装/申洲国际/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    dividend: [
      {
        value: 0.052,
        quantity: 200,
      },
    ],
  },
  // 泡泡玛特
  {
    type: PlanType.PRICE,
    code: "09992",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/潮玩/泡泡玛特/",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    price: [
      {
        value: 160,
        quantity: 200,
      },
    ],
  },
  // 贵州茅台
  {
    type: PlanType.DIVIDEND,
    code: "600519",
    maxPositionRatio: 0.2,
    url: "/value-investing/industry/白酒/贵州茅台/",
    remark: "预估6月下旬分红",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.045,
        quantity: 100,
      },
    ],
  },
  // 泸州老窖
  {
    type: PlanType.DIVIDEND,
    code: "000568",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/白酒/泸州老窖/",
    remark: "预估8月分红",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.075,
        quantity: 100,
      },
      {
        value: 0.08,
        quantity: 200,
      },
    ],
  },
  // 山西汾酒
  {
    type: PlanType.DIVIDEND,
    code: "600809",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/白酒/山西汾酒/",
    dividendPerYear: 1,
    dividend: [
      {
        value: 0.06,
        quantity: 100,
      },
    ],
  },
  // 古井贡B
  {
    type: PlanType.PRICE,
    code: "200596",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/白酒/古井贡/",
    remark: "预估6月中分红",
    dividendPerYear: 2,
    price: [
      {
        value: 50,
        quantity: 1000,
      },
    ],
  },
  // 宇通客车
  {
    type: PlanType.DIVIDEND,
    code: "600066",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/汽车/宇通客车/",
    dividendPerYear: 2,
    remark: "2025年99.65%分红率，26Q1营收同比下滑7.92%",
    dividend: [
      {
        value: 0.095,
        quantity: 100,
      },
      {
        value: 0.1,
        quantity: 200,
      },
    ],
  },
  // 伊利股份
  {
    type: PlanType.DIVIDEND,
    code: "600887",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/乳制品/伊利股份/",
    remark: "护城河一般，不成长，纯吃息",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.057,
        quantity: 400,
      },
    ],
  },
  // 中国神华A
  {
    type: PlanType.DIVIDEND,
    code: "601088",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/煤炭/中国神华/",
    remark: "预估7月上旬分红",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.055,
        quantity: 200,
      },
    ],
  },
  // 中国神华H
  {
    type: PlanType.DIVIDEND,
    code: "01088",
    maxPositionRatio: 0.1,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    dividend: [
      {
        value: 0.055,
        quantity: 300,
      },
      {
        value: 0.06,
        quantity: 500,
      },
    ],
  },
  // 陕西煤业
  {
    type: PlanType.DIVIDEND,
    code: "601225",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/煤炭/陕西煤业/",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.055,
        quantity: 500,
      },
      {
        value: 0.06,
        quantity: 800,
      },
      {
        value: 0.065,
        quantity: 1200,
      },
    ],
  },
  // 中国平安
  {
    type: PlanType.DIVIDEND,
    code: "601318",
    maxPositionRatio: 0.05,
    url: "/value-investing/industry/保险/中国平安/",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.054,
        quantity: 200,
      },
      {
        value: 0.058,
        quantity: 400,
      },
    ],
  },
  // 安踏体育
  {
    type: PlanType.PRICE,
    code: "02020",
    maxPositionRatio: 0.05,
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    url: "/value-investing/industry/纺织服装/安踏体育/",
    price: [
      {
        value: 70,
        quantity: 200,
      },
      {
        value: 65,
        quantity: 400,
      },
    ],
  },
  // 小商品城
  {
    type: PlanType.DIVIDEND,
    code: "600415",
    maxPositionRatio: 0.05,
    dividendPerYear: 1,
    url: "/value-investing/industry/零售/小商品城/",
    remark:
      "预估6月中旬分红，25年有一次性收入，分红率提高，26年分红绝对值未必能维持",
    dividend: [
      {
        value: 0.049,
        quantity: 1000,
      },
    ],
  },
  // 中国通信服务
  {
    type: PlanType.DIVIDEND,
    code: "00552",
    maxPositionRatio: 0.05,
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    url: "/value-investing/industry/电信服务/中国通信服务/",
    dividend: [
      {
        value: 0.06,
        quantity: 2000,
      },
    ],
  },
  /**
   * TODO:
   * 古茗
   * 东鹏特饮
   * 陕西煤业
   * 中远海控
   * 新奥能源
   * 中国财险
   * 卫龙美味
   */
];

export { planList };
