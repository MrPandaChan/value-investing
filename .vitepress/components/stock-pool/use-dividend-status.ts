import type { RowData } from "./use-stock-pool-data";
import { getEffectiveEventDps, type ExItem } from "./fetch-dividend";

// ========== 分红状态判断 ==========
export type DividendStatus =
  | "paid" // 今年已分红 → 灰色
  | "upcoming_urgent" // 距除权 ≤ 7 天 → 深红
  | "upcoming_soon" // 距除权 8-30 天 → 红色
  | "upcoming_close" // 距除权 31-60 天 → 橙色
  | "upcoming" // 距除权 > 60 天 → 默认色
  | "past_year" // 往年无预测价值 → 灰色
  | "unknown"; // 日期未定 → 默认色

export interface ExDisplayInfo {
  dps: number;
  exDate: string;
  payDate: string;
  planRaw?: string; // 原始分红方案文本，如 "10转3派25元(实施方案)"
  bonusRatio?: number; // 转送股比例，有值才显示感叹号
  status: DividendStatus;
  daysUntilEx: number | null;
  isPredicted: boolean;
}

function parseDateSafe(s: string): Date | null {
  if (!s || s === "-") return null;
  // 统一处理 "/" 和 "-" 分隔的日期格式
  const normalized = s.replace(/\//g, "-");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** 根据距今天数返回三级紧迫度 */
function classifyDays(days: number | null): DividendStatus {
  if (days === null) return "upcoming";
  if (days <= 7) return "upcoming_urgent";
  if (days <= 30) return "upcoming_soon";
  if (days <= 60) return "upcoming_close";
  return "upcoming";
}

function getDividendStatus(
  exDate: string,
  _payDate: string,
): {
  status: DividendStatus;
  daysUntilEx: number | null;
  isPredicted: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();

  const dEx = parseDateSafe(exDate);

  // 无除权日 → 默认色
  if (!dEx) return { status: "unknown", daysUntilEx: null, isPredicted: false };

  const daysUntilEx = Math.ceil((dEx.getTime() - today.getTime()) / 86400000);

  // 除权日在往年 → 投射到今年作为预测
  if (dEx.getFullYear() < thisYear) {
    const projected = new Date(thisYear, dEx.getMonth(), dEx.getDate());
    const projectedDays = Math.ceil(
      (projected.getTime() - today.getTime()) / 86400000,
    );
    if (projectedDays >= -60) {
      return {
        status: classifyDays(projectedDays),
        daysUntilEx: projectedDays,
        isPredicted: true,
      };
    }
    return { status: "past_year", daysUntilEx, isPredicted: false };
  }

  // 除权日在今年且已过 → 已除权，灰色
  if (dEx.getFullYear() === thisYear && dEx <= today) {
    return { status: "paid", daysUntilEx, isPredicted: false };
  }

  // 除权日在未来 → 按紧迫度分级
  if (dEx > today) {
    return { status: classifyDays(daysUntilEx), daysUntilEx, isPredicted: false };
  }

  return { status: "past_year", daysUntilEx, isPredicted: false };
}

export function buildExDisplay(exList: RowData["exList"]): ExDisplayInfo[] {
  const statusOrder: Record<DividendStatus, number> = {
    upcoming_urgent: 0,
    upcoming_soon: 1,
    upcoming_close: 2,
    upcoming: 3,
    unknown: 4,
    past_year: 5,
    paid: 6,
  };
  return exList
    .map((ex) => {
      const statusInfo = getDividendStatus(ex.exDate, ex.payDate);
      return {
        dps: getEffectiveEventDps(ex),
        exDate: ex.exDate,
        payDate: ex.payDate,
        planRaw: ex.planRaw,
        bonusRatio: ex.bonusRatio,
        ...statusInfo,
      };
    })
    .sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      // 同状态按距今天数升序（越近的越靠前），null 排后面
      const aDays = a.daysUntilEx ?? Infinity;
      const bDays = b.daysUntilEx ?? Infinity;
      return aDays - bDays;
    });
}
