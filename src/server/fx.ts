import { parseUsdRate } from "@/lib/money";

/** Курс USD → UZS из `USD_UZS_RATE`; null — эквивалент в долларах не показываем. Списание всегда в сумах. */
export function getUsdRate(): number | null {
  return parseUsdRate(process.env.USD_UZS_RATE);
}
