import { BrowserRouter, Routes, Route } from 'react-router';
import Auth from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ChatScreen from './pages/ChatScreen.tsx';
import History from './pages/History.tsx';
import Tools from './pages/Tools.tsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Dashboard />}>
          <Route index element={<ChatScreen />} />
          <Route path="chat/:id" element={<ChatScreen />} />
          <Route path="history" element={<History />} />
          <Route path="tools" element={<Tools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
