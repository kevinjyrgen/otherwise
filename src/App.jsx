import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HelperArea from './views/helper/HelperArea.jsx'
import OwnerArea from './views/owner/OwnerArea.jsx'
import RolePicker from './views/RolePicker.jsx'

/** Top-level routes: role picker, then one area per role. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RolePicker />} />
        <Route path="/owner/*" element={<OwnerArea />} />
        <Route path="/helper/*" element={<HelperArea />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
