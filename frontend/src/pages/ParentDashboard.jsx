import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import './ParentDashboard.css';

const AVATARS = ["🦁", "🐼", "🦊", "🐸", "🐯", "🐨"];

export default function ParentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Modal state
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildAvatar, setNewChildAvatar] = useState(AVATARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChildren();
  }, [currentUser]);

  async function fetchChildren() {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, `users/${currentUser.uid}/children`), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const childrenData = [];
      querySnapshot.forEach((doc) => {
        childrenData.push({ id: doc.id, ...doc.data() });
      });
      setChildren(childrenData);
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Failed to log out");
    }
  }

  function openModal() {
    setError('');
    setNewChildName('');
    setNewChildAge('');
    setNewChildAvatar(AVATARS[0]);
    setShowModal(true);
  }

  async function handleAddChild(e) {
    e.preventDefault();
    if (!newChildName.trim()) return setError('Name is required');
    const ageNum = parseInt(newChildAge);
    if (!ageNum || ageNum < 3 || ageNum > 17) {
      return setError('Age must be between 3 and 17');
    }

    try {
      setError('');
      setSubmitting(true);
      
      const newChildData = {
        name: newChildName.trim(),
        age: ageNum,
        avatar: newChildAvatar,
        points: 0,
        bedtimeHour: 21,
        screenTimeLimitMinutes: 120,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, `users/${currentUser.uid}/children`), newChildData);
      await fetchChildren();
      setShowModal(false);
    } catch (err) {
      console.error("Error adding child:", err);
      setError('Failed to add child profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <FiShield className="logo-icon" />
          <span>SafeWeb Jr</span>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginLeft: '1rem', fontWeight: 500 }}>Parent Dashboard</span>
        </Link>
        <div className="nav-user">
          <span className="nav-username">{currentUser?.name || 'Parent'}</span>
          <button onClick={handleLogout} className="btn btn-outline">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Welcome, {currentUser?.name || 'Parent'}! 👋</h1>
          <button onClick={openModal} className="btn btn-primary">+ Add Child</button>
        </div>

        <section className="dashboard-content">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-color)' }}>Your Children</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading children...</div>
          ) : children.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="empty-emoji">👶</div>
              <p>No children added yet</p>
              <button onClick={openModal} className="btn btn-primary">Add Your First Child</button>
            </motion.div>
          ) : (
            <div className="children-grid">
              {children.map(child => (
                <motion.div 
                  key={child.id} 
                  className="child-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="child-card-header">
                    <div className="child-avatar">{child.avatar}</div>
                    <div className="child-info">
                      <h3>{child.name}</h3>
                      <p>Age {child.age}</p>
                    </div>
                  </div>
                  <div className="child-stats">
                    <div className="stat-row">⭐ {child.points} pts</div>
                    <div className="stat-row">⏱ {child.screenTimeLimitMinutes} mins/day</div>
                    <div className="stat-row">🌙 {child.bedtimeHour}:00</div>
                  </div>
                  <button className="btn btn-outline manage-btn">Manage</button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <h2>Add Child Profile</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleAddChild}>
                <div className="auth-form" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newChildName}
                      onChange={e => setNewChildName(e.target.value)}
                      placeholder="e.g. Alex"
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input 
                      type="number" 
                      required 
                      min="3" max="17"
                      value={newChildAge}
                      onChange={e => setNewChildAge(e.target.value)}
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Choose an Avatar</label>
                  <div className="avatar-grid">
                    {AVATARS.map(emoji => (
                      <div 
                        key={emoji}
                        className={`avatar-option ${newChildAvatar === emoji ? 'selected' : ''}`}
                        onClick={() => setNewChildAvatar(emoji)}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Child'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
