export enum Industry {
  INTERNET = "互联网",
  AUTOMOTIVE_AND_PARTS = "汽车与零配件",
  TRADITIONAL_CHINESE_MEDICINE = "中药",
  MEDIA = "传媒",
  SEAPORTS_AND_SERVICES = "海港与服务",
  PAPER_AND_PACKAGING = "造纸与包装",
  BANKING = "银行",
  HOME_APPLIANCES = "家电",
  TELECOMMUNICATION_SERVICES = "通讯服务",
  ELECTRIC_POWER = "电力",
  PETROLEUM_AND_PETROCHEMICALS = "石油石化",
  NON_FERROUS_METALS = "有色金属",
  PROPERTY_MANAGEMENT = "物业管理",
  TEXTILES_AND_APPAREL = "纺织服装",
  POP_TOYS = "潮玩",
  BAIJIU = "白酒",
  DAIRY_PRODUCTS = "乳制品",
  COAL = "煤炭",
  INSURANCE = "保险",
  ENTERPRISE_SERVICES = "企业服务",
  SHIPPING = "航运",
}

interface PlanEntry {
  value: number;
  quantity: number; // 计划买入股数
}

interface BasePlan {
  maxPositionRatio: number;
}

export enum PlanType {
  EMPTY, // 没有计划
  PRICE, // 按价格
  DIVIDEND, // 按股息率
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: PlanEntry[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: PlanEntry[];
}

export type PlanItem = PricePlan | DividendPlan;

export interface StockItem {
  code: string;
  sharesHeld?: number; // 持有股数
  url?: string;
  industry: Industry;
  remark?: string;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
  plan: PlanItem;
}

const stocks: StockItem[] = [
  {
    // 腾讯控股
    code: "00700",
    industry: Industry.INTERNET,
    sharesHeld: 400,
    dividendAdjust: 0.8,
    url: "/value-investing/industry/互联网/腾讯控股/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.2,
      price: [
        { value: 400, quantity: 200 },
        { value: 380, quantity: 200 },
      ],
    },
  },
  {
    // 福耀玻璃
    code: "600660",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    sharesHeld: 1200,
    url: "/value-investing/industry/汽车/福耀玻璃/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 47.5, quantity: 400 },
        { value: 45, quantity: 400 },
      ],
    },
  },
  {
    // 云南白药
    code: "000538",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    sharesHeld: 600,
    url: "/value-investing/industry/中药/云南白药/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 47, quantity: 400 }],
    },
  },
  {
    // 东阿阿胶
    code: "000423",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    sharesHeld: 500,
    dividendPerYear: 2,
    remark: "几乎100%分红率，一般6月/9月分红",
    url: "/value-investing/industry/中药/东阿阿胶/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 44, quantity: 400 }],
    },
  },
  {
    // 羚锐制药
    code: "600285",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    sharesHeld: 900,
    dividendPerYear: 1,
    remark: "预估6月中分红",
    url: "/value-investing/industry/中药/羚锐制药/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.03,
      price: [{ value: 18.2, quantity: 700 }],
    },
  },
  {
    // 分众传媒
    code: "002027",
    industry: Industry.MEDIA,
    sharesHeld: 1600,
    url: "/value-investing/industry/传媒/分众传媒/",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.07, quantity: 2200 },
        { value: 0.075, quantity: 3000 },
      ],
    },
  },
  {
    // 青岛港H
    code: "06198",
    industry: Industry.SEAPORTS_AND_SERVICES,
    sharesHeld: 1000,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.05, quantity: 3000 }],
    },
  },
  {
    // 青岛港A
    code: "601298",
    industry: Industry.SEAPORTS_AND_SERVICES,
    sharesHeld: 4000,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [
        { value: 0.047, quantity: 1500 },
        {
          value: 0.05,
          quantity: 3000,
        },
      ],
    },
  },
  {
    // 永新股份
    code: "002014",
    industry: Industry.PAPER_AND_PACKAGING,
    // sharesHeld: 2000,
    url: "/value-investing/industry/塑料包装/永新股份/",
    remark:
      "2025年分红率有降低，分红比过去两年低；6.23涨停清仓2000股，5%股息率接回来",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.05, quantity: 2000 }],
      // price: [
      //   { value: 9.7, quantity: 1400 },
      //   { value: 9.2, quantity: 1600 },
      // ],
    },
  },
  {
    // 招商银行
    code: "600036",
    industry: Industry.BANKING,
    sharesHeld: 1000,
    dividendPerYear: 2,
    remark: "预估07-15左右分红，分完后计划减1块",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 36.5, quantity: 600 },
        { value: 35.5, quantity: 600 },
      ],
    },
  },
  {
    // 美的集团
    code: "000333",
    industry: Industry.HOME_APPLIANCES,
    sharesHeld: 100,
    url: "/value-investing/industry/家电/美的/",
    dividendPerYear: 2,
    remark: "预估6月15左右分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 75, quantity: 400 },
        { value: 71, quantity: 600 },
      ],
    },
  },
  {
    // 海尔智家
    code: "600690",
    industry: Industry.HOME_APPLIANCES,
    sharesHeld: 3600,
    url: "/value-investing/industry/家电/海尔/",
    dividendPerYear: 2,
    remark: "预估7月/8月分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.08,
      price: [{ value: 18.5, quantity: 1000 }],
    },
  },
  {
    // 格力电器
    code: "000651",
    industry: Industry.HOME_APPLIANCES,
    sharesHeld: 1200,
    url: "/value-investing/industry/家电/格力/",
    dividendPerYear: 2,
    remark: "预估8月分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 36, quantity: 200 }],
    },
  },
  {
    // 中国移动
    code: "600941",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    sharesHeld: 600,
    url: "/value-investing/industry/电信服务/中国移动/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [{ value: 88, quantity: 200 }],
    },
  },
  {
    // 中国电信
    code: "601728",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    url: "/value-investing/industry/电信服务/中国电信/",
    dividendPerYear: 2,
    remark: "预估9月初分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.05, quantity: 2000 }],
    },
  },
  {
    // 中国铁塔
    code: "00788",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    sharesHeld: 2000,
    url: "/value-investing/industry/电信服务/中国铁塔/",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark: "0.8 × 1.3 预估今年30%增长",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.062, quantity: 1500 }],
    },
  },
  {
    // 长江电力
    code: "600900",
    industry: Industry.ELECTRIC_POWER,
    sharesHeld: 1200,
    url: "/value-investing/industry/电力/长江电力/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.039, quantity: 1000 }],
    },
  },
  {
    // 国投电力
    code: "600886",
    industry: Industry.ELECTRIC_POWER,
    sharesHeld: 1200,
    url: "/value-investing/industry/电力/国投电力/",
    dividendPerYear: 1,
    remark: "预估8月分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.08,
      dividend: [{ value: 0.04, quantity: 1000 }],
    },
  },
  {
    // 中国海油A
    code: "600938",
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [{ value: 0.05, quantity: 1400 }],
    },
  },
  {
    // 中国海洋石油H
    code: "00883",
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [{ value: 0.05, quantity: 2000 }],
    },
  },
  {
    // 紫金矿业
    code: "601899",
    industry: Industry.NON_FERROUS_METALS,
    sharesHeld: 300,
    url: "/value-investing/industry/有色金属/紫金矿业/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 26.61, quantity: 500 },
        { value: 25.61, quantity: 800 },
        { value: 24.61, quantity: 1000 },
      ],
    },
  },
  {
    // 保利物业
    code: "06049",
    industry: Industry.PROPERTY_MANAGEMENT,
    sharesHeld: 600,
    url: "/value-investing/industry/物业/保利物业/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 26, quantity: 400 }],
    },
  },
  {
    // 赛轮轮胎
    code: "601058",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    sharesHeld: 1000,
    url: "/value-investing/industry/汽车/赛轮轮胎/",
    dividendPerYear: 2,
    remark: "",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [
        { value: 11.22, quantity: 800 },
        { value: 10.62, quantity: 1000 },
      ],
    },
  },
  {
    // 申洲国际
    code: "02313",
    industry: Industry.TEXTILES_AND_APPAREL,
    sharesHeld: 300,
    url: "/value-investing/industry/纺织服装/申洲国际/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [
        {
          value: 0.055,
          quantity: 200,
        },
      ],
    },
  },
  {
    // 泡泡玛特
    code: "09992",
    industry: Industry.POP_TOYS,
    url: "/value-investing/industry/潮玩/泡泡玛特/",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 150, quantity: 200 }],
    },
  },
  {
    // 贵州茅台
    code: "600519",
    industry: Industry.BAIJIU,
    url: "/value-investing/industry/白酒/贵州茅台/",
    dividendPerYear: 2,
    remark: "预估6月下旬分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [{ value: 0.045, quantity: 100 }],
    },
  },
  {
    // 泸州老窖
    code: "000568",
    industry: Industry.BAIJIU,
    url: "/value-investing/industry/白酒/泸州老窖/",
    dividendPerYear: 2,
    remark: "预估8月分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.075, quantity: 100 },
        { value: 0.08, quantity: 200 },
      ],
    },
  },
  {
    // 山西汾酒
    code: "600809",
    industry: Industry.BAIJIU,
    url: "/value-investing/industry/白酒/山西汾酒/",
    dividendPerYear: 1,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.065, quantity: 100 }],
    },
  },
  {
    // 古井贡B
    code: "200596",
    industry: Industry.BAIJIU,
    sharesHeld: 1000,
    url: "/value-investing/industry/白酒/古井贡/",
    dividendPerYear: 2,
    remark: "预估6月中分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 50, quantity: 1000 }],
    },
  },
  {
    // 宇通客车
    code: "600066",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    sharesHeld: 400,
    url: "/value-investing/industry/汽车/宇通客车/",
    dividendPerYear: 2,
    remark: "2025年99.65%分红率，26Q1营收同比下滑7.92%",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
  },
  {
    // 伊利股份
    code: "600887",
    industry: Industry.DAIRY_PRODUCTS,
    url: "/value-investing/industry/乳制品/伊利股份/",
    dividendPerYear: 2,
    remark: "护城河一般，不成长，纯吃息",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.058, quantity: 600 },
        { value: 0.062, quantity: 800 },
      ],
    },
  },
  {
    // 中国神华A
    code: "601088",
    industry: Industry.COAL,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    remark: "预估7月上旬分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.055, quantity: 200 }],
    },
  },
  {
    // 中国神华H
    code: "01088",
    industry: Industry.COAL,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [
        { value: 0.055, quantity: 300 },
        { value: 0.06, quantity: 500 },
      ],
    },
  },
  {
    // 陕西煤业
    code: "601225",
    industry: Industry.COAL,
    url: "/value-investing/industry/煤炭/陕西煤业/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.05, quantity: 500 },
        { value: 0.055, quantity: 800 },
        { value: 0.06, quantity: 1200 },
      ],
    },
  },
  {
    // 中国平安
    code: "601318",
    industry: Industry.INSURANCE,
    sharesHeld: 200,
    url: "/value-investing/industry/保险/中国平安/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.057, quantity: 500 }],
    },
  },
  {
    // 安踏体育
    code: "02020",
    industry: Industry.TEXTILES_AND_APPAREL,
    sharesHeld: 200,
    url: "/value-investing/industry/纺织服装/安踏体育/",
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [
        { value: 64, quantity: 200 },
        { value: 60, quantity: 400 },
      ],
    },
  },
  {
    // 小商品城
    code: "600415",
    industry: Industry.ENTERPRISE_SERVICES,
    sharesHeld: 1800,
    url: "/value-investing/industry/企业服务/小商品城/",
    dividendPerYear: 1,
    remark: "25年有一次性收入，分红率提高，26年分红绝对值未必能维持",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.052, quantity: 1000 }],
    },
  },
  {
    // 中国通信服务
    code: "00552",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    url: "/value-investing/industry/电信服务/中国通信服务/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.06, quantity: 2000 }],
    },
  },
  {
    // 中远海控A
    code: "601919",
    industry: Industry.SHIPPING,
    sharesHeld: 200,
    url: "/value-investing/industry/航运/中远海控/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.09, quantity: 500 }],
    },
  },
  {
    // 中远海控H
    code: "01919",
    industry: Industry.SHIPPING,
    sharesHeld: 1000,
    url: "/value-investing/industry/航运/中远海控/",
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.09, quantity: 500 }],
    },
  },
  {
    // 比亚迪
    code: "002594",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    sharesHeld: 100,
    url: "/value-investing/industry/汽车/比亚迪/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 68, quantity: 100 }],
    },
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

export { stocks };
