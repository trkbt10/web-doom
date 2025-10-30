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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wad-viewer/*" element={<WadViewerPage />} />
          <Route path="/doom-player" element={<DoomPlayerPage />} />
          <Route path="/image-converter" element={<ImageConverterPage />} />
          <Route path="/game-controller" element={<GameControllerPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
