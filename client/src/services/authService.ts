const API_URL = import.meta.env.VITE_API_URL

export type AuthResult = {
    success: boolean
    message?: string
    token?: string
}

async function parseAuthResponse(response: Response): Promise<AuthResult> {
    try {
        return await response.json()
    } catch {
        return { success: false, message: "invalid server response" }
    }
}

export async function registerUser(
    username: string,
    email: string,
    password: string
): Promise<AuthResult> {
    try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        })

        const data = await parseAuthResponse(response)

        if (!response.ok && data.success !== false) {
            return { success: false, message: "registration failed" }
        }

        return data
    } catch {
        return {
            success: false,
            message: "unable to reach server. check your connection.",
        }
    }
}

export async function loginUser(
    username: string,
    password: string
): Promise<AuthResult> {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
        })

        const data = await parseAuthResponse(response)

        if (!response.ok && data.success !== false) {
            return { success: false, message: "login failed" }
        }

        return data
    } catch {
        return {
            success: false,
            message: "unable to reach server. check your connection.",
        }
    }
}
