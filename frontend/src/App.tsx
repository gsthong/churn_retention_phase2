import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { ROIAnalytics } from './pages/ROIAnalytics';
import { Orchestrator } from './pages/Orchestrator';
import { Customers } from './pages/Customers';
import { Policies } from './pages/Policies';
import { HumanReviewStudio } from './pages/HumanReviewStudio';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="analytics" element={<ROIAnalytics />} />
          <Route path="orchestrator" element={<Orchestrator />} />
          <Route path="hitl" element={<HumanReviewStudio />} />
          <Route path="customers" element={<Customers />} />
          <Route path="policies" element={<Policies />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
