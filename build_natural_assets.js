const fs = require('fs');

const assets = {
"player.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 140" width="80" height="140">
    <defs>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#b71c1c"/><stop offset="50%" stop-color="#ff5252"/><stop offset="100%" stop-color="#b71c1c"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#444"/>
        </linearGradient>
    </defs>
    <!-- Drop Shadow -->
    <ellipse cx="40" cy="70" rx="36" ry="66" fill="rgba(0,0,0,0.5)" />
    <!-- Tires -->
    <rect x="6" y="20" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="20" width="12" height="24" rx="4" fill="#111"/>
    <rect x="6" y="96" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="96" width="12" height="24" rx="4" fill="#111"/>
    <!-- Body -->
    <path d="M 16 28 Q 40 5 64 28 L 72 110 Q 40 135 8 110 Z" fill="url(#body)"/>
    <!-- Racing Stripes -->
    <rect x="32" y="15" width="4" height="113" fill="#fff" opacity="0.8"/>
    <rect x="44" y="15" width="4" height="113" fill="#fff" opacity="0.8"/>
    <!-- Windshield -->
    <path d="M 20 50 Q 40 40 60 50 L 64 75 Q 40 85 16 75 Z" fill="url(#glass)"/>
    <!-- Rear window -->
    <path d="M 26 95 Q 40 90 54 95 L 52 105 Q 40 110 28 105 Z" fill="url(#glass)"/>
    <!-- Headlights -->
    <ellipse cx="24" cy="22" rx="6" ry="3" fill="#fff9c4" />
    <ellipse cx="56" cy="22" rx="6" ry="3" fill="#fff9c4" />
    <!-- Taillights -->
    <rect x="18" y="120" width="12" height="4" rx="2" fill="#ffeb3b" />
    <rect x="50" y="120" width="12" height="4" rx="2" fill="#ffeb3b" />
    <!-- Mirrors -->
    <path d="M 16 62 L 6 65 L 14 70 Z" fill="#d32f2f"/>
    <path d="M 64 62 L 74 65 L 66 70 Z" fill="#d32f2f"/>
</svg>`,

"enemy.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 140" width="80" height="140">
    <defs>
        <linearGradient id="bodyBlue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0d47a1"/><stop offset="50%" stop-color="#1976d2"/><stop offset="100%" stop-color="#0d47a1"/>
        </linearGradient>
    </defs>
    <ellipse cx="40" cy="70" rx="36" ry="66" fill="rgba(0,0,0,0.5)" />
    <rect x="6" y="20" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="20" width="12" height="24" rx="4" fill="#111"/>
    <rect x="6" y="96" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="96" width="12" height="24" rx="4" fill="#111"/>
    <rect x="12" y="15" width="56" height="110" rx="16" fill="url(#bodyBlue)"/>
    <rect x="16" y="45" width="48" height="26" rx="6" fill="#111"/>
    <rect x="22" y="85" width="36" height="16" rx="4" fill="#111"/>
    <rect x="18" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
    <rect x="52" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
    <rect x="18" y="122" width="10" height="4" rx="2" fill="#ff1744" />
    <rect x="52" y="122" width="10" height="4" rx="2" fill="#ff1744" />
</svg>`,

"taxi.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 140" width="80" height="140">
    <defs>
        <linearGradient id="bodyTaxi" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#f57f17"/><stop offset="50%" stop-color="#ffeb3b"/><stop offset="100%" stop-color="#f57f17"/>
        </linearGradient>
    </defs>
    <ellipse cx="40" cy="70" rx="36" ry="66" fill="rgba(0,0,0,0.5)" />
    <rect x="6" y="20" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="20" width="12" height="24" rx="4" fill="#111"/>
    <rect x="6" y="96" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="96" width="12" height="24" rx="4" fill="#111"/>
    <rect x="12" y="15" width="56" height="110" rx="16" fill="url(#bodyTaxi)"/>
    <!-- Checkers -->
    <path d="M 12 76 L 68 76 L 68 84 L 12 84 Z" fill="#111"/>
    <rect x="18" y="76" width="8" height="8" fill="#fff"/><rect x="34" y="76" width="8" height="8" fill="#fff"/>
    <rect x="50" y="76" width="8" height="8" fill="#fff"/>
    
    <rect x="16" y="45" width="48" height="26" rx="6" fill="#111"/>
    <rect x="22" y="90" width="36" height="16" rx="4" fill="#111"/>
    <!-- Taxi Sign -->
    <rect x="30" y="52" width="20" height="8" rx="2" fill="#fff"/>
    <text x="40" y="58" font-family="sans-serif" font-size="6" font-weight="bold" fill="#000" text-anchor="middle">TAXI</text>
    
    <rect x="18" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
    <rect x="52" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
</svg>`,

"police.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 140" width="80" height="140">
    <ellipse cx="40" cy="70" rx="36" ry="66" fill="rgba(0,0,0,0.5)" />
    <rect x="6" y="20" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="20" width="12" height="24" rx="4" fill="#111"/>
    <rect x="6" y="96" width="12" height="24" rx="4" fill="#111"/><rect x="62" y="96" width="12" height="24" rx="4" fill="#111"/>
    <!-- Body -->
    <rect x="12" y="15" width="56" height="110" rx="16" fill="#111"/>
    <!-- White doors -->
    <rect x="8" y="40" width="64" height="40" fill="#eee"/>
    <!-- Windows -->
    <rect x="16" y="45" width="48" height="26" rx="6" fill="#222"/>
    <rect x="22" y="85" width="36" height="16" rx="4" fill="#222"/>
    <!-- Lightbar -->
    <rect x="20" y="60" width="40" height="6" rx="2" fill="#222"/>
    <rect x="22" y="61" width="16" height="4" rx="1" fill="#ff1744"/>
    <rect x="42" y="61" width="16" height="4" rx="1" fill="#2979ff"/>
    <circle cx="40" cy="70" r="4" fill="#ffeb3b"/>
    <!-- Lights -->
    <rect x="18" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
    <rect x="52" y="12" width="10" height="4" rx="2" fill="#fff9c4" />
</svg>`,

"van.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86 160" width="86" height="160">
    <defs>
        <linearGradient id="bodyVan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e0e0e0"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e0e0e0"/>
        </linearGradient>
    </defs>
    <ellipse cx="43" cy="80" rx="38" ry="76" fill="rgba(0,0,0,0.5)" />
    <rect x="8" y="24" width="14" height="28" rx="4" fill="#111"/><rect x="64" y="24" width="14" height="28" rx="4" fill="#111"/>
    <rect x="8" y="110" width="14" height="28" rx="4" fill="#111"/><rect x="64" y="110" width="14" height="28" rx="4" fill="#111"/>
    <!-- Body -->
    <rect x="14" y="14" width="58" height="132" rx="12" fill="url(#bodyVan)"/>
    <!-- Windshield -->
    <rect x="18" y="32" width="50" height="22" rx="4" fill="#111"/>
    <!-- Details -->
    <rect x="22" y="65" width="42" height="70" rx="4" fill="#eee"/>
    <!-- Lights -->
    <rect x="20" y="12" width="12" height="4" rx="2" fill="#fff9c4" />
    <rect x="54" y="12" width="12" height="4" rx="2" fill="#fff9c4" />
</svg>`,

"truck.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 220" width="96" height="220">
    <defs>
        <linearGradient id="trailer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#607d8b"/><stop offset="50%" stop-color="#90a4ae"/><stop offset="100%" stop-color="#607d8b"/>
        </linearGradient>
        <linearGradient id="cab" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e64a19"/><stop offset="50%" stop-color="#ff7043"/><stop offset="100%" stop-color="#e64a19"/>
        </linearGradient>
    </defs>
    <ellipse cx="48" cy="110" rx="42" ry="106" fill="rgba(0,0,0,0.5)" />
    <!-- Tires -->
    <rect x="6" y="24" width="16" height="30" rx="6" fill="#111"/><rect x="74" y="24" width="16" height="30" rx="6" fill="#111"/>
    <rect x="6" y="100" width="16" height="30" rx="6" fill="#111"/><rect x="74" y="100" width="16" height="30" rx="6" fill="#111"/>
    <rect x="6" y="160" width="16" height="30" rx="6" fill="#111"/><rect x="74" y="160" width="16" height="30" rx="6" fill="#111"/>
    <!-- Cab -->
    <rect x="18" y="10" width="60" height="45" rx="8" fill="url(#cab)"/>
    <rect x="22" y="25" width="52" height="20" rx="4" fill="#111"/>
    <!-- Trailer -->
    <rect x="12" y="60" width="72" height="150" rx="4" fill="url(#trailer)"/>
    <!-- Roof details -->
    <rect x="22" y="65" width="52" height="140" fill="#78909c"/>
</svg>`,

"bus.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 220" width="96" height="220">
    <defs>
        <linearGradient id="bodyBus" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#2e7d32"/><stop offset="50%" stop-color="#4caf50"/><stop offset="100%" stop-color="#2e7d32"/>
        </linearGradient>
    </defs>
    <ellipse cx="48" cy="110" rx="42" ry="106" fill="rgba(0,0,0,0.5)" />
    <rect x="8" y="30" width="14" height="30" rx="4" fill="#111"/><rect x="74" y="30" width="14" height="30" rx="4" fill="#111"/>
    <rect x="8" y="150" width="14" height="30" rx="4" fill="#111"/><rect x="74" y="150" width="14" height="30" rx="4" fill="#111"/>
    <!-- Body -->
    <rect x="14" y="12" width="68" height="196" rx="10" fill="url(#bodyBus)"/>
    <rect x="18" y="24" width="60" height="24" rx="4" fill="#111"/>
    <!-- Roof A/C units -->
    <rect x="32" y="55" width="32" height="16" rx="2" fill="#eee"/>
    <rect x="32" y="160" width="32" height="16" rx="2" fill="#eee"/>
    <!-- Top Windows -->
    <rect x="20" y="75" width="56" height="80" rx="4" fill="#222"/>
    <rect x="46" y="75" width="4" height="80" fill="#4caf50"/>
    <rect x="20" y="98" width="56" height="4" fill="#4caf50"/>
    <rect x="20" y="125" width="56" height="4" fill="#4caf50"/>
</svg>`,

"tree.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <ellipse cx="60" cy="100" rx="35" ry="15" fill="rgba(0,0,0,0.4)" />
    <!-- Trunk -->
    <rect x="52" y="80" width="16" height="30" fill="#5D4037" />
    <!-- Leaves Layers -->
    <polygon points="60,10 100,60 20,60" fill="#2E7D32" />
    <polygon points="60,35 105,85 15,85" fill="#1B5E20" />
    <polygon points="60,10 90,50 60,50" fill="#4CAF50" opacity="0.3" />
    <polygon points="60,35 95,75 60,75" fill="#4CAF50" opacity="0.3" />
</svg>`,

"wheel.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stop-color="#111"/><stop offset="100%" stop-color="#333"/>
        </radialGradient>
    </defs>
    <!-- Outer grip -->
    <circle cx="60" cy="60" r="54" fill="none" stroke="url(#grad)" stroke-width="12" />
    <!-- Inner metallic rim -->
    <circle cx="60" cy="60" r="46" fill="none" stroke="#757575" stroke-width="2" />
    <!-- Spokes -->
    <path d="M 60 60 L 20 60 L 30 75 Z" fill="#424242"/>
    <path d="M 60 60 L 100 60 L 90 75 Z" fill="#424242"/>
    <path d="M 60 60 L 60 105 L 75 95 Z" fill="#424242"/>
    <!-- Center Horn -->
    <circle cx="60" cy="60" r="16" fill="#212121" stroke="#616161" stroke-width="3"/>
    <!-- Logo/Accents -->
    <circle cx="60" cy="60" r="6" fill="#b71c1c" />
    <rect x="56" y="8" width="8" height="6" fill="#ff1744" rx="2"/>
</svg>`,

"coin.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
    <ellipse cx="30" cy="45" rx="20" ry="10" fill="rgba(0,0,0,0.4)" />
    <circle cx="30" cy="28" r="24" fill="#FBC02D" stroke="#F57F17" stroke-width="4"/>
    <circle cx="30" cy="28" r="16" fill="#FFF176" />
    <text x="30" y="38" font-family="sans-serif" font-size="28" font-weight="bold" fill="#F57F17" text-anchor="middle">$</text>
</svg>`
};

for (const [filename, content] of Object.entries(assets)) {
    fs.writeFileSync(filename, content);
    console.log("Wrote " + filename);
}
