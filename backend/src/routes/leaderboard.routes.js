const router = require("express").Router()
const prisma = require("../config/prisma")

router.get("/:testId", async (req, res) => {
  try {
    const { testId } = req.params

    // Fetch all results for this test
    const results = await prisma.result.findMany({
      where: {
        attempt: {
          testId: testId
        }
      },
      include: {
        attempt: {
          include: {
            user: true
          }
        }
      }
    })

    // Group by user and keep BEST score
    const userBestScores = {}

    for (const result of results) {
      const userId = result.attempt.user.id

      if (
        !userBestScores[userId] ||
        result.score > userBestScores[userId].score
      ) {
        userBestScores[userId] = {
          name: result.attempt.user.name,
          score: result.score
        }
      }
    }

    // Convert object to array and sort
    const sorted = Object.values(userBestScores).sort(
      (a, b) => b.score - a.score
    )

    const totalCandidates = sorted.length

    const leaderboard = sorted.map((entry, index) => {
      const rank = index + 1

      const belowCount = sorted.filter(e => e.score < entry.score).length

      let percentile = 0

      if (totalCandidates === 1) {
        percentile = 100
      } else {
        percentile = ((belowCount / (totalCandidates - 1)) * 100).toFixed(2)
      }

      return {
        rank,
        name: entry.name,
        score: entry.score,
        percentile: Number(percentile),
        totalCandidates
      }
    })

    res.json(leaderboard)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching leaderboard" })
  }
})

module.exports = router
