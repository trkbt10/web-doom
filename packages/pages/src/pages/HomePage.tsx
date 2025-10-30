import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage(): ReactElement {
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
            <div className="feature-card" style={{ backgroundColor: '#2a2a2a', border: '2px solid #4CAF50' }}>
              <h3>🎮 DOOM Player (WASM) ⭐</h3>
              <p>完全版DOOMランタイム！ブラウザでDOOMをプレイできます。WebAssemblyベースの高速実行。</p>
              <Link to="/doom-player" className="feature-link" style={{ color: '#4CAF50' }}>DOOM起動 →</Link>
            </div>

            <div className="feature-card">
              <h3>WAD Viewer</h3>
              <p>View and analyze DOOM WAD files in your browser. Inspect lumps, validate structure, and explore game data.</p>
              <Link to="/wad-viewer" className="feature-link">Open WAD Viewer →</Link>
            </div>

            <div className="feature-card">
              <h3>Image Converter</h3>
              <p>Convert between PNG/JPEG images and DOOM picture format. Create custom textures and sprites for WAD files.</p>
              <Link to="/image-converter" className="feature-link">Open Converter →</Link>
            </div>

            <div className="feature-card">
              <h3>Game Controller</h3>
              <p>Interactive game controller with multi-input support. Touch, mouse, and gamepad inputs for browser-based gaming.</p>
              <Link to="/game-controller" className="feature-link">Try Controller →</Link>
            </div>
          </div>
        </section>

        <section className="home-about">
          <h2>About This Project</h2>
          <p>
            ブラウザで動作するDOOMプラットフォーム。WADファイル解析、画像変換、
            そして完全なDOOMランタイム（js-dos）を統合しています。
          </p>
          <div className="tech-stack">
            <h3>Technology Stack</h3>
            <ul>
              <li>TypeScript for type-safe development</li>
              <li>React 18 for UI components</li>
              <li>js-dos for DOOM runtime (WebAssembly DOSBox)</li>
              <li>Canvas API for WAD viewing and image conversion</li>
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
