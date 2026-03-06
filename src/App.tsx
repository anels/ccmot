import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OfferManager from './components/OfferManager';
import CardManager from './components/CardManager';
import Settings from './components/Settings';

import { useEffect } from 'react';
import { useStore } from './lib/store';



function App() {
  const initialize = useStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/offers" element={<OfferManager />} />
          <Route path="/cards" element={<CardManager />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
