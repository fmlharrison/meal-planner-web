import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siblingSwagger = resolve(
  root,
  '../meal-planner-api/swagger/v1/swagger.yaml',
)
const githubSwaggerUrl =
  'https://raw.githubusercontent.com/fmlharrison/meal-planner-api/main/swagger/v1/swagger.yaml'

const outDir = join(root, 'src/types')
const dtsOut = join(outDir, 'api.d.ts')
const zodOut = join(outDir, 'api.zod.ts')

mkdirSync(outDir, { recursive: true })

async function resolveSwaggerInput() {
  if (existsSync(siblingSwagger)) {
    console.log(`Using local swagger: ${siblingSwagger}`)
    return siblingSwagger
  }

  console.log(`Sibling swagger not found; fetching ${githubSwaggerUrl}`)
  const response = await fetch(githubSwaggerUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch swagger (${response.status} ${response.statusText})`,
    )
  }

  const dir = mkdtempSync(join(tmpdir(), 'meal-planner-swagger-'))
  const path = join(dir, 'swagger.yaml')
  writeFileSync(path, await response.text())
  return path
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const swaggerInput = await resolveSwaggerInput()

run('npx', ['openapi-typescript', swaggerInput, '-o', dtsOut])
run('npx', [
  'openapi-zod-client',
  swaggerInput,
  '-o',
  zodOut,
  '--export-schemas',
])

console.log(`Wrote ${dtsOut}`)
console.log(`Wrote ${zodOut}`)
