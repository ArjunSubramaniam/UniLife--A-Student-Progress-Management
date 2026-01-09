import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Layout } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Assignments from '@/pages/assignments';
import Attendance from '@/pages/attendance';
import Exams from '@/pages/exams';
import Notes from '@/pages/notes';
import Settings from '@/pages/settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;

