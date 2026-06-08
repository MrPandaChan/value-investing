import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getIndustryTree } from './generate-sidebar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, 'components', 'industry-overview', 'industry-tree.json')

const tree = getIndustryTree()
writeFileSync(out, JSON.stringify(tree, null, 2))
console.log(`  ✓ industry-tree.json (${tree.length} industries)`)
