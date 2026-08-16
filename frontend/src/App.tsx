import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { ROIAnalytics } from './pages/ROIAnalytics';
import { Policies } from './pages/Policies';
import { Orchestrator } from './pages/Orchestrator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="analytics" element={<ROIAnalytics />} />
          <Route path="policies" element={<Policies />} />
          <Route path="orchestrator" element={<Orchestrator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
