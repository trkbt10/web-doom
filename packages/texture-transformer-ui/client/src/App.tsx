import { Routes, Route, Link } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
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
          {/* Wrap project routes with ProjectProvider for shared state */}
          <Route
            path="/projects/:projectId/*"
            element={
              <ProjectProvider>
                <Routes>
                  <Route index element={<ProjectDetailPage />} />
                  <Route path="textures/:textureName" element={<TextureDetailPage />} />
                  <Route path="groups" element={<GroupsListPage />} />
                  <Route path="groups/:groupId" element={<GroupDetailPage />} />
                </Routes>
              </ProjectProvider>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
