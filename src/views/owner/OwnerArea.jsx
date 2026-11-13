import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import LiveProvider from '../../components/LiveProvider.jsx'
import { useLive } from '../../live.js'
import OwnerConfirm from './OwnerConfirm.jsx'
import OwnerDecline from './OwnerDecline.jsx'
import OwnerHome from './OwnerHome.jsx'
import OwnerRequest from './OwnerRequest.jsx'
import OwnerResult from './OwnerResult.jsx'
import OwnerReview from './OwnerReview.jsx'

/** Picks the screen for one transfer from its status. */
function OwnerTransfer() {
  const { id } = useParams()
  const transfer = useLive().transfers.find((x) => x.id === id)
  if (!transfer) return <Navigate to="/owner" replace />
  if (['PENDING_APPROVAL', 'APPROVED'].includes(transfer.status)) {
    return <OwnerReview transfer={transfer} />
  }
  return <OwnerResult transfer={transfer} />
}

/** Everything under /owner. */
export default function OwnerArea() {
  return (
    <LiveProvider role="owner">
      <Routes>
        <Route index element={<OwnerHome />} />
        <Route path="request" element={<OwnerRequest />} />
        <Route path="transfers/:id" element={<OwnerTransfer />} />
        <Route path="transfers/:id/confirm" element={<OwnerConfirm />} />
        <Route path="transfers/:id/decline" element={<OwnerDecline />} />
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Routes>
    </LiveProvider>
  )
}
