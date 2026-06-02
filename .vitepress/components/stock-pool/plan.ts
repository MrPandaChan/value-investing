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
    dividendAdjust: 0.72,
    maxPositionRatio: 0.2,
    url: "/value-investing/company/internet/tencent",
    price: [
      { value: 420, quantity: 200 },
      { value: 400, quantity: 100 },
      { value: 380, quantity: 100 },
    ],
  },
  {
    // 福耀玻璃
    type: PlanType.PRICE,
    code: "600660",
    url: "/value-investing/company/car/fuyao",
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
    url: "/value-investing/company/chinese-medicine/yunnan",
    price: [{ value: 46.5, quantity: 400 }],
  },
  {
    // 东阿阿胶
    type: PlanType.DIVIDEND,
    code: "000423",
    dividendPerYear: 2,
    maxPositionRatio: 0.05,
    url: "/value-investing/company/chinese-medicine/donge",
    dividend: [
      { value: 0.058, quantity: 200 },
      { value: 0.061, quantity: 200 },
    ],
  },
  {
    // 羚锐制药
    type: PlanType.PRICE,
    code: "600285",
    dividendPerYear: 1,
    maxPositionRatio: 0.03,
    remark: "预估6月中分红",
    url: "/value-investing/company/chinese-medicine/lingrui",
    price: [
      { value: 21, quantity: 500 },
      { value: 20, quantity: 700 },
      { value: 19, quantity: 900 },
    ],
  },
  {
    // 分众传媒
    type: PlanType.DIVIDEND,
    code: "002027",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/advertisement/fenzhong",
    dividend: [
      { value: 0.065, quantity: 2000 },
      { value: 0.07, quantity: 2000 },
      { value: 0.075, quantity: 3000 },
    ],
  },
  // 青岛港H
  {
    type: PlanType.DIVIDEND,
    code: "06198",
    maxPositionRatio: 0.1,
    url: "/value-investing/company/port/qingdao",
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
    url: "/value-investing/company/port/qingdao",
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
    url: "/value-investing/company/packaging/yongxin",
    remark: "2025年分红率有降低，分红比过去两年低",
    price: [
      {
        value: 10.2,
        quantity: 1400,
      },
      {
        value: 9.8,
        quantity: 1400,
      },
      {
        value: 9.4,
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
    url: "/value-investing/company/home-appliance/midea",
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
    url: "/value-investing/company/home-appliance/haier",
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
    url: "/value-investing/company/home-appliance/gree",
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
    url: "/value-investing/company/operator/mobile",
    dividendPerYear: 2,
    price: [
      {
        value: 92,
        quantity: 100,
      },
    ],
  },
  // 中国电信
  {
    type: PlanType.DIVIDEND,
    code: "601728",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/operator/telecom",
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
    url: "/value-investing/company/tower/tower",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark: "0.8 × 1.3 预估今年30%增长",
    dividend: [
      {
        value: 0.058,
        quantity: 1000,
      },
    ],
  },
  // 长江电力
  {
    type: PlanType.DIVIDEND,
    code: "600900",
    maxPositionRatio: 0.1,
    url: "/value-investing/company/electricity/yangtze",
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
    url: "/value-investing/company/electricity/guotou",
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
    url: "/value-investing/company/oil/cnooc/cnooc",
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
    url: "/value-investing/company/oil/cnooc/cnooc",
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
    url: "/value-investing/company/nonferrous-metals‌/zijin/zijin",
    dividendPerYear: 2,
    price: [
      {
        value: 29.5,
        quantity: 100,
      },
    ],
  },
  // 保利物业
  {
    type: PlanType.PRICE,
    code: "06049",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/property/baoli",
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
    url: "/value-investing/company/car/sailun",
    dividendPerYear: 2,
    remark: "预估6月中分红",
    price: [
      {
        value: 12,
        quantity: 500,
      },
      {
        value: 11.5,
        quantity: 600,
      },
      {
        value: 11,
        quantity: 700,
      },
    ],
  },
  // 申洲国际
  {
    type: PlanType.DIVIDEND,
    code: "02313",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/fashion/shenzhou/shenzhou",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    dividend: [
      {
        value: 0.045,
        quantity: 200,
      },
    ],
  },
  // 泡泡玛特
  {
    type: PlanType.PRICE,
    code: "09992",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/toys/popmart",
    dividendPerYear: 1,
    dividendAdjust: 0.72,
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
    url: "/value-investing/company/chinese-sprites/moutai",
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
    url: "/value-investing/company/chinese-sprites/luzhoulaojiao",
    remark: "预估8月分红",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.068,
        quantity: 100,
      },
      {
        value: 0.072,
        quantity: 200,
      },
    ],
  },
  // 山西汾酒
  {
    type: PlanType.DIVIDEND,
    code: "600809",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/chinese-sprites/shanxifenjiu",
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
    url: "/value-investing/company/chinese-sprites/gujinggong",
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
    url: "/value-investing/company/car/yutong",
    dividendPerYear: 2,
    remark: "2025年99.65%分红率，26Q1营收同比下滑7.92%",
    dividend: [
      {
        value: 0.085,
        quantity: 200,
      },
    ],
  },
  // 伊利股份
  {
    type: PlanType.DIVIDEND,
    code: "600887",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/dairy/yili",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.055,
        quantity: 400,
      },
    ],
  },
  // 中国神华A
  {
    type: PlanType.DIVIDEND,
    code: "601088",
    maxPositionRatio: 0.1,
    url: "/value-investing/company/coal/shenhua",
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
    url: "/value-investing/company/coal/shenhua",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
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
  // 中国平安
  {
    type: PlanType.DIVIDEND,
    code: "601318",
    maxPositionRatio: 0.05,
    url: "/value-investing/company/insurance/pingan",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.055,
        quantity: 200,
      },
      {
        value: 0.06,
        quantity: 400,
      },
    ],
  },
  // 安踏体育
  {
    type: PlanType.PRICE,
    code: "02020",
    maxPositionRatio: 0.05,
    dividendAdjust: 0.72,
    dividendPerYear: 2,
    url: "/value-investing/company/fashion/anta/anta",
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
    url: "/value-investing/company/other/small-commodity-market",
    remark: "预估6月中旬分红",
    dividend: [
      {
        value: 0.043,
        quantity: 1000,
      },
      {
        value: 0.046,
        quantity: 1200,
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
   */
];

export { planList };
