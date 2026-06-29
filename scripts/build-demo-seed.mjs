import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const db = join(root, 'prisma/demo-seed.db')

rmSync(db, { force: true })
rmSync(join(root, 'prisma/prisma/demo-seed.db'), { force: true })

const env = { ...process.env, DATABASE_URL: `file:${db}` }

console.log('Building demo database at', db)
execSync('npx prisma db push', { cwd: root, env, stdio: 'inherit' })
execSync('npx prisma db seed', { cwd: root, env, stdio: 'inherit' })
console.log('Demo database ready:', db)
