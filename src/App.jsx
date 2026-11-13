import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HelperHome from './views/helper/HelperHome.jsx'
import OwnerHome from './views/owner/OwnerHome.jsx'
import RolePicker from './views/RolePicker.jsx'

/** Top-level routes: role picker, then one area per role. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RolePicker />} />
        <Route path="/owner/*" element={<OwnerHome />} />
        <Route path="/helper/*" element={<HelperHome />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
