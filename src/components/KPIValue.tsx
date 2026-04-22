"use client";

import { CountUp } from "./CountUp";

export function KPIValue({
  value,
  unit,
  className,
  animate,
  storageKey,
}: {
  value: string;
  unit?: string;
  className: string;
  animate?: boolean;
  storageKey?: string;
}) {
  const isNumeric = /^[<>≤≥~]?\d/.test(value.replace(/,/g, ""));
  const longText = !isNumeric && value.length > 10;

  if (animate && isNumeric) {
    const match = value.match(/^([<>≤≥~]?)([0-9,]+\.?\d*)\s*(.*)$/);
    if (match) {
      const [, prefix, numStr, suffix] = match;
      const num = parseFloat(numStr.replace(/,/g, ""));
      const decimals = numStr.includes(".") ? (numStr.split(".")[1]?.length ?? 0) : 0;
      const hasSeparator = numStr.includes(",");

      return (
        <div className={`${className} break-words`}>
          <CountUp
            value={num}
            durationMs={700}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix ? ` ${suffix}`.trimEnd() : ""}
            separator={hasSeparator}
            storageKey={storageKey}
          />
          {unit && <span className="text-[12px] sm:text-[14px] font-sans font-normal text-dim ml-1">{unit}</span>}
        </div>
      );
    }
  }

  return (
    <div className={`${className} ${longText ? "!text-[clamp(16px,4.5vw,24px)]" : ""} break-words`}>
      {value}
      {unit && <span className="text-[12px] sm:text-[14px] font-sans font-normal text-dim ml-1">{unit}</span>}
    </div>
  );
}
