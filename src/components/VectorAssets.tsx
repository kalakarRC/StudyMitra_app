// src/components/VectorAssets.tsx
import { useId, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  label?: string;
};

function SvgFrame({
  label,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={label ? "img" : undefined}
      aria-labelledby={label ? titleId : undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {label && <title id={titleId}>{label}</title>}
      {children}
    </svg>
  );
}

export function UrjaOrbitIcon(props: IconProps) {
  const id = useId();

  return (
    <SvgFrame {...props}>
      <defs>
        <radialGradient id={`${id}-core`}>
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".15" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="32" rx="25" ry="10" stroke="currentColor" />
      <ellipse
        cx="32"
        cy="32"
        rx="25"
        ry="10"
        stroke="currentColor"
        transform="rotate(60 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="25"
        ry="10"
        stroke="currentColor"
        transform="rotate(120 32 32)"
      />
      <circle cx="32" cy="32" r="7" fill={`url(#${id}-core)`} />
    </SvgFrame>
  );
}

export function SikkaCoinIcon(props: IconProps) {
  const id = useId();

  return (
    <SvgFrame {...props}>
      <defs>
        <linearGradient id={`${id}-coin`} x1="12" y1="12" x2="52" y2="54">
          <stop stopColor="#f8d994" />
          <stop offset="1" stopColor="#b97528" />
        </linearGradient>
      </defs>
      <path d="M32 5 54 18v28L32 59 10 46V18L32 5Z" fill={`url(#${id}-coin)`} />
      <path d="M32 12 48 21v21l-16 9-16-9V21l16-9Z" stroke="#fff2cf" />
      <path d="m32 20 9 12-9 12-9-12 9-12Z" fill="#80521f" />
    </SvgFrame>
  );
}

export function ScallopedBadge(props: IconProps) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 24 - Math.PI / 2;
    const radius = i % 2 === 0 ? 27 : 24;
    return `${32 + Math.cos(angle) * radius},${32 + Math.sin(angle) * radius}`;
  }).join(" ");

  return (
    <SvgFrame {...props}>
      <polygon points={points} fill="currentColor" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="white" strokeOpacity=".6" />
    </SvgFrame>
  );
}

export function LayeredAvatarSVG({
  label = "Student avatar",
  ...props
}: IconProps) {
  return (
    <SvgFrame label={label} {...props}>
      <path d="M10 60c2-14 11-21 22-21s20 7 22 21H10Z" fill="currentColor" opacity=".72" />
      <path d="M20 27c0-11 5-17 12-17s12 6 12 17v5c0 8-5 14-12 14s-12-6-12-14v-5Z" fill="#d9a98c" />
      <path d="M19 27c0-13 5-20 14-20 8 0 13 6 13 17-4-4-8-6-14-6-3 4-7 6-13 9Z" fill="#30242b" />
      <path d="M26 31h1m10 0h1" stroke="#30242b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 37c2 2 6 2 8 0" stroke="#8f544c" strokeWidth="1.5" strokeLinecap="round" />
    </SvgFrame>
  );
}

export function FlameAuraIcon(props: IconProps) {
  const id = useId();

  return (
    <SvgFrame {...props}>
      <defs>
        <linearGradient id={`${id}-flame`} x1="32" y1="4" x2="32" y2="58">
          <stop stopColor="#ffd27a" />
          <stop offset="1" stopColor="#dd5836" />
        </linearGradient>
      </defs>
      <path
        d="M33 5c4 12-2 15 5 22 2-5 5-7 5-11 10 11 13 20 8 30-4 8-11 12-20 12S13 52 11 42c-2-9 3-18 12-27-1 8 1 11 4 14 2-7 2-15 6-24Z"
        fill={`url(#${id}-flame)`}
      />
    </SvgFrame>
  );
}

export function FlyingFormulaLayer() {
  return (
    <svg className="formula-layer" viewBox="0 0 800 500" aria-hidden="true">
      <g fill="currentColor" opacity=".16" fontFamily="sans-serif">
        <text x="60" y="90">F = ma</text>
        <text x="520" y="150">V = IR</text>
        <text x="330" y="370">E = mc²</text>
      </g>
    </svg>
  );
}
