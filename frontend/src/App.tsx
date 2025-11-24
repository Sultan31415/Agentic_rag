import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatScreenWithSidebar } from './screens/ChatScreenWithSidebar';
import { AttachmentsScreen } from './screens/AttachmentsScreen';

/**
 * Main Application Component
 *
 * Router setup with chat and attachments pages
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatScreenWithSidebar />} />
        <Route path="/attachments" element={<AttachmentsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
