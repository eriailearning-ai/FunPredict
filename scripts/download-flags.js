/**
 * Download all 48 FIFA World Cup 2026 team flag images from flagcdn.com
 *
 * Usage (run once from the project root):
 *   node scripts/download-flags.js
 *
 * Flags are saved to: public/images/flags/{code}.png
 * Requires Node.js 18+ (built-in fetch)
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'flags')
fs.mkdirSync(OUT_DIR, { recursive: true })

const FLAGS = [
  // Group A
  'mx', 'za', 'kr', 'cz',
  // Group B
  'ca', 'ba', 'qa', 'ch',
  // Group C
  'ht', 'gb-sct', 'br', 'ma',
  // Group D
  'us', 'py', 'au', 'tr',
  // Group E
  'de', 'cw', 'ci', 'ec',
  // Group F
  'nl', 'jp', 'se', 'tn',
  // Group G
  'ir', 'nz', 'be', 'eg',
  // Group H
  'sa', 'uy', 'es', 'cv',
  // Group I
  'fr', 'sn', 'no', 'iq',
  // Group J
  'ar', 'dz', 'at', 'jo',
  // Group K
  'pt', 'cd', 'uz', 'co',
  // Group L
  'gb-eng', 'hr', 'gh', 'pa',
]

function download(code) {
  return new Promise((resolve, reject) => {
    const url = `https://flagcdn.com/48x36/${code}.png`
    const dest = path.join(OUT_DIR, `${code}.png`)

    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log(`  ⬛ ${code} (already exists)`)
      return resolve()
    }

    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        console.log(`  ✗ ${code} (HTTP ${res.statusCode})`)
        return resolve()
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log(`  ✓ ${code}`)
        resolve()
      })
    }).on('error', err => {
      file.close()
      fs.unlink(dest, () => {})
      console.error(`  ✗ ${code} (${err.message})`)
      resolve()
    })
  })
}

async function main() {
  console.log(`Downloading ${FLAGS.length} flag images to public/images/flags/...\n`)
  // Download in small batches to avoid rate limiting
  for (let i = 0; i < FLAGS.length; i += 4) {
    const batch = FLAGS.slice(i, i + 4)
    await Promise.all(batch.map(download))
  }
  console.log('\nDone! Restart your dev server to see flags load from local files.')
}

main().catch(console.error)
