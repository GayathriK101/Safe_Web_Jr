import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiClock, FiMoon, FiStar, FiBarChart2, FiAlertCircle } from 'react-icons/fi';
import './Landing.css';

export default function Landing() {
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
    { title: "Monitor & Protect", desc: "Both parent and child get their own dashboard to stay informed." }
  ];

  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo">
          <FiShield className="logo-icon" />
          <span>SafeWeb Jr</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1>Keep Your Kids Safe Online</h1>
          <p>
            SafeWeb Jr monitors, protects and guides your child's internet experience — while keeping them informed and motivated.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-large">Get Started Free</Link>
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
    </div>
  );
}
