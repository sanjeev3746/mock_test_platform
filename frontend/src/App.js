import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import ExamPage from "./pages/ExamPage"
import ResultPage from "./pages/ResultPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/exam/:attemptId" element={<ExamPage />} />
        <Route path="/result/:attemptId" element={<ResultPage />} />
      </Routes>
    </Router>
  )
}

export default App
