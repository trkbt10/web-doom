import type { ReactElement } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WadViewerPage from './pages/WadViewerPage';
import WebDoomPage from './pages/WebDoomPage';
import WebDoom2DPage from './pages/WebDoom2DPage';
import WebDoom3DPage from './pages/WebDoom3DPage';
import ImageConverterPage from './pages/ImageConverterPage';

function App(): ReactElement {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wad-viewer/*" element={<WadViewerPage />} />
          <Route path="/web-doom" element={<WebDoomPage />} />
          <Route path="/web-doom-2d" element={<WebDoom2DPage />} />
          <Route path="/web-doom-3d" element={<WebDoom3DPage />} />
          <Route path="/image-converter" element={<ImageConverterPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
