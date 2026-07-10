import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../store/useUIStore';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

const Layout = () => {
  const { theme } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-main flex transition-colors duration-300">
      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 p-6 lg:p-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-muted">
          <p className="font-medium">© 2026 Courier Aggregator System · All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors duration-150 font-medium">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors duration-150 font-medium">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors duration-150 font-medium">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
