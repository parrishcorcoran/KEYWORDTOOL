import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useApi'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NicheDetail from './pages/NicheDetail'
import Opportunities from './pages/Opportunities'

export default function App() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Login />
  }

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
