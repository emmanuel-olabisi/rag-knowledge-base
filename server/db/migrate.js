require("dotenv").config()

const fs = require("fs")
const path = require("path")
const pool = require("./db")

async function migrate() {
    const migrationPath = path.join(
        __dirname,
        "migrations",
        "001_rag_upgrade.sql"
    )
    const sql = fs.readFileSync(migrationPath, "utf8")

    await pool.query(sql)
    console.log("Migration completed successfully.")
    await pool.end()
}

migrate().catch(async (error) => {
    console.error("Migration failed:", error)
    await pool.end()
    process.exit(1)
})
