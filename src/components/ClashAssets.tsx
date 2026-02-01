import React from "react";

// ============================================
// Elixir Drop Icon (Clash Royale Style)
// ============================================

interface ElixirDropProps {
  size?: number;
  className?: string;
}

export const ElixirDrop: React.FC<ElixirDropProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Main gradient for the drop */}
      <linearGradient id="elixirGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e879f9" />
        <stop offset="30%" stopColor="#c026d3" />
        <stop offset="70%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      {/* Highlight gradient */}
      <linearGradient id="elixirHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      {/* Glow filter */}
      <filter id="elixirGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Drop shadow */}
    <ellipse cx="50" cy="92" rx="20" ry="5" fill="rgba(0,0,0,0.3)" />

    {/* Main drop shape */}
    <path
      d="M50 5 C50 5, 85 45, 85 65 C85 85, 70 95, 50 95 C30 95, 15 85, 15 65 C15 45, 50 5, 50 5 Z"
      fill="url(#elixirGradient)"
      stroke="#581c87"
      strokeWidth="3"
      filter="url(#elixirGlow)"
    />

    {/* Inner highlight */}
    <path
      d="M50 12 C50 12, 78 47, 78 64 C78 80, 66 88, 50 88 C34 88, 22 80, 22 64 C22 47, 50 12, 50 12 Z"
      fill="none"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="2"
    />

    {/* Shine highlight */}
    <ellipse
      cx="38"
      cy="50"
      rx="8"
      ry="15"
      fill="url(#elixirHighlight)"
      transform="rotate(-20 38 50)"
    />

    {/* Small sparkle */}
    <circle cx="35" cy="40" r="3" fill="white" opacity="0.8" />
  </svg>
);

// ============================================
// Card Frame (Clash Royale Style)
// ============================================

interface CardFrameProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  children,
  disabled,
  className,
}) => (
  <div className={`relative ${className}`}>
    {/* Card Background SVG */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Card gradient - green Clash Royale style */}
        <linearGradient
          id={`cardGradient${disabled ? "Disabled" : ""}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          {disabled ? (
            <>
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="50%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#5a7a50" />
              <stop offset="30%" stopColor="#4a6a42" />
              <stop offset="70%" stopColor="#3a5a34" />
              <stop offset="100%" stopColor="#2a4a26" />
            </>
          )}
        </linearGradient>

        {/* Border gradient */}
        <linearGradient
          id={`borderGradient${disabled ? "Disabled" : ""}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          {disabled ? (
            <>
              <stop offset="0%" stopColor="#666" />
              <stop offset="100%" stopColor="#444" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a8d89a" />
              <stop offset="50%" stopColor="#7ab868" />
              <stop offset="100%" stopColor="#5a9848" />
            </>
          )}
        </linearGradient>

        {/* Inner shadow */}
        <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" result="offset-blur" />
          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />
          <feFlood floodColor="black" floodOpacity="0.3" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Main card body */}
      <rect
        x="3"
        y="3"
        width="94"
        height="114"
        rx="8"
        ry="8"
        fill={`url(#cardGradient${disabled ? "Disabled" : ""})`}
      />

      {/* Card border */}
      <rect
        x="3"
        y="3"
        width="94"
        height="114"
        rx="8"
        ry="8"
        fill="none"
        stroke={`url(#borderGradient${disabled ? "Disabled" : ""})`}
        strokeWidth="3"
      />

      {/* Top highlight line */}
      <line
        x1="10"
        y1="8"
        x2="90"
        y2="8"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Bottom name plate area */}
      <rect x="5" y="95" width="90" height="20" rx="3" fill="rgba(0,0,0,0.3)" />
    </svg>

    {/* Card content */}
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

// ============================================
// Elixir Cost Badge (Clash Royale Style)
// ============================================

interface ElixirCostBadgeProps {
  cost: number;
  canAfford?: boolean;
  size?: "sm" | "md" | "lg";
}

export const ElixirCostBadge: React.FC<ElixirCostBadgeProps> = ({
  cost,
  canAfford = true,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={`costBadge${canAfford ? "" : "Disabled"}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            {canAfford ? (
              <>
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="50%" stopColor="#c026d3" />
                <stop offset="100%" stopColor="#9333ea" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#666" />
                <stop offset="100%" stopColor="#444" />
              </>
            )}
          </linearGradient>
          <filter id="badgeShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.5" />
          </filter>
        </defs>

        <circle
          cx="50"
          cy="50"
          r="45"
          fill={`url(#costBadge${canAfford ? "" : "Disabled"})`}
          stroke={canAfford ? "#581c87" : "#333"}
          strokeWidth="4"
          filter="url(#badgeShadow)"
        />

        {/* Highlight */}
        <ellipse cx="40" cy="35" rx="15" ry="10" fill="rgba(255,255,255,0.3)" />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center font-black text-white drop-shadow-md">
        {cost}
      </span>
    </div>
  );
};

// ============================================
// Elixir Bar (Clash Royale Style)
// ============================================

interface ElixirBarBackgroundProps {
  fillPercent: number;
  segments?: number;
  className?: string;
}

export const ElixirBarBackground: React.FC<ElixirBarBackgroundProps> = ({
  fillPercent,
  segments = 10,
  className,
}) => (
  <div className={`relative h-6 ${className}`}>
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 24"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Bar background gradient */}
        <linearGradient id="barBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="50%" stopColor="#0f0f1a" />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>

        {/* Elixir fill gradient */}
        <linearGradient id="elixirFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="50%" stopColor="#c026d3" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>

        {/* Shine gradient */}
        <linearGradient id="barShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Outer border */}
      <rect
        x="1"
        y="1"
        width="198"
        height="22"
        rx="4"
        fill="url(#barBg)"
        stroke="#3d3d5c"
        strokeWidth="2"
      />

      {/* Elixir fill */}
      <rect
        x="3"
        y="3"
        width={194 * (fillPercent / 100)}
        height="18"
        rx="3"
        fill="url(#elixirFill)"
      />

      {/* Shine on fill */}
      <rect
        x="3"
        y="3"
        width={194 * (fillPercent / 100)}
        height="9"
        rx="3"
        fill="url(#barShine)"
      />

      {/* Segment lines */}
      {[...Array(segments - 1)].map((_, i) => (
        <line
          key={i}
          x1={3 + (194 / segments) * (i + 1)}
          y1="3"
          x2={3 + (194 / segments) * (i + 1)}
          y2="21"
          stroke="#3d3d5c"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}
    </svg>
  </div>
);

// ============================================
// Crown Icon (Victory)
// ============================================

interface CrownIconProps {
  size?: number;
  className?: string;
}

export const CrownIcon: React.FC<CrownIconProps> = ({
  size = 24,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="crownGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#ffb700" />
        <stop offset="100%" stopColor="#cc8800" />
      </linearGradient>
      <filter id="crownGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Crown base */}
    <path
      d="M15 75 L15 55 L30 65 L50 45 L70 65 L85 55 L85 75 Z"
      fill="url(#crownGold)"
      stroke="#8B6914"
      strokeWidth="3"
      filter="url(#crownGlow)"
    />

    {/* Crown band */}
    <rect
      x="15"
      y="75"
      width="70"
      height="12"
      rx="2"
      fill="url(#crownGold)"
      stroke="#8B6914"
      strokeWidth="2"
    />

    {/* Crown jewels */}
    <circle
      cx="30"
      cy="55"
      r="6"
      fill="#e11d48"
      stroke="#8B6914"
      strokeWidth="2"
    />
    <circle
      cx="50"
      cy="40"
      r="8"
      fill="#3b82f6"
      stroke="#8B6914"
      strokeWidth="2"
    />
    <circle
      cx="70"
      cy="55"
      r="6"
      fill="#22c55e"
      stroke="#8B6914"
      strokeWidth="2"
    />

    {/* Highlights */}
    <ellipse cx="35" cy="68" rx="8" ry="3" fill="rgba(255,255,255,0.3)" />
  </svg>
);
