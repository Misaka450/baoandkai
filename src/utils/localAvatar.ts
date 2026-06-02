/**
 * 本地 SVG 头像生成器
 * 替代 DiceBear API，避免外网请求
 */

// 简单的字符串哈希函数
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// 从哈希生成确定性颜色
function hslFromHash(hash: number, offset: number): string {
  const h = (hash + offset) % 360
  const s = 50 + (hash % 30)
  const l = 45 + (hash % 20)
  return `hsl(${h}, ${s}%, ${l}%)`
}

/**
 * 生成可爱的 SVG 头像 Data URL
 * @param seed 种子字符串（如名字）
 * @param bg 背景色（hex，如 'C9ADA7'）
 */
export function generateLocalAvatar(seed: string, bg: string = 'C9ADA7'): string {
  const hash = hashString(seed)
  const bgColor = `#${bg.replace('#', '')}`

  // 基于 seed 生成确定性但看起来随机的面部特征
  const eyeStyle = hash % 3 // 0: 圆眼, 1: 眯眼, 2: 大眼
  const mouthStyle = hash % 3 // 0: 微笑, 1: 大笑, 2: 害羞
  const hasBlush = hash % 2 === 0
  const hairStyle = hash % 4 // 0: 短发, 1: 长发, 2: 卷发, 3: 马尾
  const accessory = hash % 5 // 0: 无, 1: 帽子, 2: 蝴蝶结, 3: 眼镜, 4: 耳环

  const skinColor = hslFromHash(hash, 0)
  const hairColor = hslFromHash(hash, 120)
  const eyeColor = hslFromHash(hash, 240)

  // 眼睛
  let eyes = ''
  if (eyeStyle === 0) {
    eyes = `<circle cx="35" cy="42" r="4" fill="${eyeColor}"/>
      <circle cx="65" cy="42" r="4" fill="${eyeColor}"/>
      <circle cx="36" cy="41" r="1.5" fill="white"/>
      <circle cx="66" cy="41" r="1.5" fill="white"/>`
  } else if (eyeStyle === 1) {
    eyes = `<path d="M30 42 Q35 38 40 42" stroke="${eyeColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M60 42 Q65 38 70 42" stroke="${eyeColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  } else {
    eyes = `<circle cx="35" cy="42" r="5.5" fill="white" stroke="${eyeColor}" stroke-width="1.5"/>
      <circle cx="65" cy="42" r="5.5" fill="white" stroke="${eyeColor}" stroke-width="1.5"/>
      <circle cx="35" cy="42" r="3" fill="${eyeColor}"/>
      <circle cx="65" cy="42" r="3" fill="${eyeColor}"/>
      <circle cx="36" cy="40" r="1.2" fill="white"/>
      <circle cx="66" cy="40" r="1.2" fill="white"/>`
  }

  // 嘴巴
  let mouth = ''
  if (mouthStyle === 0) {
    mouth = `<path d="M42 58 Q50 64 58 58" stroke="#E57373" stroke-width="2" fill="none" stroke-linecap="round"/>`
  } else if (mouthStyle === 1) {
    mouth = `<path d="M40 56 Q50 66 60 56" stroke="#E57373" stroke-width="2" fill="#FFCDD2" stroke-linecap="round"/>`
  } else {
    mouth = `<ellipse cx="50" cy="60" rx="4" ry="2.5" fill="#FFAB91"/>`
  }

  // 腮红
  const blush = hasBlush
    ? `<circle cx="28" cy="52" r="6" fill="#FFCDD2" opacity="0.5"/>
      <circle cx="72" cy="52" r="6" fill="#FFCDD2" opacity="0.5"/>`
    : ''

  // 头发
  let hair = ''
  if (hairStyle === 0) {
    hair = `<ellipse cx="50" cy="28" rx="32" ry="18" fill="${hairColor}"/>`
  } else if (hairStyle === 1) {
    hair = `<ellipse cx="50" cy="28" rx="34" ry="20" fill="${hairColor}"/>
      <rect x="18" y="28" width="12" height="30" rx="6" fill="${hairColor}"/>
      <rect x="70" y="28" width="12" height="30" rx="6" fill="${hairColor}"/>`
  } else if (hairStyle === 2) {
    hair = `<circle cx="30" cy="22" r="10" fill="${hairColor}"/>
      <circle cx="50" cy="16" r="12" fill="${hairColor}"/>
      <circle cx="70" cy="22" r="10" fill="${hairColor}"/>
      <circle cx="22" cy="32" r="8" fill="${hairColor}"/>
      <circle cx="78" cy="32" r="8" fill="${hairColor}"/>`
  } else {
    hair = `<ellipse cx="50" cy="28" rx="32" ry="18" fill="${hairColor}"/>
      <ellipse cx="75" cy="45" rx="8" ry="20" fill="${hairColor}"/>`
  }

  // 配饰
  let acc = ''
  if (accessory === 1) {
    acc = `<rect x="22" y="10" width="56" height="16" rx="8" fill="#FF8A65"/>
      <rect x="18" y="22" width="64" height="6" rx="3" fill="#FFAB91"/>`
  } else if (accessory === 2) {
    acc = `<path d="M50 14 L44 22 L50 18 L56 22 Z" fill="#F48FB1"/>
      <circle cx="50" cy="18" r="3" fill="#EC407A"/>`
  } else if (accessory === 3) {
    acc = `<circle cx="35" cy="42" r="9" fill="none" stroke="#78909C" stroke-width="2"/>
      <circle cx="65" cy="42" r="9" fill="none" stroke="#78909C" stroke-width="2"/>
      <line x1="44" y1="42" x2="56" y2="42" stroke="#78909C" stroke-width="2"/>`
  } else if (accessory === 4) {
    acc = `<circle cx="22" cy="52" r="3" fill="#FFD54F"/>
      <circle cx="78" cy="52" r="3" fill="#FFD54F"/>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <clipPath id="circle-clip">
        <circle cx="50" cy="50" r="48"/>
      </clipPath>
    </defs>
    <circle cx="50" cy="50" r="48" fill="${bgColor}"/>
    <g clip-path="url(#circle-clip)">
      ${hair}
      <ellipse cx="50" cy="55" rx="26" ry="30" fill="${skinColor}"/>
      ${eyes}
      ${mouth}
      ${blush}
      ${acc}
    </g>
  </svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}
