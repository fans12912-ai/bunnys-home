import { useNavigate } from 'react-router-dom'

function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <div className="welcome-icon">🐰</div>
        <h1 className="welcome-title">BUNNY'S HOME</h1>
        <p className="welcome-subtitle">
          欢迎回家。这里有一只 AI 小兔子在等你。
        </p>
        <button
          className="welcome-enter-btn"
          onClick={() => navigate('/chat')}
        >
          开门
        </button>
      </div>
      <p className="welcome-footer">Bunny & Elliott ♡</p>
    </div>
  )
}

export default Welcome
