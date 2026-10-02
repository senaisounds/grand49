import type { MerchItem } from "../content";

const FABRIC = {
  black: { fill: "#141414", stroke: "#4a4a4a", ink: "#efe8dc", accent: "#d4141c" },
  bone: { fill: "#d8d0c2", stroke: "#b6ad9d", ink: "#0b0b0b", accent: "#b10f16" },
  red: { fill: "#8f0e14", stroke: "#b5161e", ink: "#efe8dc", accent: "#0b0b0b" },
};

/** Typographic SVG garment mockups (no product photos yet). */
export function MerchMockup({ item }: { item: MerchItem }) {
  const f = FABRIC[item.colorway];
  const common = { fill: f.fill, stroke: f.stroke, strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 300 300" className="mock-svg" role="img" aria-label={`${item.name} mockup`}>
      <defs>
        <filter id={`rough-${item.kind}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      {item.kind === "tee" && (
        <g filter={`url(#rough-${item.kind})`}>
          <path {...common} d="M95 40 L60 52 L18 92 L44 128 L70 112 L70 268 L230 268 L230 112 L256 128 L282 92 L240 52 L205 40 C196 62 176 72 150 72 C124 72 104 62 95 40 Z" />
          <path d="M108 44 C118 60 132 64 150 64 C168 64 182 60 192 44" fill="none" stroke={f.stroke} strokeWidth="3" />
          <text x="150" y="152" textAnchor="middle" className="mock-print" fill={f.ink} fontSize="44">{item.print}</text>
          <rect x="96" y="162" width="108" height="3" fill={f.accent} />
          {item.printSub && <text x="150" y="182" textAnchor="middle" className="mock-mono" fill={f.ink} fontSize="7.4">{item.printSub}</text>}
        </g>
      )}
      {item.kind === "hoodie" && (
        <g filter={`url(#rough-${item.kind})`}>
          <path {...common} d="M104 52 C110 22 190 22 196 52 L248 70 L286 196 L254 206 L232 132 L232 272 L68 272 L68 132 L46 206 L14 196 L52 70 Z" />
          <path d="M112 56 C116 86 184 86 188 56 C182 34 118 34 112 56 Z" fill="#000" opacity="0.55" />
          <path d="M138 84 L136 124 M162 84 L164 124" stroke={f.stroke} strokeWidth="2.5" />
          <path d="M96 210 L204 210 L196 252 L104 252 Z" fill="none" stroke={f.stroke} strokeWidth="2" />
          <text x="150" y="176" textAnchor="middle" className="mock-print mock-eth" fill={f.ink} fontSize="40">{item.print}</text>
          {item.printSub && <text x="150" y="196" textAnchor="middle" className="mock-mono" fill={f.accent} fontSize="9">{item.printSub}</text>}
        </g>
      )}
      {item.kind === "cap" && (
        <g filter={`url(#rough-${item.kind})`}>
          <path {...common} d="M62 182 C58 112 98 72 150 72 C202 72 242 112 238 182 Z" />
          <path {...common} d="M54 180 C120 168 210 168 286 196 C262 222 196 214 150 204 C110 196 74 196 54 180 Z" />
          <path d="M150 74 L150 180 M104 86 C96 120 96 150 100 180 M196 86 C204 120 204 150 200 180" fill="none" stroke={f.stroke} strokeWidth="2" />
          <circle cx="150" cy="74" r="5" fill={f.stroke} />
          <text x="150" y="160" textAnchor="middle" className="mock-print" fill={f.ink} fontSize="50">{item.print}</text>
        </g>
      )}
    </svg>
  );
}
