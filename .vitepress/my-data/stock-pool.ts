import { ref } from "vue";

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
  MACHINERY = "机械",
  FINANCIAL = "金融",
  BEVERAGE = "茶饮",
  MATERIALS = "材料",
  ETF = "ETF",
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
  PE, // PE_TTM
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: PlanEntry[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: PlanEntry[];
}

interface PEPlan extends BasePlan {
  type: PlanType.PE;
  pe: PlanEntry[];
}

export interface EntryPrice {
  type: PlanType;
  value: number;
}

export type PlanItem = PricePlan | DividendPlan | PEPlan;

export interface StockItem {
  code: string;
  sharesHeld?: number; // 持有股数
  url?: string;
  industry: Industry;
  remark?: string;
  /** 综合素质评分 0-5 */
  qualityScore: number;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
  plan: PlanItem; // 买入计划
  strikePrice: EntryPrice; // 击球点
}

const stocks: StockItem[] = [
  {
    // 腾讯控股
    /**
     * 9.5% - 467
     * 10% - 443
     * 10.5% - 422
     * 11% - 403
     * 11.5% - 386
     * 12% - 370
     */
    code: "00700",
    industry: Industry.INTERNET,
    qualityScore: 4.5,
    dividendAdjust: 0.8,
    url: "/value-investing/industry/互联网/腾讯控股/",
    remark:
      "预期收益率：9.5% - 467；10% - 443；10.5% - 422；11% - 403；11.5% - 386；12% - 370",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.2,
      price: [
        // { value: 403, quantity: 200 },
        // { value: 386, quantity: 200 },
        // { value: 370, quantity: 200 },
        // 直接取中间的价格
        { value: 394.6, quantity: 200 },
        { value: 378, quantity: 200 },
      ],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 15,
    },
  },
  {
    // 福耀玻璃
    code: "600660",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 4,
    sharesHeld: 500,
    url: "/value-investing/industry/汽车/福耀玻璃/",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [{ value: 46, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 云南白药
    code: "000538",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3.5,
    sharesHeld: 300,
    url: "/value-investing/industry/中药/云南白药/",
    remark: "目前仓位已打满，给个特别低价然后装死",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.06, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 东阿阿胶
    code: "000423",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3.5,
    sharesHeld: 300,
    dividendPerYear: 2,
    remark:
      "几乎100%分红率，一般6月/9月分红，目前仓位已打满，给个特别划算的价格然后装死",
    url: "/value-investing/industry/中药/东阿阿胶/",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.065, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 羚锐制药
    code: "600285",
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3,
    dividendPerYear: 1,
    remark: "预估6月中分红",
    url: "/value-investing/industry/中药/羚锐制药/",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 分众传媒
    code: "002027",
    industry: Industry.MEDIA,
    qualityScore: 3.5,
    sharesHeld: 1800,
    url: "/value-investing/industry/传媒/分众传媒/",
    remark: "2025年业绩去掉减值后为 50.75亿",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.075, quantity: 1000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.075,
    },
  },
  {
    // 青岛港H
    code: "06198",
    industry: Industry.SEAPORTS_AND_SERVICES,
    qualityScore: 3.5,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.052, quantity: 2000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 青岛港A
    code: "601298",
    industry: Industry.SEAPORTS_AND_SERVICES,
    qualityScore: 3.5,
    sharesHeld: 1500,
    url: "/value-investing/industry/港口/青岛港/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [
        { value: 0.045, quantity: 500 },
        { value: 0.05, quantity: 600 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 永新股份
    code: "002014",
    industry: Industry.PAPER_AND_PACKAGING,
    qualityScore: 3,
    sharesHeld: 400,
    url: "/value-investing/industry/塑料包装/永新股份/",
    remark:
      "2025年分红率有降低，分红比过去两年低；6.23涨停清仓2200股，5.5%股息率左右接回来，横向比对机会成本",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [
        { value: 9.5, quantity: 500 },
        { value: 9, quantity: 600 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 招商银行
    code: "600036",
    industry: Industry.BANKING,
    qualityScore: 4,
    sharesHeld: 800,
    dividendPerYear: 2,
    remark: "预估07-15左右分红，分完后计划减1块",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [{ value: 34.5, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 工商银行
    code: "601398",
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国银行
    code: "601988",
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 农业银行
    code: "601288",
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 建设银行
    code: "601939",
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 兴业银行
    code: "601166",
    industry: Industry.BANKING,
    qualityScore: 3,
    dividendPerYear: 2,
    url: "",
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.07, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.07,
    },
  },
  {
    // 中创智领A
    code: "601717",
    industry: Industry.MACHINERY,
    qualityScore: 2.5,
    url: "/value-investing/industry/机械/中创智领/",
    dividendPerYear: 1,
    remark: "",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.02,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 中创智领H
    code: "00564",
    industry: Industry.MACHINERY,
    qualityScore: 2.5,
    url: "/value-investing/industry/机械/中创智领/",
    dividendPerYear: 1,
    remark: "",
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.02,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 美的集团
    code: "000333",
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 4,
    sharesHeld: 100,
    url: "/value-investing/industry/家电/美的/",
    dividendPerYear: 2,
    remark: "6-29分红，计划减3.8",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 71.2, quantity: 100 },
        { value: 67.2, quantity: 200 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 海尔智家
    code: "600690",
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 3.5,
    sharesHeld: 1500,
    url: "/value-investing/industry/家电/海尔/",
    dividendPerYear: 2,
    remark: "预估7月/8月分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.08,
      price: [{ value: 18.5, quantity: 300 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 格力电器
    code: "000651",
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 3,
    sharesHeld: 400,
    url: "/value-investing/industry/家电/格力/",
    dividendPerYear: 2,
    remark: "预估8月分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.085, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.08,
    },
  },
  {
    // 中国移动
    code: "600941",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 4,
    sharesHeld: 400,
    url: "/value-investing/industry/电信服务/中国移动/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国电信
    code: "601728",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3.5,
    url: "/value-investing/industry/电信服务/中国电信/",
    dividendPerYear: 2,
    remark: "类债属性，几乎不增长，不宜买多，预计9月底分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.055, quantity: 700 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 中国电信H
    code: "00728",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3.5,
    url: "/value-investing/industry/电信服务/中国电信/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    remark: "类债属性，几乎不增长，不宜买多",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.062, quantity: 4000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 中国铁塔
    code: "00788",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3,
    url: "/value-investing/industry/电信服务/中国铁塔/",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark:
      "0.8 × 1.3 预估今年30%增长，后续几乎不增长，不宜买多，优先买移动和电信",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.065, quantity: 1000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.065,
    },
  },
  {
    // 长江电力
    code: "600900",
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 4.5,
    sharesHeld: 200,
    url: "/value-investing/industry/电力/长江电力/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [
        { value: 28, quantity: 100 },
        { value: 27, quantity: 200 },
        { value: 26, quantity: 300 },
        { value: 25, quantity: 400 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.04,
    },
  },
  {
    // 国投电力
    code: "600886",
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 3,
    sharesHeld: 500,
    url: "/value-investing/industry/电力/国投电力/",
    dividendPerYear: 1,
    remark: "预估8月分红",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.08,
      price: [
        { value: 13.5, quantity: 200 },
        { value: 12.75, quantity: 200 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.04,
    },
  },
  {
    // 中国海油A
    code: "600938",
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    qualityScore: 4.5,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    remark: "预估7月中分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [
        { value: 0.046, quantity: 400 },
        { value: 0.05, quantity: 400 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 中国海洋石油H
    code: "00883",
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    qualityScore: 4.5,
    url: "/value-investing/industry/石油石化/中国海油/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [{ value: 0.05, quantity: 2000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 紫金矿业
    code: "601899",
    industry: Industry.NON_FERROUS_METALS,
    qualityScore: 4,
    sharesHeld: 700,
    url: "/value-investing/industry/有色金属/紫金矿业/",
    dividendPerYear: 2,
    remark: "6-26分红，计划减0.38",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.1,
      price: [{ value: 24.5, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 24.5,
    },
  },
  {
    // 保利物业
    code: "06049",
    industry: Industry.PROPERTY_MANAGEMENT,
    qualityScore: 3,
    url: "/value-investing/industry/物业/保利物业/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.052, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 赛轮轮胎
    code: "601058",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3.5,
    sharesHeld: 300,
    url: "/value-investing/industry/汽车/赛轮轮胎/",
    dividendPerYear: 2,
    remark: "",
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.03,
      price: [
        { value: 11, quantity: 300 },
        { value: 10.5, quantity: 400 },
      ],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 10,
    },
  },
  {
    // 申洲国际
    code: "02313",
    industry: Industry.TEXTILES_AND_APPAREL,
    qualityScore: 3.5,
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
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 泡泡玛特
    code: "09992",
    industry: Industry.POP_TOYS,
    qualityScore: 3,
    url: "/value-investing/industry/潮玩/泡泡玛特/",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 140, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 贵州茅台
    code: "600519",
    industry: Industry.BAIJIU,
    qualityScore: 5,
    url: "/value-investing/industry/白酒/贵州茅台/",
    dividendPerYear: 2,
    remark: "6月26分红，计划减28.02",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.2,
      dividend: [{ value: 0.045, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.045,
    },
  },
  {
    // 泸州老窖
    code: "000568",
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    url: "/value-investing/industry/白酒/泸州老窖/",
    dividendPerYear: 2,
    remark: "预估8月分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.08, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.08,
    },
  },
  {
    // 山西汾酒
    code: "600809",
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    url: "/value-investing/industry/白酒/山西汾酒/",
    dividendPerYear: 1,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.065, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.07,
    },
  },
  {
    // 古井贡B
    code: "200596",
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    sharesHeld: 300,
    url: "/value-investing/industry/白酒/古井贡/",
    dividendPerYear: 2,
    remark: "预估6月中分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.1, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 宇通客车
    code: "600066",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3,
    sharesHeld: 400,
    url: "/value-investing/industry/汽车/宇通客车/",
    dividendPerYear: 2,
    remark: "2025年99.65%分红率，26Q1营收同比下滑7.92%",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.086, quantity: 100 },
        { value: 0.1, quantity: 100 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 伊利股份
    code: "600887",
    industry: Industry.DAIRY_PRODUCTS,
    qualityScore: 3.5,
    sharesHeld: 100,
    url: "/value-investing/industry/乳制品/伊利股份/",
    dividendPerYear: 2,
    remark: "缓慢成长，纯吃息",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.06, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中国神华A
    code: "601088",
    industry: Industry.COAL,
    qualityScore: 4,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    remark: "预估7月上旬分红",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.1,
      dividend: [{ value: 0.05, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 中国神华H
    code: "01088",
    industry: Industry.COAL,
    qualityScore: 4,
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
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 陕西煤业
    code: "601225",
    industry: Industry.COAL,
    qualityScore: 3,
    url: "/value-investing/industry/煤炭/陕西煤业/",
    dividendPerYear: 2,
    remark: "中报业绩预增",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.05, quantity: 200 },
        { value: 0.055, quantity: 300 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中国平安
    code: "601318",
    industry: Industry.INSURANCE,
    qualityScore: 3.5,
    sharesHeld: 200,
    url: "/value-investing/industry/保险/中国平安/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.06, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 安踏体育
    code: "02020",
    industry: Industry.TEXTILES_AND_APPAREL,
    qualityScore: 4,
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
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 小商品城
    code: "600415",
    industry: Industry.ENTERPRISE_SERVICES,
    qualityScore: 3,
    sharesHeld: 1200,
    url: "/value-investing/industry/企业服务/小商品城/",
    dividendPerYear: 1,
    remark: "25年有一次性收入，分红率提高，26年分红绝对值未必能维持",
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [
        { value: 0.0455, quantity: 200 },
        { value: 0.055, quantity: 300 },
      ],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国通信服务
    code: "00552",
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3,
    url: "/value-investing/industry/电信服务/中国通信服务/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.05,
      dividend: [{ value: 0.06, quantity: 2000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中远海控A
    code: "601919",
    industry: Industry.SHIPPING,
    qualityScore: 2,
    url: "/value-investing/industry/航运/中远海控/",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.09, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.09,
    },
  },
  {
    // 中远海控H
    code: "01919",
    industry: Industry.SHIPPING,
    qualityScore: 2,
    url: "/value-investing/industry/航运/中远海控/",
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.09, quantity: 500 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.09,
    },
  },
  {
    // 比亚迪
    code: "002594",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3.5,
    url: "/value-investing/industry/汽车/比亚迪/",
    dividendPerYear: 1,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 62, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 62,
    },
  },
  {
    // 中概互联
    code: "513050",
    industry: Industry.ETF,
    qualityScore: 3,
    sharesHeld: 14000,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.05,
      price: [{ value: 0.847, quantity: 3000 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 1,
    },
  },
  {
    // 香港交易所
    code: "00388",
    industry: Industry.FINANCIAL,
    qualityScore: 4.5,
    url: "value-investing/industry/金融/港交所",
    dividendPerYear: 1,
    remark: "周期成长股，周期底部击球",
    plan: {
      type: PlanType.PE,
      maxPositionRatio: 0.1,
      pe: [{ value: 21, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 21,
    },
  },
  {
    // 国电南瑞
    code: "600406",
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 4,
    url: "value-investing/industry/电力/国电南瑞",
    dividendPerYear: 2,
    remark: "历史最底部差不多16~18PE",
    plan: {
      type: PlanType.PE,
      maxPositionRatio: 0.05,
      pe: [{ value: 18, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 18,
    },
  },
  {
    // 宁德时代
    code: "300750",
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 4,
    url: "value-investing/industry/汽车/宁德时代",
    dividendPerYear: 2,
    remark: "历史最底部14PE~15PE",
    plan: {
      type: PlanType.PE,
      maxPositionRatio: 0.1,
      pe: [{ value: 15, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 15,
    },
  },
  {
    // 农夫山泉
    code: "09633",
    industry: Industry.BEVERAGE,
    qualityScore: 4.5,
    url: "value-investing/industry/茶饮/农夫山泉",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    remark: "历史底部大概20PE",
    plan: {
      type: PlanType.PE,
      maxPositionRatio: 0.05,
      pe: [{ value: 20, quantity: 400 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 20,
    },
  },
  {
    // 东鹏饮料
    code: "605499",
    industry: Industry.BEVERAGE,
    qualityScore: 3.5,
    url: "value-investing/industry/茶饮/东鹏饮料",
    dividendPerYear: 2,
    remark: "2025年年报是10转3派2.5",
    plan: {
      type: PlanType.PE,
      maxPositionRatio: 0.05,
      pe: [{ value: 16, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 16,
    },
  },
  {
    // 云天化
    code: "600096",
    industry: Industry.BEVERAGE,
    qualityScore: 2.5,
    url: "value-investing/industry/化肥/云天化",
    dividendPerYear: 2,
    plan: {
      type: PlanType.DIVIDEND,
      maxPositionRatio: 0.03,
      dividend: [{ value: 0.06, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 恒生科技ETF
    code: "513180",
    industry: Industry.ETF,
    qualityScore: 2.5,
    sharesHeld: 2400,
    plan: {
      type: PlanType.PRICE,
      maxPositionRatio: 0.03,
      price: [],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 0.5,
    },
  },
  /**
   * TODO:
   * 古茗
   * 新奥能源
   * 中国财险
   * 卫龙美味
   */
];

/** 剩余现金（人民币），在持仓组合中作为"现金"显示，参与总市值和比例计算 */
export const cash = ref(38000);

/**
 * TODO:
 *
 * 1. 股票池增加击球点（内在价值点），判断价格的偏离度
 * 2. 增加卖出计划，方便波动降本
 */

export { stocks };
