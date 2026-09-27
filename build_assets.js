const fs = require('fs');

const svgs = {
  'player.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><polygon points="20,0 40,20 35,75 20,80 5,75 0,20" fill="#00FFFF" stroke="#FFFFFF" stroke-width="2"/><polygon points="20,20 30,35 25,55 20,60 15,55 10,35" fill="#000000" stroke="#00FFFF" stroke-width="2"/></svg>`,
  
  'enemy.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><rect x="2" y="2" width="36" height="76" rx="6" fill="#FF00FF" stroke="#FFFFFF" stroke-width="2"/><rect x="8" y="15" width="24" height="20" rx="2" fill="#000000"/></svg>`,
  
  'truck.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="140" viewBox="0 0 80 140"><rect x="10" y="5" width="60" height="35" rx="4" fill="#FF5500" stroke="#FFFFFF" stroke-width="2"/><rect x="5" y="45" width="70" height="90" rx="2" fill="#AA3300" stroke="#FF5500" stroke-width="2"/></svg>`,
  
  'police.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><polygon points="20,0 35,15 35,75 20,80 5,75 5,15" fill="#000000" stroke="#FFFFFF" stroke-width="2"/><rect x="5" y="30" width="15" height="8" fill="#FF0000"/><rect x="20" y="30" width="15" height="8" fill="#0000FF"/></svg>`,
  
  'gas.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80"><rect x="5" y="5" width="50" height="70" rx="4" fill="#222222" stroke="#00FF66" stroke-width="2"/><rect x="15" y="15" width="30" height="20" fill="#00FF66"/><text x="30" y="30" font-family="monospace" font-size="14" font-weight="bold" fill="#000" text-anchor="middle">GAS</text></svg>`
};

for (const [name, content] of Object.entries(svgs)) {
  fs.writeFileSync(name, content);
  console.log(`Created ${name}`);
}
