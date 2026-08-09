import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const width = 1280
const height = 720
const fps = 30
const duration = 15
const frameCount = fps * duration
const output = new URL('../public/services.mp4', import.meta.url).pathname
const poster = new URL('../public/services-poster.jpg', import.meta.url).pathname
const framesDir = mkdtempSync(join(tmpdir(), 'arko-services-'))

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const ease = (value) => {
  const x = clamp(value)
  return 1 - Math.pow(1 - x, 3)
}
const smooth = (value) => {
  const x = clamp(value)
  return x * x * (3 - 2 * x)
}
const between = (time, start, end) => smooth((time - start) / (end - start))
const fadeWindow = (time, start, end, feather = 0.45) =>
  clamp((time - start) / feather) * clamp((end - time) / feather)

function dashboard() {
  const bars = [44, 67, 38, 82, 59, 92, 74, 105, 88, 128, 112, 146]
  const rows = [
    ['Nova Mobile', 'Product design', '82%', 'LIVE'],
    ['Cobalt OS', 'Engineering', '61%', 'BUILD'],
    ['Atlas Cloud', 'Automation', '44%', 'REVIEW'],
  ]

  return `
    <rect x="-430" y="-245" width="860" height="490" rx="3" fill="#f3f2eb"/>
    <rect x="-430" y="-245" width="860" height="48" fill="#0a0b0a"/>
    <circle cx="-398" cy="-221" r="5" fill="#b8ff2e"/><circle cx="-381" cy="-221" r="5" fill="#72766f"/><circle cx="-364" cy="-221" r="5" fill="#40443f"/>
    <text x="-328" y="-216" class="micro" fill="#d8dbd3">ARKO / COMMAND CENTER</text>
    <rect x="-430" y="-197" width="136" height="442" fill="#121512"/>
    <text x="-398" y="-151" class="mini" fill="#6f746d">WORKSPACE</text>
    ${['Overview', 'Projects', 'Systems', 'Analytics'].map((label, index) => `
      <g transform="translate(-406 ${-116 + index * 42})">
        ${index === 0 ? '<rect x="-10" y="-19" width="112" height="34" rx="6" fill="#b8ff2e"/>' : ''}
        <rect x="2" y="-5" width="10" height="10" rx="2" fill="${index === 0 ? '#0a0b0a' : '#6f746d'}"/>
        <text x="23" y="4" class="ui" fill="${index === 0 ? '#0a0b0a' : '#a7aca4'}">${label}</text>
      </g>`).join('')}
    <rect x="-406" y="172" width="88" height="34" rx="17" fill="#232723"/>
    <circle cx="-388" cy="189" r="10" fill="#b8ff2e"/><text x="-366" y="193" class="mini" fill="#d8dbd3">ONLINE</text>

    <text x="-262" y="-153" class="mini" fill="#757a73">MONDAY, AUG 09</text>
    <text x="-262" y="-116" class="heading" fill="#0a0b0a">Build what matters.</text>
    <rect x="316" y="-156" width="82" height="36" rx="18" fill="#0a0b0a"/><text x="357" y="-134" text-anchor="middle" class="mini" fill="#b8ff2e">+ NEW BUILD</text>

    <g transform="translate(-262 -78)">
      <rect width="310" height="148" rx="12" fill="#0d100e"/>
      <text x="22" y="30" class="mini" fill="#777d75">DELIVERY VELOCITY</text>
      <text x="22" y="68" class="metric" fill="#f3f2eb">+28.4%</text>
      <text x="214" y="67" class="mini" fill="#b8ff2e">↗ THIS MONTH</text>
      <path d="M22 119 C64 112 72 92 112 101 S171 70 208 78 S252 39 288 48" fill="none" stroke="#b8ff2e" stroke-width="4"/>
      <path d="M22 119 C64 112 72 92 112 101 S171 70 208 78 S252 39 288 48 L288 130H22Z" fill="url(#chartFade)"/>
    </g>
    <g transform="translate(66 -78)">
      <rect width="332" height="148" rx="12" fill="#deddd5"/>
      <text x="20" y="30" class="mini" fill="#666b65">ACTIVE HOURS</text>
      <text x="20" y="67" class="metric" fill="#0a0b0a">1,284</text>
      ${bars.map((bar, index) => `<rect x="${20 + index * 24}" y="${128 - bar * 0.55}" width="13" height="${bar * 0.55}" rx="3" fill="${index > 8 ? '#0a0b0a' : '#a9aaa4'}"/>`).join('')}
    </g>

    <text x="-262" y="104" class="mini" fill="#6a6f68">ACTIVE PROJECTS</text>
    ${rows.map(([name, type, progress, status], index) => {
      const y = 126 + index * 34
      return `<g transform="translate(-262 ${y})">
        <rect width="660" height="28" rx="6" fill="${index % 2 ? '#e6e5de' : '#ecebe4'}"/>
        <circle cx="16" cy="14" r="6" fill="${index === 0 ? '#b8ff2e' : '#0a0b0a'}"/>
        <text x="31" y="18" class="ui strong" fill="#0a0b0a">${name}</text>
        <text x="184" y="18" class="ui" fill="#747872">${type}</text>
        <rect x="352" y="11" width="100" height="6" rx="3" fill="#c3c3bc"/><rect x="352" y="11" width="${parseInt(progress, 10)}" height="6" rx="3" fill="#0a0b0a"/>
        <text x="466" y="18" class="ui strong" fill="#0a0b0a">${progress}</text>
        <rect x="566" y="5" width="76" height="18" rx="9" fill="${index === 0 ? '#b8ff2e' : '#d0d0c8'}"/><text x="604" y="17" text-anchor="middle" class="tiny" fill="#0a0b0a">${status}</text>
      </g>`
    }).join('')}
  `
}

function backend(time) {
  const nodes = [
    [-284, -72, 'EDGE', '34ms'], [-94, -132, 'AUTH', '99.9%'], [118, -88, 'API', '2.4k/s'],
    [288, -5, 'QUEUE', '12 jobs'], [138, 112, 'POSTGRES', '8.2 GB'], [-114, 120, 'WORKERS', '18 live'], [-310, 54, 'CACHE', '94%'],
  ]
  const dash = 18 + (time * 36) % 44
  return `
    <rect x="-430" y="-245" width="860" height="490" rx="3" fill="#080a09"/>
    <g stroke="#b8ff2e" stroke-opacity=".08">${Array.from({ length: 18 }, (_, i) => `<path d="M${-430 + i * 50} -245V245"/>`).join('')}${Array.from({ length: 11 }, (_, i) => `<path d="M-430 ${-245 + i * 50}H430"/>`).join('')}</g>
    <text x="-398" y="-205" class="micro" fill="#b8ff2e">ARKO CLOUD / LIVE ARCHITECTURE</text>
    <rect x="300" y="-224" width="98" height="28" rx="14" fill="#152017" stroke="#b8ff2e" stroke-opacity=".5"/><circle cx="318" cy="-210" r="4" fill="#b8ff2e"/><text x="330" y="-206" class="tiny" fill="#b8ff2e">ALL SYSTEMS</text>
    <g fill="none" stroke="#b8ff2e" stroke-width="2" stroke-opacity=".48" stroke-dasharray="${dash} 14">
      <path d="M-284 -72 C-220 -150 -164 -142 -94 -132 S42 -98 118 -88 S230 -62 288 -5"/>
      <path d="M288 -5 C260 66 214 102 138 112 S-26 136 -114 120 S-238 76 -310 54"/>
      <path d="M-310 54 C-324 0 -314 -34 -284 -72"/><path d="M-94 -132 C-78 -38 -32 58 -114 120"/><path d="M118 -88 C72 2 74 54 138 112"/>
    </g>
    ${nodes.map(([x, y, label, stat], index) => `
      <g transform="translate(${x} ${y})" filter="url(#softShadow)">
        <rect x="-62" y="-31" width="124" height="62" rx="10" fill="${index === 2 ? '#b8ff2e' : '#111612'}" stroke="#b8ff2e" stroke-opacity="${index === 2 ? 1 : 0.55}"/>
        <rect x="-48" y="-16" width="18" height="18" rx="4" fill="${index === 2 ? '#0a0b0a' : '#b8ff2e'}" opacity="${0.7 + (index % 2) * 0.3}"/>
        <text x="-21" y="-4" class="mini" fill="${index === 2 ? '#0a0b0a' : '#eef0e8'}">${label}</text>
        <text x="-48" y="17" class="tiny" fill="${index === 2 ? '#30410f' : '#70786f'}">${stat}</text>
      </g>`).join('')}
    <g transform="translate(-398 198)"><text class="tiny" fill="#626a62">EVENT STREAM</text>${Array.from({ length: 32 }, (_, i) => `<rect x="${i * 24}" y="12" width="${8 + (i * 13) % 14}" height="3" rx="1" fill="#b8ff2e" opacity="${0.2 + (i % 5) * 0.15}"/>`).join('')}</g>
  `
}

function icon(type, x, y, scale, rotation, delay, time) {
  const pop = ease((time - delay) / 0.65)
  if (pop <= 0) return ''
  const bounce = Math.sin(clamp((time - delay) / 0.65) * Math.PI) * 0.28
  const float = Math.sin(time * 1.6 + delay) * 7
  const actualScale = scale * (pop + bounce)
  const art = {
    code: `<path d="M-45 -26L0 -50 45 -26 0 -2Z" fill="#dfffa4"/><path d="M-45 -26V28L0 53V-2Z" fill="#8dcc24"/><path d="M45 -26V28L0 53V-2Z" fill="#b8ff2e"/><path d="M-23 2L-8 15-23 28M23 2L8 15 23 28" fill="none" stroke="#0a0b0a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    database: `<ellipse cy="-33" rx="43" ry="20" fill="#eaffc3"/><path d="M-43 -33V33C-43 44 43 44 43 33V-33C43-20-43-20-43-33Z" fill="#99db2b"/><path d="M-43 -2C-43 11 43 11 43-2M-43 26C-43 39 43 39 43 26" fill="none" stroke="#dfffa4" stroke-width="5"/><ellipse cy="-33" rx="43" ry="20" fill="#b8ff2e" stroke="#f0ffd7" stroke-width="3"/>`,
    cloud: `<path d="M-45 29C-68 29-71-5-50-13C-52-38-19-51-2-31C13-51 50-39 48-13C73-7 68 29 45 29Z" fill="#dfffa4"/><path d="M-45 29C-68 29-71-5-50-13L-27 0 45 29Z" fill="#8dcc24" opacity=".72"/><path d="M-17 1L0-16 17 1M0-14V19" fill="none" stroke="#0a0b0a" stroke-width="7" stroke-linecap="round"/>`,
    shield: `<path d="M0-53L44-35V-2C44 25 26 45 0 57C-26 45-44 25-44-2V-35Z" fill="#b8ff2e"/><path d="M0-53V57C26 45 44 25 44-2V-35Z" fill="#8dcc24"/><path d="M-20 1L-6 15 23-16" fill="none" stroke="#0a0b0a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
    spark: `<path d="M0-58L13-16 50-36 27 0 58 15 16 19 31 56 0 29-31 56-16 19-58 15-27 0-50-36-13-16Z" fill="#b8ff2e" stroke="#eaffc3" stroke-width="3"/><circle r="13" fill="#0a0b0a"/>`,
  }[type]

  return `<g transform="translate(${x} ${y + float}) rotate(${rotation + Math.sin(time + delay) * 5}) scale(${actualScale})" filter="url(#iconShadow)">${art}</g>`
}

function frameSvg(index) {
  const time = index / fps
  const intro = ease(time / 2.2)
  const pushIn = between(time, 3.25, 5.8)
  const pullOut = between(time, 8.2, 10.4)
  const finale = between(time, 13.0, 15)
  const cameraScale = (0.58 + intro * 0.42) * (1 + pushIn * 1.56) * (1 - pullOut * 0.61) * (1 - finale * 0.08)
  const cameraY = 360 + (1 - intro) * 70 + pushIn * 8 - pullOut * 4
  const tilt = (1 - intro) * 8 - pullOut * 2
  const dashboardOpacity = fadeWindow(time, 0, 6.9, 0.7)
  const backendOpacity = fadeWindow(time, 5.75, 15.6, 0.65)
  const screenContent = `<g opacity="${dashboardOpacity}">${dashboard()}</g><g opacity="${backendOpacity}">${backend(time)}</g>`
  const iconsVisible = time >= 9.35
  const halo = clamp((time - 9.1) / 1.2)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050706"/><stop offset=".55" stop-color="#101610"/><stop offset="1" stop-color="#050605"/></linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f0f1ed"/><stop offset=".5" stop-color="#999f98"/><stop offset="1" stop-color="#4f544f"/></linearGradient>
      <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b8ff2e" stop-opacity=".42"/><stop offset="1" stop-color="#b8ff2e" stop-opacity="0"/></linearGradient>
      <radialGradient id="halo"><stop stop-color="#b8ff2e" stop-opacity=".28"/><stop offset=".55" stop-color="#b8ff2e" stop-opacity=".06"/><stop offset="1" stop-color="#b8ff2e" stop-opacity="0"/></radialGradient>
      <filter id="screenGlow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#b8ff2e" flood-opacity=".16"/></filter>
      <filter id="softShadow" x="-30%" y="-40%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity=".65"/></filter>
      <filter id="iconShadow" x="-80%" y="-80%" width="260%" height="280%"><feDropShadow dx="0" dy="18" stdDeviation="12" flood-color="#000" flood-opacity=".65"/><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#b8ff2e" flood-opacity=".25"/></filter>
      <clipPath id="screen"><rect x="-430" y="-245" width="860" height="490" rx="9"/></clipPath>
    </defs>
    <style>
      .brand{font:900 26px Arial,sans-serif;letter-spacing:-1px}.heading{font:800 29px Arial,sans-serif;letter-spacing:-1px}.metric{font:800 30px Arial,sans-serif}.ui{font:500 11px Arial,sans-serif}.strong{font-weight:700}.micro{font:700 12px monospace;letter-spacing:1.8px}.mini{font:700 9px monospace;letter-spacing:.8px}.tiny{font:700 7px monospace;letter-spacing:.6px}
    </style>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <ellipse cx="640" cy="355" rx="510" ry="340" fill="url(#halo)" opacity="${halo}"/>
    <g stroke="#b8ff2e" stroke-opacity=".055">${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 80} 0V720"/>`).join('')}${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 80}H1280"/>`).join('')}</g>
    <text x="48" y="54" class="brand" fill="#b8ff2e">ARKO®</text>
    <text x="1232" y="52" text-anchor="end" class="micro" fill="#b8ff2e">${time < 3.3 ? 'PRODUCT / EXPERIENCE' : time < 6 ? 'CAMERA / INTERFACE' : time < 9.3 ? 'SYSTEM / BACKEND' : 'FULL-STACK / DEPLOYED'}</text>

    <g transform="translate(640 ${cameraY}) scale(${cameraScale}) skewX(${tilt})">
      <g filter="url(#screenGlow)">
        <rect x="-455" y="-270" width="910" height="540" rx="25" fill="#171b18" stroke="url(#metal)" stroke-width="12"/>
        <rect x="-438" y="-253" width="876" height="506" rx="12" fill="#050605"/>
        <circle cy="-260" r="4" fill="#343a35"/><circle cy="-260" r="1.5" fill="#b8ff2e" opacity=".45"/>
        <g clip-path="url(#screen)">${screenContent}</g>
        <path d="M-420-238L-35-238-350 238H-430V-228Q-430-238-420-238Z" fill="#fff" opacity=".025"/>
      </g>
      <g transform="translate(0 272)">
        <path d="M-510 0H510L432 72H-432Z" fill="url(#metal)"/>
        <path d="M-432 72H432L394 87H-394Z" fill="#444944"/>
        <path d="M-98 11H98L76 35H-76Z" fill="#707670" stroke="#c3c6c0" stroke-opacity=".4"/>
        <path d="M-498 7H498" stroke="#fff" stroke-opacity=".25"/>
      </g>
    </g>

    ${iconsVisible ? icon('code', 205, 236, 1.05, -12, 9.35, time) : ''}
    ${iconsVisible ? icon('database', 1048, 248, 1.02, 10, 9.65, time) : ''}
    ${iconsVisible ? icon('cloud', 1110, 470, 0.92, 8, 10.0, time) : ''}
    ${iconsVisible ? icon('shield', 178, 492, 0.88, -9, 10.3, time) : ''}
    ${iconsVisible ? icon('spark', 1005, 115, 0.62, 6, 10.65, time) : ''}

    <g transform="translate(48 654)"><rect width="1184" height="2" fill="#b8ff2e" opacity=".18"/><rect width="${1184 * (index / (frameCount - 1))}" height="4" y="-1" fill="#b8ff2e"/></g>
    <text x="48" y="685" class="tiny" fill="#697068">DESIGN → ENGINEERING → INFRASTRUCTURE → AUTOMATION</text>
    <text x="1232" y="685" text-anchor="end" class="tiny" fill="#697068">${String(index + 1).padStart(4, '0')} / ${frameCount}</text>
  </svg>`
}

try {
  for (let index = 0; index < frameCount; index += 1) {
    const number = String(index + 1).padStart(4, '0')
    const svgPath = join(framesDir, `frame-${number}.svg`)
    const pngPath = join(framesDir, `frame-${number}.png`)
    writeFileSync(svgPath, frameSvg(index))
    execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height), '-o', pngPath, svgPath])
    if (index % 30 === 0) process.stdout.write(`Rendered ${index}/${frameCount}\r`)
  }

  execFileSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', join(framesDir, 'frame-%04d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-g', '1',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output,
  ], { stdio: 'inherit' })
  execFileSync('ffmpeg', ['-y', '-ss', '1.8', '-i', output, '-frames:v', '1', '-update', '1', '-q:v', '2', poster], { stdio: 'inherit' })
} finally {
  rmSync(framesDir, { recursive: true, force: true })
}
