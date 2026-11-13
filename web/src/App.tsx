import { BrowserRouter, Link, Route, Routes } from 'react-router'
import OwnerApp from './owner/OwnerApp.tsx'
import HelperApp from './helper/HelperApp.tsx'

function Picker() {
  return (
    <main className="screen center">
      <h1>Usaldusabiline</h1>
      <p className="muted">Demo: pick a side (open each on a different phone)</p>
      <Link className="btn btn-yes" to="/owner">Owner — Valentina</Link>
      <Link className="btn btn-secondary" to="/helper">Helper — Mari Tamm</Link>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Each side owns its nested routes inside its own folder. */}
        <Route path="/owner/*" element={<OwnerApp />} />
        <Route path="/helper/*" element={<HelperApp />} />
        <Route path="*" element={<Picker />} />
      </Routes>
    </BrowserRouter>
  )
}
