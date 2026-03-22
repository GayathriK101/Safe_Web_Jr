import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiClock, FiMoon, FiStar, FiBarChart2, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Landing.css';

export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    { title: "Real-time Content Scanning", icon: <FiShield />, desc: "Instantly detect and block inappropriate content before it's displayed." },
    { title: "Screen Time Control", icon: <FiClock />, desc: "Set daily limits and easily manage when your kids can access the web." },
    { title: "Bedtime Mode", icon: <FiMoon />, desc: "Ensure your kids get restful sleep by blocking access during bedtime hours." },
    { title: "Points & Rewards", icon: <FiStar />, desc: "Motivate positive online behavior with a fun, built-in rewards system." },
    { title: "Weekly Reports", icon: <FiBarChart2 />, desc: "Get detailed insights into your child's online activities every week." },
    { title: "Panic Button", icon: <FiAlertCircle />, desc: "Immediate access to priority contacts and swift web-lock features." }
  ];

  const steps = [
    { title: "Parent Setup", desc: "Sign up and configure settings for your child's profile." },
    { title: "Install Extension", desc: "Add the SafeWeb Jr Chrome extension to your child's browser." },
    { title: "Monitor & Protect", desc: "Parents can switch to Kid View to see what their child sees" }
  ];

  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo">
          <FiShield className="logo-icon" />
          <span>SafeWeb Jr</span>
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline" style={{padding: '0.4rem 1rem', fontSize: '0.9rem'}} onClick={() => setIsModalOpen(true)}>📦 Get Extension</button>
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            Keep Your Kids Safe Online
          </motion.h1>
          <p>
            SafeWeb Jr monitors, protects and guides your child's internet experience — while keeping them informed and motivated.
          </p>
          <div className="hero-actions" style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
            <Link to="/signup" className="btn btn-primary btn-large">Get Started Free</Link>
            <button className="btn btn-outline btn-large" onClick={() => setIsModalOpen(true)}>Get Extension</button>
          </div>
        </div>
      </header>

      <section className="features-section">
        <h2>Powerful Features for Peace of Mind</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          {steps.map((step, idx) => (
            <div className="step-card" key={idx}>
              <div className="step-number">{idx + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="logo footer-logo">
            <FiShield className="logo-icon" />
            <span>SafeWeb Jr</span>
          </div>
          <p>&copy; 2025 SafeWeb Jr. All rights reserved.</p>
        </div>
      </footer>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{opacity: 0}} 
            animate={{opacity: 1}} 
            exit={{opacity: 0}} 
            className="modal-backdrop"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
               initial={{scale: 0.95, y: 20}} 
               animate={{scale: 1, y: 0}} 
               exit={{scale: 0.95, y: 20}} 
               className="modal-content"
               onClick={e => e.stopPropagation()}
            >
               <h2>Install SafeWeb Jr Extension</h2>
               <p className="modal-subtitle">Follow these simple steps</p>
               
               <div className="steps-list">
                 <div className="step-item"><span className="step-badge">1</span> Click the download button below to get the extension files</div>
                 <div className="step-item"><span className="step-badge">2</span> Unzip the downloaded folder</div>
                 <div className="step-item"><span className="step-badge">3</span> Open Chrome and go to <strong>chrome://extensions</strong></div>
                 <div className="step-item"><span className="step-badge">4</span> Enable Developer Mode (toggle in top right)</div>
                 <div className="step-item"><span className="step-badge">5</span> Click Load Unpacked and select the unzipped folder</div>
                 <div className="step-item"><span className="step-badge">6</span> SafeWeb Jr is now protecting your child! 🛡️</div>
               </div>

               <div className="modal-actions">
                 <a href="/extension.zip" download className="btn btn-primary btn-large" style={{width: '100%', marginBottom: '0.5rem'}}>Download Extension</a>
                 <button className="btn btn-outline" style={{width: '100%'}} onClick={() => setIsModalOpen(false)}>Close</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
