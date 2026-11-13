import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import LiveProvider from '../../components/LiveProvider.jsx'
import { useLive } from '../../live.js'
import HelperHome from './HelperHome.jsx'
import HelperPrepare from './HelperPrepare.jsx'
import HelperStatus from './HelperStatus.jsx'

/** Picks the screen for one transfer: the form while it is hers to edit, the status after. */
function HelperTransfer() {
  const { id } = useParams()
  const transfer = useLive().transfers.find((x) => x.id === id)
  if (!transfer) return <Navigate to="/helper" replace />
  if (['REQUESTED', 'DRAFT'].includes(transfer.status)) {
    return <HelperPrepare key={transfer.id} transfer={transfer} />
  }
  return <HelperStatus transfer={transfer} />
}

/** Everything under /helper. */
export default function HelperArea() {
  return (
    <LiveProvider role="helper">
      <Routes>
        <Route index element={<HelperHome />} />
        <Route path="transfers/:id" element={<HelperTransfer />} />
        <Route path="*" element={<Navigate to="/helper" replace />} />
      </Routes>
    </LiveProvider>
  )
}
