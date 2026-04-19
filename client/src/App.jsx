import { useState } from 'react'
import './index.css'

function App() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      // Securely build the production endpoint
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/classify`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })
      
      if (!response.ok) {
          throw new Error('AI_SERVICE_UNAVAILABLE');
      }

      const resData = await response.json()
      
      if (resData.success && resData.data) {
        setResult(resData.data)
      } else {
        throw new Error(resData.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      console.error(err);
      setError('Server unavailable');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>CrisisAI</h1>
        <p>Real-time Emergency Response Engine</p>
      </div>

      <div className="input-container">
        <input 
          type="text" 
          className="text-input" 
          placeholder="Describe the emergency... (e.g. fire in building)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          disabled={loading}
        />
        <button 
          className="analyze-button" 
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && <div className="error-display">{error}</div>}

      {result && (
        <div className="result-card">
          <div className="result-item">
            <span>Incident Classification</span>
            <span className="badge type">{result.type}</span>
          </div>
          <div className="result-item">
            <span>Threat Severity</span>
            <span className={`badge severity-${result.severity}`}>{result.severity}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
