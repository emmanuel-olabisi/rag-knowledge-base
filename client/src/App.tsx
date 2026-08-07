import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import RegisterPage from "@/pages/RegisterPage"
import LoginPage from "@/pages/LoginPage"
import ChatPage from "@/pages/ChatPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token")

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return children
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App
