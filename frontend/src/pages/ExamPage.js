import "./ExamPage.css"
import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"

function ExamPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [palette, setPalette] = useState([])
  const [timeLeft, setTimeLeft] = useState(null)
  const [violations, setViolations] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)

  const hasSubmitted = useRef(false)

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchQuestions()
    fetchPalette()
    fetchAttempt()
  }, [])

  const fetchAttempt = async () => {
    const res = await api.get(`/attempt/${attemptId}`)
    const endTime = new Date(res.data.endTime)
    const now = new Date()
    const secondsLeft = Math.floor((endTime - now) / 1000)
    setTimeLeft(secondsLeft > 0 ? secondsLeft : 0)
  }

  const fetchQuestions = async () => {
    const res = await api.get(`/test/questions/${attemptId}`)
    setQuestions(res.data)
  }

  const fetchPalette = async () => {
    const res = await api.get(`/palette/${attemptId}`)
    setPalette(res.data)
  }

  const saveAnswer = async (questionId, optionId) => {
    setSelectedOption(optionId)

    await api.post(`/attempt/save-answer/${attemptId}`, {
      questionId,
      optionId
    })

    fetchPalette()
  }

  const markForReview = async () => {
    await api.post(`/attempt/save-answer/${attemptId}`, {
      questionId: currentQuestion.id,
      marked: true
    })
    fetchPalette()
  }

  const clearResponse = async () => {
    setSelectedOption(null)

    await api.post(`/attempt/save-answer/${attemptId}`, {
      questionId: currentQuestion.id,
      optionId: null,
      marked: false
    })

    fetchPalette()
  }

  const submitExam = async () => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true

    await api.post(`/attempt/submit/${attemptId}`)
    navigate(`/result/${attemptId}`)
  }

  // =========================
  // TIMER
  // =========================
  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          submitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // =========================
  // TAB SWITCH DETECTION
  // =========================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setViolations(prev => {
          const newCount = prev + 1

          alert("Warning: Do not switch tabs during exam!")

          if (newCount >= 3) {
            alert("Multiple violations detected. Auto-submitting.")
            submitExam()
          }

          return newCount
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  if (!questions.length || timeLeft === null)
    return <div>Loading...</div>

  const currentQuestion = questions[currentIndex]

  return (
    <div className="exam-container">

      <div className="exam-left">

        <div className="exam-header">
          <h3>Mock Test</h3>
          <div className="timer">
            Time Left: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <p>Tab Switch Warnings: {violations} / 3</p>

        <div className="question-box">
          <h4>Question {currentIndex + 1}</h4>
          <p>{currentQuestion.text}</p>

          {currentQuestion.options.map((opt) => (
            <button
              key={opt.id}
              className="option-button"
              style={{
                backgroundColor:
                  selectedOption === opt.id ? "#d0e8ff" : "white",
                border:
                  selectedOption === opt.id
                    ? "2px solid #1976d2"
                    : "1px solid #ccc"
              }}
              onClick={() =>
                saveAnswer(currentQuestion.id, opt.id)
              }
            >
              {opt.text}
            </button>
          ))}

          <div style={{ marginTop: "15px" }}>
            <button onClick={markForReview} className="submit-btn" style={{ backgroundColor: "orange", marginRight: "10px" }}>
              Mark for Review
            </button>

            <button onClick={clearResponse} className="submit-btn" style={{ backgroundColor: "gray", marginRight: "10px" }}>
              Clear Response
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              Previous
            </button>

            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              style={{ marginLeft: "10px" }}
            >
              Next
            </button>
          </div>

          <button
            className="submit-btn"
            style={{ marginTop: "20px" }}
            onClick={submitExam}
          >
            Submit Test
          </button>
        </div>

      </div>

      <div className="exam-right">
        <h4>Question Palette</h4>

        <div className="palette-grid">
          {palette.map((p, index) => (
            <button
              key={p.questionId}
              onClick={() => setCurrentIndex(index)}
              className={`palette-btn ${
                p.status === "ANSWERED"
                  ? "palette-answered"
                  : p.status === "MARKED"
                  ? "palette-marked"
                  : "palette-default"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ExamPage
