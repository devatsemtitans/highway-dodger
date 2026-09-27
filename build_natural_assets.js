const fs = require('fs');

const svgs = {
  'player.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><rect x="5" y="5" width="30" height="70" rx="8" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/><rect x="8" y="25" width="24" height="20" rx="3" fill="#111"/><rect x="10" y="60" width="20" height="10" rx="2" fill="#111"/></svg>`,
  'enemy.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><rect x="5" y="5" width="30" height="70" rx="8" fill="#1976D2" stroke="#0D47A1" stroke-width="2"/><rect x="8" y="20" width="24" height="25" rx="3" fill="#111"/></svg>`,
  'tree.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="#1B5E20"/><circle cx="40" cy="40" r="25" fill="#2E7D32"/><circle cx="40" cy="40" r="15" fill="#4CAF50"/></svg>`,
  'police.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><rect x="5" y="5" width="30" height="70" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2"/><rect x="5" y="25" width="30" height="25" fill="#000000"/><rect x="8" y="35" width="12" height="6" fill="#FF0000"/><rect x="20" y="35" width="12" height="6" fill="#0000FF"/></svg>`,
  'taxi.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><rect x="5" y="5" width="30" height="70" rx="8" fill="#FBC02D" stroke="#F57F17" stroke-width="2"/><rect x="8" y="20" width="24" height="25" rx="3" fill="#111"/><rect x="15" y="10" width="10" height="6" fill="#111"/></svg>`,
  'van.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="86" viewBox="0 0 44 86"><rect x="4" y="4" width="36" height="78" rx="6" fill="#78909C" stroke="#455A64" stroke-width="2"/><rect x="7" y="18" width="30" height="20" rx="2" fill="#111"/></svg>`,
  'bus.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="120" viewBox="0 0 48 120"><rect x="4" y="4" width="40" height="112" rx="4" fill="#00897B" stroke="#004D40" stroke-width="2"/><rect x="8" y="12" width="32" height="15" rx="2" fill="#111"/><rect x="8" y="35" width="32" height="70" rx="2" fill="#E0F2F1" opacity="0.3"/></svg>`,
  'coin.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#FFD700" stroke="#B8860B" stroke-width="2"/><text x="15" y="21" font-family="Arial" font-size="18" font-weight="bold" fill="#B8860B" text-anchor="middle">$</text></svg>`,
  'oil.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><path d="M 25 5 C 10 15, 5 30, 15 45 C 30 50, 45 40, 40 20 Z" fill="#111111" opacity="0.8"/></svg>`,
  'nitro.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="50" viewBox="0 0 30 50"><rect x="5" y="10" width="20" height="35" rx="5" fill="#00E5FF" stroke="#00B8D4" stroke-width="2"/><rect x="10" y="5" width="10" height="5" fill="#757575"/><path d="M 15 15 L 12 25 L 18 25 L 15 40" stroke="#FFFFFF" stroke-width="2" fill="none"/></svg>`
};

for (const [name, content] of Object.entries(svgs)) {
  fs.writeFileSync(name, content);
}
console.log("All assets built.");
