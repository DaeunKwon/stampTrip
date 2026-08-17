import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import ScrollToTop from './components/ScrollToTop'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import { UserDataProvider } from './store/UserDataProvider'
import Home from './pages/Home'
import Course from './pages/Course'
import NearbySpots from './pages/NearbySpots'
import Map from './pages/Map'
import Archive from './pages/Archive'
import Detail from './pages/Detail'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import AccountSettings from './pages/AccountSettings'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

/** 로그인 후 화면 공통 셸: 모바일 프레임 + 하단 탭바 */
function AppShell() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative overflow-hidden">
      <main className="pb-20 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
      <Navbar />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
    <ToastProvider>
    <ScrollToTop />
    <Routes>
      {/* 공개 */}
      <Route path="/login" element={<Login />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* 로그인은 했지만 프로필(닉네임)이 아직 없는 첫 가입자 */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth allowNoProfile>
            <Onboarding />
          </RequireAuth>
        }
      />

      {/* 로그인 + 프로필 필요 */}
      <Route
        element={
          <RequireAuth>
            <UserDataProvider>
              <AppShell />
            </UserDataProvider>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/nearby" element={<NearbySpots />} />
        <Route path="/map" element={<Map />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
    </ToastProvider>
    </AuthProvider>
  )
}
