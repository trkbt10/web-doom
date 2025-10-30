import type { ReactElement } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WadViewerPage from './pages/WadViewerPage';
import { DoomPlayerPage } from './pages/DoomPlayerPage';
import ImageConverterPage from './pages/ImageConverterPage';
import GameControllerPage from './pages/GameControllerPage';

function App(): ReactElement {
  return (
    <HashRouter>
      <Routes>
        {/* DOOM Player - Standalone fullscreen page without layout */}
        <Route path="/doom-player" element={<DoomPlayerPage />} />

        {/* Other pages - Use default layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/wad-viewer/*" element={<WadViewerPage />} />
              <Route path="/image-converter" element={<ImageConverterPage />} />
              <Route path="/game-controller" element={<GameControllerPage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;
