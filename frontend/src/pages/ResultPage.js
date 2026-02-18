import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../api"
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

function ResultPage() {
  const { attemptId } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchResult()
  }, [])

  const fetchResult = async () => {
    const res = await api.get(`/analytics/${attemptId}`)
    setData(res.data)
  }

  if (!data) return <div>Loading...</div>

  const topicLabels = data.topics.map(t => t.topic)
  const topicAccuracy = data.topics.map(t => t.accuracy)

  const chartData = {
    labels: topicLabels,
    datasets: [
      {
        label: "Topic Accuracy (%)",
        data: topicAccuracy,
        backgroundColor: "rgba(25, 118, 210, 0.6)"
      }
    ]
  }

  return (
    <div style={{ padding: "30px" }}>
      <h2>Exam Result</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={cardStyle}>
          <h4>Final Score</h4>
          <p>{data.overall.finalScore}</p>
        </div>

        <div style={cardStyle}>
          <h4>Accuracy</h4>
          <p>{data.overall.accuracy}%</p>
        </div>

        <div style={cardStyle}>
          <h4>Correct</h4>
          <p>{data.overall.correct}</p>
        </div>

        <div style={cardStyle}>
          <h4>Wrong</h4>
          <p>{data.overall.wrong}</p>
        </div>
      </div>

      {/* Chart */}
      <h3>Topic Performance</h3>
      <Bar data={chartData} />
    </div>
  )
}

const cardStyle = {
  flex: 1,
  padding: "20px",
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  textAlign: "center"
}

export default ResultPage
