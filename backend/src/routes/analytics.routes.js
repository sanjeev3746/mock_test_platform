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
            questions: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    const totalQuestions = attempt.test.questions.length
    const attempted = attempt.responses.length
    const unattempted = totalQuestions - attempted

    let correct = 0
    let wrong = 0
    let negativeMarksLost = 0

    const topicStats = {}

    for (const question of attempt.test.questions) {
      const topic = question.topic || "General"

      if (!topicStats[topic]) {
        topicStats[topic] = {
          total: 0,
          attempted: 0,
          correct: 0,
          wrong: 0
        }
      }

      topicStats[topic].total++

      const correctOption = question.options.find(o => o.isCorrect)
      const userResponse = attempt.responses.find(
        r => r.questionId === question.id
      )

      if (!userResponse) continue

      topicStats[topic].attempted++

      if (userResponse.optionId === correctOption?.id) {
        correct++
        topicStats[topic].correct++
      } else {
        wrong++
        topicStats[topic].wrong++
        negativeMarksLost += question.negative
      }
    }

    const accuracy =
      attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0

    const finalScore = correct - negativeMarksLost

    const topicAnalytics = Object.entries(topicStats).map(
      ([topic, data]) => {
        const topicAccuracy =
          data.attempted > 0
            ? ((data.correct / data.attempted) * 100).toFixed(2)
            : 0

        return {
          topic,
          totalQuestions: data.total,
          attempted: data.attempted,
          correct: data.correct,
          wrong: data.wrong,
          accuracy: Number(topicAccuracy),
          weak: Number(topicAccuracy) < 50
        }
      }
    )

    res.json({
      overall: {
        totalQuestions,
        attempted,
        correct,
        wrong,
        unattempted,
        accuracy: Number(accuracy),
        negativeMarksLost,
        finalScore
      },
      topics: topicAnalytics
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error generating analytics" })
  }
})

module.exports = router
