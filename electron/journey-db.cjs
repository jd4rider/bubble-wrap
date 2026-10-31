const { DatabaseSync } = require('node:sqlite')

const MAX_STATE_BYTES = 100_000

function createJourneyStore(filePath) {
  const db = new DatabaseSync(filePath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS journey (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  const load = () => {
    const row = db.prepare('SELECT state FROM journey WHERE id = 1').get()
    if (!row || typeof row.state !== 'string') return null
    try {
      return JSON.parse(row.state)
    } catch {
      return null
    }
  }

  const save = (state) => {
    if (!state || typeof state !== 'object') {
      throw new TypeError('Journey state must be an object')
    }
    const serialized = JSON.stringify(state)
    if (serialized.length > MAX_STATE_BYTES) {
      throw new RangeError('Journey state is too large')
    }
    db.prepare(`
      INSERT INTO journey (id, state, updated_at) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
    `).run(serialized, new Date().toISOString())
    return true
  }

  const reset = () => {
    db.prepare('DELETE FROM journey WHERE id = 1').run()
    return true
  }

  const close = () => db.close()

  return { load, save, reset, close }
}

module.exports = { createJourneyStore }
