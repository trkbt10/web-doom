import type { ReactElement } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WadViewerPage from './pages/WadViewerPage';
import WebDoomPage from './pages/WebDoomPage';
import ImageConverterPage from './pages/ImageConverterPage';

function App(): ReactElement {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wad-viewer/*" element={<WadViewerPage />} />
          <Route path="/web-doom" element={<WebDoomPage />} />
          <Route path="/image-converter" element={<ImageConverterPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
