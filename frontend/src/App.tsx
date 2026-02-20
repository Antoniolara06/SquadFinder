import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import TablonPage from './pages/TablonPage';
import PlayerSearchPage from './pages/PlayerSearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateAnuncioPage from './pages/CreateAnuncioPage';
import Teclado from './pages/Teclado';
import EditProfilePage from './pages/EditProfilePage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import PlayerProfilePage from './pages/PlayerProfilePage';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tablon" element={<TablonPage />} />
          <Route path="/players" element={<PlayerSearchPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-anuncio" element={<CreateAnuncioPage />} />
            <Route path="/teclado" element={<Teclado />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/chat/:friendId" element={<ChatPage />} />
            <Route path="/chat/user/:friendId" element={<ChatPage />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
