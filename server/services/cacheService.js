const cache = new Map()

const DEFAULT_TTL_MS = 1000 * 60 * 30

function get(key) {
    const entry = cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }

    return entry.value
}

function set(key, value, ttlMs = DEFAULT_TTL_MS) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    })
}

function del(key) {
    cache.delete(key)
}

function stats() {
    return {
        size: cache.size,
    }
}

module.exports = {
    get,
    set,
    del,
    stats,
}
