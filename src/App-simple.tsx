import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Legal Case Management AI</h1>
            <p>Testing basic React functionality</p>
          </div>
        </div>
      </header>
      <div className="app-content">
        <main className="main-content">
          <div className="welcome-message">
            <h2>App is Loading Successfully!</h2>
            <p>If you can see this, React is working correctly.</p>
            <p>The async listener error might be from browser extensions or security settings.</p>
          </div>
        </main>
      </div>
    </div>
  );
}