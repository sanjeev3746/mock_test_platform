import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const res = await api.post("/auth/login", {
        email,
        password
      })

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("userId", res.data.user.id)

      alert("Login successful")
      navigate("/dashboard") // or wherever you want

    } catch (err) {
      alert("Invalid credentials")
    }
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          style={{ marginTop: "20px" }}
        >
          Login
        </button>
        <p style={{ marginTop: "20px" }}>
          Don’t have an account?{" "}
          <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => navigate("/register")}
          >
            Register here
            </span>
            </p>
      </form>
    </div>
  )
}

export default Login