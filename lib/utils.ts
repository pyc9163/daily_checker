import clsx from "clsx";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SIGNAL_META } from "@/lib/constants";
import { SignalLevel } from "@/lib/types";

export const cn = (...values: Array<string | false | null | undefined>) =>
  clsx(values);

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(digits)}%`;
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  return format(new Date(value), "M월 d일 HH:mm", { locale: ko });
}

export function getSignalBadge(level: SignalLevel) {
  return SIGNAL_META[level];
}

export function toSignalLevel(signal: string): SignalLevel {
  if (signal.includes("진입")) return "entry";
  if (signal.includes("주시")) return "watch";
  if (signal.includes("위험")) return "risk";
  return "neutral";
}
