import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage(): JSX.Element {
  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1 className="home-title">WEB DOOM</h1>
          <p className="home-subtitle">DOOM ported to the web using TypeScript and Canvas API</p>
        </header>

        <section className="home-features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>WAD Viewer</h3>
              <p>View and analyze DOOM WAD files in your browser. Inspect lumps, validate structure, and explore game data.</p>
              <Link to="/wad-viewer" className="feature-link">Open WAD Viewer →</Link>
            </div>

            <div className="feature-card">
              <h3>Web DOOM</h3>
              <p>Play DOOM directly in your browser. Load WAD files and experience the classic game on modern web technology.</p>
              <Link to="/web-doom" className="feature-link">Launch Web DOOM →</Link>
            </div>

            <div className="feature-card">
              <h3>Image Converter</h3>
              <p>Convert between PNG/JPEG images and DOOM picture format. Create custom textures and sprites for WAD files.</p>
              <Link to="/image-converter" className="feature-link">Open Converter →</Link>
            </div>
          </div>
        </section>

        <section className="home-about">
          <h2>About This Project</h2>
          <p>
            This project is a complete implementation of the DOOM engine in TypeScript,
            running entirely in the browser. It includes WAD file parsing, image conversion,
            and the game engine itself.
          </p>
          <div className="tech-stack">
            <h3>Technology Stack</h3>
            <ul>
              <li>TypeScript for type-safe development</li>
              <li>React 18 for UI components</li>
              <li>Canvas API for rendering</li>
              <li>Vite for fast development and building</li>
              <li>React Router for navigation</li>
            </ul>
          </div>
        </section>

        <footer className="home-footer">
          <p>Created with TypeScript • Canvas API • React</p>
          <p>Original DOOM © id Software</p>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
