import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HelperArea from './views/helper/HelperArea.jsx'
import OwnerArea from './views/owner/OwnerArea.jsx'
import RolePicker from './views/RolePicker.jsx'

/** Top-level routes: role picker at /demo, then one area per role. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/demo" replace />} />
        <Route path="/demo" element={<RolePicker />} />
        <Route path="/owner/*" element={<OwnerArea />} />
        <Route path="/helper/*" element={<HelperArea />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
