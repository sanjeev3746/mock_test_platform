const router = require("express").Router()
const prisma = require("../config/prisma")

router.get("/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: true,
        test: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    const palette = attempt.test.questions.map((question) => {
      const response = attempt.responses.find(
        r => r.questionId === question.id
      )

      if (!response) {
        return {
          questionId: question.id,
          status: "NOT_VISITED"
        }
      }

      if (response.optionId && response.marked) {
        return {
          questionId: question.id,
          status: "ANSWERED_MARKED"
        }
      }

      if (response.optionId) {
        return {
          questionId: question.id,
          status: "ANSWERED"
        }
      }

      if (response.marked) {
        return {
          questionId: question.id,
          status: "MARKED"
        }
      }

      return {
        questionId: question.id,
        status: "NOT_ANSWERED"
      }
    })

    res.json(palette)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching palette status" })
  }
})

module.exports = router
