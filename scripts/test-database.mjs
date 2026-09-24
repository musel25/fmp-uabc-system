import { spawnSync } from "node:child_process"
const file = process.argv[2]
if (!file || !/^tests\/database\/[a-z-]+\.sql$/.test(file))
  throw new Error("Specify a tests/database SQL file")
const local = process.env.FMP_TEST_DATABASE_URL
if (local) {
  const u = new URL(local)
  if (!["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))
    throw new Error("Tests require a local database")
  const result = spawnSync(
    "psql",
    ["-X", "-v", "ON_ERROR_STOP=1", "-f", file],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PGHOST: u.hostname,
        PGPORT: u.port || "5432",
        PGUSER: decodeURIComponent(u.username),
        PGPASSWORD: decodeURIComponent(u.password),
        PGDATABASE: u.pathname.slice(1),
      },
    },
  )
  process.exit(result.status ?? 1)
}
// Dedicated disposable local Docker database, never a production endpoint.
const { readFileSync } = await import("node:fs")
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "fmp-reporting-tests",
    "psql",
    "-U",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  { input: readFileSync(file), encoding: "utf8" },
)
process.stdout.write(result.stdout || "")
process.stderr.write(result.stderr || "")
process.exit(result.status ?? 1)
