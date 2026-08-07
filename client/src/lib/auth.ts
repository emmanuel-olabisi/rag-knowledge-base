export function getToken() {
    return localStorage.getItem("token")
}

export function getUsername() {
    const stored = localStorage.getItem("username")
    if (stored) return stored

    const token = getToken()
    if (!token) return "User"

    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        return payload.username || "User"
    } catch {
        return "User"
    }
}

export function setSession(token: string, username: string) {
    localStorage.setItem("token", token)
    localStorage.setItem("username", username)
}

export function clearSession() {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
}
