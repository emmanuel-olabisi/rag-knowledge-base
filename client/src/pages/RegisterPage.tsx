import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { registerUser } from "@/services/authService"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Sparkles } from "lucide-react"

function RegisterPage() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async () => {
        if (isLoading) return

        if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
            setError("Please fill in all fields.")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords must match.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const data = await registerUser(username.trim(), email.trim(), password)

            if (data.success) {
                navigate("/login")
            } else {
                setError(data.message || "Registration failed.")
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
                        <CardTitle className="text-2xl">Create your account</CardTitle>
                        <CardDescription>
                            Start uploading documents and chatting with your knowledge base.
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
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRegister()
                        }}
                    />
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <Button onClick={handleRegister} disabled={isLoading} className="w-full">
                        {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                            Log in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegisterPage
