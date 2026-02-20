require("dotenv").config()
const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://mock-test-platform-two.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}))

app.use(express.json())
app.use("/api/auth", require("./routes/auth.routes"))
app.use("/api/attempt", require("./routes/attempt.routes"))
app.use("/api/test", require("./routes/test.routes"))
app.use("/api/leaderboard", require("./routes/leaderboard.routes"))
app.use("/api/analytics", require("./routes/analytics.routes"))
app.use("/api/topic-analytics", require("./routes/topicAnalytics.routes"))
app.use("/api/palette", require("./routes/palette.routes"))


app.get("/", (req, res) => {
  res.send("Mock Test Backend Running")
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
