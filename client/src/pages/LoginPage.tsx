import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { loginUser } from "@/services/authService"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles } from "lucide-react"

function LoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async () => {
        if (isLoading) return

        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const data = await loginUser(username.trim(), password)

            if (data.success && data.token) {
                localStorage.setItem("token", data.token)
                navigate("/chat")
            } else {
                setError(data.message || "Login failed.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="hero-grid flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="w-full max-w-md shadow-xl shadow-primary/10">
                <CardHeader className="space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Sparkles className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Welcome back</CardTitle>
                        <CardDescription>
                            Log in to access your document workspace and RAG chat.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleLogin()
                        }}
                    />
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                        {isLoading ? "Logging in..." : "Log in"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Need an account?{" "}
                        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                            Register
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default LoginPage
