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
              include: { options: true }
            }
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" })
    }

    const topicStats = {}

    for (const question of attempt.test.questions) {
      const topic = question.topic

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
      const response = attempt.responses.find(
        r => r.questionId === question.id
      )

      if (!response) continue

      topicStats[topic].attempted++

      if (response.optionId === correctOption?.id) {
        topicStats[topic].correct++
      } else {
        topicStats[topic].wrong++
      }
    }

    // Add accuracy + weakness detection
    const result = Object.entries(topicStats).map(([topic, data]) => {
      const accuracy =
        data.attempted > 0
          ? ((data.correct / data.attempted) * 100).toFixed(2)
          : 0

      const acc = Number(accuracy)
      let recommendation = "Good performance. Maintain consistency."
      
      if (acc < 50) {
        recommendation =
        "Focus on fundamentals. Practice at least 20 questions daily from this topic."
      } else if (acc < 75) {
        recommendation =
        "Moderate understanding. Revise concepts and attempt mixed difficulty problems."
      }
      return {
        topic,
        totalQuestions: data.total,
        attempted: data.attempted,
        correct: data.correct,
        wrong: data.wrong,
        accuracy: acc,
        weak: acc < 50,
        recommendation
      }

    })

    res.json(result)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error generating topic analytics" })
  }
})

module.exports = router
