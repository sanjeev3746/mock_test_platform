const router = require("express").Router()
const prisma = require("../config/prisma")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashed
      }
    })

    res.json({ message: "User created" })
  } catch (error) {
    res.status(500).json({ message: "Error registering" })
  }
})


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    )

    res.json({ token })

  } catch (error) {
    res.status(500).json({ message: "Error logging in" })
  }
})

module.exports = router
