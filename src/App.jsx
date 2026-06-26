import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Benefits from './pages/Benefits'
import Course from './pages/Course'
import Map from './pages/Map'
import Archive from './pages/Archive'
import Detail from './pages/Detail'

export default function App() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative overflow-hidden">
      <main className="pb-20 min-h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/course" element={<Course />} />
          <Route path="/map" element={<Map />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </main>
      <Navbar />
    </div>
  )
}
