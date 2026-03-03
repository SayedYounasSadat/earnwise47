// Real-time earnings display with smooth animation
import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EarningsDisplayProps {
  usdAmount: number;
  exchangeRate: number;
  currencyCode: string;
  isActive: boolean;
}

// Animated number component
const AnimatedNumber = memo(
  ({
    value,
    decimals = 2,
    className,
    prefix = "",
    suffix = "",
  }: {
    value: number;
    decimals?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
  }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      // Smooth spring-like animation using requestAnimationFrame
      const diff = value - displayValue;
      if (Math.abs(diff) < 0.0001) {
        setDisplayValue(value);
        return;
      }

      let raf: number;
      const animate = () => {
        setDisplayValue((prev) => {
          const d = value - prev;
          if (Math.abs(d) < 0.0001) return value;
          // Ease factor: lerp 12% per frame for buttery smooth counting
          return prev + d * 0.12;
        });
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(raf);
    }, [value]);

    return (
      <span className={cn("tabular-nums", className)}>
        {prefix}
        {displayValue.toFixed(decimals)}
        {suffix}
      </span>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";

export const EarningsDisplay = memo(
  ({ usdAmount, exchangeRate, currencyCode, isActive }: EarningsDisplayProps) => {
    const convertedAmount = usdAmount * exchangeRate;

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Main USD earnings */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">
            Current Session
          </p>
          <div
            className={cn(
              "earnings-number text-5xl md:text-6xl lg:text-7xl transition-all duration-300",
              !isActive && "opacity-60"
            )}
          >
            <AnimatedNumber value={usdAmount} decimals={4} prefix="$" />
          </div>
        </div>

        {/* Converted currency */}
        <div className="text-center">
          <div
            className={cn(
              "text-2xl md:text-3xl font-bold text-primary transition-opacity duration-300",
              !isActive && "opacity-60"
            )}
          >
            <AnimatedNumber
              value={convertedAmount}
              decimals={2}
              suffix={` ${currencyCode}`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            @ {exchangeRate} {currencyCode}/USD
          </p>
        </div>
      </div>
    );
  }
);

EarningsDisplay.displayName = "EarningsDisplay";
