import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NicheDetail from './pages/NicheDetail'
import Opportunities from './pages/Opportunities'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/niche/:id" element={<NicheDetail />} />
        <Route path="/opportunities" element={<Opportunities />} />
      </Routes>
    </Layout>
  )
}
