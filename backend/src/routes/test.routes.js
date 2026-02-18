const router = require("express").Router()
const prisma = require("../config/prisma")

// Get questions by attemptId
router.get("/questions/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: {
                  select: {
                    id: true,
                    text: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    res.json(attempt.test.questions)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching questions" })
  }
})

module.exports = router
