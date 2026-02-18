const auth = require("../middleware/auth.middleware")
const router = require("express").Router()
const prisma = require("../config/prisma")

// =======================
// GET ATTEMPT (For Timer)
// =======================
router.get("/:attemptId", auth, async (req, res) => {
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: req.params.attemptId }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    res.json(attempt)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching attempt" })
  }
})


// =======================
// START TEST
// =======================
router.post("/start/:testId", auth, async (req, res) => {
  try {
    const userId = req.user.userId
    const { testId } = req.params

    if (!userId) {
      return res.status(400).json({ message: "UserId required" })
    }

    const test = await prisma.test.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return res.status(404).json({ message: "Test not found" })
    }

    const start = new Date()
    const end = new Date(start.getTime() + test.duration * 60000)

    const attempt = await prisma.attempt.create({
      data: {
        userId,
        testId,
        startTime: start,
        endTime: end
      }
    })

    res.json(attempt)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error starting test" })
  }
})


// =======================
// SAVE ANSWER (AUTO SAVE)
// =======================
router.post("/save-answer/:attemptId", auth, async (req, res) => {
  try {
    const { attemptId } = req.params
    const { questionId, optionId, marked } = req.body

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    if (attempt.submitted) {
      return res.status(400).json({
        message: "Cannot modify submitted attempt"
      })
    }

    const existing = await prisma.response.findFirst({
      where: {
        attemptId,
        questionId
      }
    })

    if (existing) {
      await prisma.response.update({
        where: { id: existing.id },
        data: {
          optionId: optionId ?? existing.optionId,
          marked: marked ?? existing.marked
        }
      })
    } else {
      await prisma.response.create({
        data: {
          attemptId,
          questionId,
          optionId: optionId ?? null,
          marked: marked ?? false
        }
      })
    }

    res.json({ message: "Answer saved" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error saving answer" })
  }
})


// =======================
// SUBMIT TEST
// =======================
router.post("/submit/:attemptId", auth, async (req, res) => {
  try {
    const { attemptId } = req.params

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        result: true,
        responses: true,
        test: {
          include: {
            questions: {
              include: { options: true }
            }
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    if (attempt.result) {
      return res.status(400).json({
        message: "Attempt already submitted"
      })
    }

    // Convert saved responses into answer map
    const answers = {}
    for (const r of attempt.responses) {
      answers[r.questionId] = r.optionId
    }

    let score = 0

    for (const question of attempt.test.questions) {
      const correctOption = question.options.find(o => o.isCorrect)
      const userAnswer = answers?.[question.id]

      if (!userAnswer) continue

      if (userAnswer === correctOption?.id) {
        score += question.marks
      } else {
        score -= question.negative
      }
    }

    await prisma.result.create({
      data: {
        attemptId,
        score
      }
    })

    await prisma.attempt.update({
      where: { id: attemptId },
      data: { submitted: true }
    })

    res.json({ score })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error submitting test" })
  }
})

module.exports = router
