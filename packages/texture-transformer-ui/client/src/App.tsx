import { Routes, Route, Link } from 'react-router-dom';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TextureDetailPage from './pages/TextureDetailPage';
import GroupsListPage from './pages/GroupsListPage';
import GroupDetailPage from './pages/GroupDetailPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>🎨 DOOM Texture Transformer</h1>
        </Link>
        <p>Transform WAD textures with AI-powered styling</p>
      </header>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<ProjectListPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/textures/:textureName" element={<TextureDetailPage />} />
          <Route path="/projects/:projectId/groups" element={<GroupsListPage />} />
          <Route path="/projects/:projectId/groups/:groupId" element={<GroupDetailPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
