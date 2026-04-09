import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiActivity, FiAlertTriangle, 
  FiClock, FiMoon, FiGlobe, FiMail, FiShield, 
  FiLogOut, FiMenu, FiX, FiSearch, FiPlus, FiTrash2,
  FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  updateDoc, doc, deleteDoc, setDoc, limit, getDocs, where
} from 'firebase/firestore';
import './ParentDashboard.css';

const AVATARS = ["🦁", "🐼", "🦊", "🐸", "🐯", "🐨"];

const TABS = [
  { id: 'overview', label: 'Overview', icon: FiHome },
  { id: 'children', label: 'Children', icon: FiUsers },
  { id: 'activity', label: 'Activity History', icon: FiActivity },
  { id: 'alerts', label: 'Alerts', icon: FiAlertTriangle },
  { id: 'screentime', label: 'Screen Time', icon: FiClock },
  { id: 'bedtime', label: 'Bedtime Mode', icon: FiMoon },
  { id: 'recommended', label: 'Recommended Sites', icon: FiGlobe },
  { id: 'reports', label: 'Reports', icon: FiMail },
];

function getTimeAgo(timestamp) {
  if (!timestamp) return "Just now";
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return "Just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return seconds + " seconds ago";
  if (seconds < 3600) return Math.floor(seconds/60) + " mins ago";
  if (seconds < 86400) return Math.floor(seconds/3600) + " hours ago";
  return Math.floor(seconds/86400) + " days ago";
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getActivityColor(type) {
  switch(type) {
    case 'SITE_VISIT': return 'badge-green';
    case 'CONTENT_FLAGGED': return 'badge-orange';
    case 'SITE_BLOCKED': return 'badge-red';
    case 'SEARCH_BLOCKED': return 'badge-red';
    case 'TAMPER': return 'badge-orange';
    case 'PANIC': return 'badge-purple';
    default: return 'badge-gray';
  }
}

export default function ParentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };
  
  // Data States
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [recommendedSites, setRecommendedSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [screenTimeUsed, setScreenTimeUsed] = useState(0);

  // Report States
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStats, setReportStats] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  // Form States
  const [showChildModal, setShowChildModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);
  const [dismissTamper, setDismissTamper] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('');
  const [newChildAvatar, setNewChildAvatar] = useState(AVATARS[0]);
  
  const [newRecSiteName, setNewRecSiteName] = useState('');
  const [newRecSiteUrl, setNewRecSiteUrl] = useState('');
  const [newRecSiteCategory, setNewRecSiteCategory] = useState('Education');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    let unsubChildren = () => {};
    let unsubActivity = () => {};
    let unsubRec = () => {};
    let unsubScreenTime = () => {};

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      try {
        const qChildren = query(collection(db, `users/${currentUser.uid}/children`), orderBy('createdAt', 'desc'));
        unsubChildren = onSnapshot(qChildren, 
          (snap) => {
            setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          },
          (err) => {
            console.error("Firestore Error (fetching children):", err.message || err, err);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("Try/Catch Error (children query):", e.message || e);
      }

      try {
        const qActivity = query(collection(db, 'activity'), orderBy("timestamp", "desc"), limit(50));
        unsubActivity = onSnapshot(qActivity, 
          (snap) => {
            setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
          },
          (err) => {
            console.error("Firestore Error (fetching activity):", err.message || err, err);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("Try/Catch Error (activity query):", e.message || e);
      }

      try {
        const qRec = query(collection(db, `users/${currentUser.uid}/recommendedSites`));
        unsubRec = onSnapshot(qRec, 
          (snap) => {
            setRecommendedSites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          },
          (err) => {
            console.error("Firestore Error (fetching recommended sites):", err.message || err, err);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("Try/Catch Error (recommended sites query):", e.message || e);
      }

      try {
        const qScreenTime = query(
          collection(db, 'activity'),
          where('parentId', '==', currentUser.uid),
          where('type', '==', 'SCREEN_TIME_UPDATE'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        unsubScreenTime = onSnapshot(qScreenTime, (snapshot) => {
          if (!snapshot.empty) {
            const latest = snapshot.docs[0].data();
            const mins = latest.totalMinutes || 
                         parseInt(latest.fields?.totalMinutes?.integerValue) || 
                         0;
            setScreenTimeUsed(mins);
          } else {
            setScreenTimeUsed(0);
          }
        });
      } catch (e) {
        console.error("Try/Catch Error (screen time query):", e.message || e);
      }
    } catch (err) {
      console.error("Firestore Setup Error:", err.message || err, err);
      setLoading(false);
    }

    return () => { 
      clearTimeout(fallbackTimer);
      unsubChildren(); 
      unsubActivity(); 
      unsubRec(); 
      unsubScreenTime();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Failed to log out");
    }
  };

  const [activityStats, setActivityStats] = useState({ visited: 0, flags: 0, blocked: 0 });

  useEffect(() => {
    if (!currentUser) return;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayIso = today.toISOString();
    
    try {
      const qStats = query(
        collection(db, 'activity'),
        where('parentId', '==', currentUser.uid),
        where('timestamp', '>=', todayIso)
      );
      
      const unsubStats = onSnapshot(qStats, (snap) => {
        let visited = 0;
        let flags = 0;
        let blocked = 0;
        
        snap.docs.forEach(d => {
          const type = d.data().type;
          if (type === 'SITE_VISIT') visited++;
          if (type === 'CONTENT_FLAGGED') flags++;
          if (type === 'SITE_BLOCKED' || type === 'SEARCH_BLOCKED') blocked++;
        });
        
        setActivityStats({ visited, flags, blocked });
      });
      
      return () => unsubStats();
    } catch (err) {
      console.error("Stats query error:", err);
    }
  }, [currentUser]);

  const totalPoints = useMemo(() => {
    return children.reduce((sum, c) => sum + (c.points || 0), 0);
  }, [children]);

  // Handle Add Child
  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildAge) return;
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/children`), {
        name: newChildName.trim(),
        age: parseInt(newChildAge),
        avatar: newChildAvatar,
        points: 0,
        bedtimeHour: 21,
        screenTimeLimitMinutes: 120,
        screenTimeUsedMinutes: 0, // Mock usage
        createdAt: new Date().toISOString()
      });
      setShowChildModal(false);
      setNewChildName('');
      setNewChildAge('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Child
  const handleDeleteChild = async () => {
    if (!childToDelete) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/children`, childToDelete.id));
      showToast("Child removed successfully");
      setChildToDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Error removing child");
    }
  };

  // Handle Recommended Site Add
  const handleAddRecSite = async (e) => {
    e.preventDefault();
    if (!newRecSiteName.trim() || !newRecSiteUrl.trim()) return;
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/recommendedSites`), {
        name: newRecSiteName.trim(),
        url: newRecSiteUrl.trim(),
        category: newRecSiteCategory,
        createdAt: new Date().toISOString()
      });
      
      const newSites = [...recommendedSites, { url: newRecSiteUrl.trim(), name: newRecSiteName.trim() }];
      await setDoc(doc(db, 'settings', currentUser.uid), {
        recommendedSites: newSites.map(s => s.url)
      }, { merge: true });
      try { await deleteDoc(doc(db, 'settings', 'placeholder')); } catch(e) {}
      showToast("Recommended site added! 🌐");
      
      setNewRecSiteName('');
      setNewRecSiteUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Recommended Site Delete
  const handleDeleteRecSite = async (id) => {
    try {
      const siteToDelete = recommendedSites.find(s => s.id === id);
      await deleteDoc(doc(db, `users/${currentUser.uid}/recommendedSites`, id));
      
      if (siteToDelete) {
        const newSites = recommendedSites.filter(s => s.id !== id);
        await setDoc(doc(db, 'settings', currentUser.uid), {
          recommendedSites: newSites.map(s => s.url)
        }, { merge: true });
        try { await deleteDoc(doc(db, 'settings', 'placeholder')); } catch(e) {}
        showToast("Recommended site removed! 🗑️");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Updates
  const updateChildField = async (childId, field, value) => {
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/children`, childId), {
        [field]: value
      });
      
      if (field === 'screenTimeLimitMinutes') {
        await setDoc(doc(db, 'settings', currentUser.uid), {
          screenTimeLimit: value
        }, { merge: true });
        try { await deleteDoc(doc(db, 'settings', 'placeholder')); } catch(e) {}
        showToast("Screen time limit updated! ⏱️");
      }
      if (field === 'bedtimeHour') {
        await setDoc(doc(db, 'settings', currentUser.uid), {
          bedtimeHour: value,
          bedtimeEnabled: true
        }, { merge: true });
        try { await deleteDoc(doc(db, 'settings', 'placeholder')); } catch(e) {}
        showToast("Bedtime updated! 🌙");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Functions for Tabs
  const renderOverview = () => {
    const recentTamper = activities.find(a => 
      a.type === 'TAMPER' && 
      (Date.now() - new Date(a.timestamp).getTime()) < 24 * 60 * 60 * 1000
    );

    const extensionCode = currentUser ? currentUser.uid : '';

    return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
      <div style={{ background: '#EEF2FF', border: '2px dashed #818CF8', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{ color: '#312E81', marginBottom: '8px', fontSize: '20px' }}>🔌 Link Your Extension</h3>
        <p style={{ color: '#4F46E5', marginBottom: '16px' }}>Enter this code in the SafeWeb Jr Chrome extension to link it to your account</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px 24px', borderRadius: '8px', border: '1px solid #C7D2FE', wordBreak: 'break-all', maxWidth: '100%' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', color: '#1E1B4B' }}>{extensionCode}</span>
          <button 
            onClick={() => { navigator.clipboard.writeText(extensionCode); showToast("Code copied!"); }} 
            style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Copy Full Code
          </button>
        </div>
      </div>

      {recentTamper && !dismissTamper && (
        <div style={{ background: '#FFFBEB', borderLeft: '4px solid #F59E0B', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <span style={{ fontWeight: 'bold', color: '#B45309' }}>⚠️ Warning:</span> SafeWeb Jr was disabled at {formatTime(recentTamper.timestamp)}. Please check your child's device.
           </div>
           <button onClick={() => setDismissTamper(true)} style={{ background: 'transparent', border: 'none', color: '#92400E', cursor: 'pointer', fontWeight: 'bold' }}>Dismiss</button>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon emerald"><FiGlobe /></div>
          <div className="stat-info">
            <p className="stat-label">Sites Visited Today</p>
            <h3 className="stat-value">{activityStats.visited}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiAlertTriangle /></div>
          <div className="stat-info">
            <p className="stat-label">Flags Raised Today</p>
            <h3 className="stat-value">{activityStats.flags}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiShield /></div>
          <div className="stat-info">
            <p className="stat-label">Sites Blocked Today</p>
            <h3 className="stat-value">{activityStats.blocked}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon indigo"><FiCheckCircle /></div>
          <div className="stat-info">
            <p className="stat-label">Total Points</p>
            <h3 className="stat-value">{totalPoints}</h3>
          </div>
        </div>
      </div>

      <div className="overview-split">
        <div className="overview-feed card">
          <h3 className="card-title">Recent Activity</h3>
          {activities.length === 0 ? (
            <div className="empty-state-small">
              <span className="emoji">📝</span>
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="feed-list">
              {activities.slice(0, 10).map((act, i) => (
                <div key={i} className="feed-item">
                  <div className={`feed-dot ${getActivityColor(act.type)}`}></div>
                  <div className="feed-content">
                    <p className="feed-title">{act.domain || act.query || act.type}</p>
                    <span className="feed-type {getActivityColor(act.type)}">{act.type.replace('_', ' ')}</span>
                  </div>
                  <div className="feed-time">{getTimeAgo(act.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-children card">
          <h3 className="card-title">Children Overview</h3>
          {children.length === 0 ? (
            <div className="empty-state-small">
               <span className="emoji">👶</span>
               <p>No children added yet</p>
            </div>
          ) : (
            <div className="children-list">
              {children.map(c => (
                <div key={c.id} className="child-list-item">
                  <span className="child-avatar-sm">{c.avatar}</span>
                  <div className="child-info-sm">
                    <h4>{c.name}</h4>
                    <p>⭐ {c.points || 0} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
    );
  };

  const renderChildren = () => (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
      <div className="header-actions">
        <h2>Manage Children</h2>
        <button className="btn-primary" onClick={() => setShowChildModal(true)}>
          <FiPlus /> Add Child
        </button>
      </div>
      
      {children.length === 0 ? (
        <div className="empty-state-large">
          <span className="emoji">🤸‍♀️</span>
          <h3>No children added yet</h3>
          <p>Add your child's profile to start monitoring and guiding their web usage.</p>
          <button className="btn-primary" onClick={() => setShowChildModal(true)}>Add Your First Child</button>
        </div>
      ) : (
        <div className="children-grid">
          {children.map(c => (
            <div key={c.id} className="child-card card" style={{ position: 'relative' }}>
               <button 
                 onClick={() => setChildToDelete(c)}
                 className="btn-icon text-red" 
                 style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                 title="Delete Child"
               >
                 <FiTrash2 />
               </button>
               <div className="child-avatar-lg">{c.avatar}</div>
               <h3>{c.name}</h3>
               <p className="child-age">Age {c.age}</p>
               <div className="child-stats">
                  <div><span>Points</span><strong>{c.points}</strong></div>
                  <div><span>Screen Time</span><strong>{c.screenTimeLimitMinutes}m</strong></div>
                  <div><span>Bedtime</span><strong>{c.bedtimeHour}:00</strong></div>
               </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const [actPage, setActPage] = useState(1);
  const [actFilter, setActFilter] = useState('ALL');
  
  const renderActivity = () => {
    const filtered = activities.filter(a => actFilter === 'ALL' || a.type === actFilter);
    const paginated = filtered.slice((actPage-1)*20, actPage*20);
    const totalPages = Math.ceil(filtered.length / 20) || 1;

    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
        <div className="card">
          <div className="table-header">
            <h3>All Activity</h3>
            <select value={actFilter} onChange={e => {setActFilter(e.target.value); setActPage(1);}} className="input-select">
              <option value="ALL">All Types</option>
              <option value="SITE_VISIT">Visits</option>
              <option value="CONTENT_FLAGGED">Flags</option>
              <option value="SITE_BLOCKED">Blocks</option>
              <option value="SEARCH_BLOCKED">Search Blocks</option>
              <option value="PANIC">Panic</option>
            </select>
          </div>
          
          {filtered.length === 0 ? (
            <div className="empty-state-large">
              <span className="emoji">📭</span>
              <h3>No activity found</h3>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Detail (URL/Query)</th>
                      <th>Time</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((a, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge ${getActivityColor(a.type)}`}>
                            {a.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="truncate-cell" title={a.domain || a.query || a.url}>
                          {a.domain || a.query || a.url || '-'}
                        </td>
                        <td>{formatTime(a.timestamp)}</td>
                        <td>{formatDate(a.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={actPage === 1} onClick={() => setActPage(p=>p-1)} className="btn-outline btn-sm">Prev</button>
                <span>Page {actPage} of {totalPages}</span>
                <button disabled={actPage === totalPages} onClick={() => setActPage(p=>p+1)} className="btn-outline btn-sm">Next</button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const renderAlerts = () => {
    const alerts = activities.filter(a => ['SITE_BLOCKED', 'SEARCH_BLOCKED', 'CONTENT_FLAGGED', 'PANIC', 'TAMPER'].includes(a.type));
    
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
        <h2 className="mb-4">🚨 Recent Alerts</h2>
        {alerts.length === 0 ? (
          <div className="empty-state-large card">
            <span className="emoji">✅</span>
            <h3>All clear!</h3>
            <p>No alerts or blocked events recently.</p>
          </div>
        ) : (
          <div className="alerts-grid">
            {alerts.slice(0, 20).map((a, i) => (
              <div key={i} className={`alert-card card ${a.type === 'PANIC' ? 'border-red alert-urgent' : ''}`} style={a.type === 'PANIC' ? { borderColor: '#EF4444', borderWidth: '2px' } : a.type === 'TAMPER' ? { borderColor: '#F59E0B', borderWidth: '2px' } : {}}>
                <div className="alert-header">
                  {a.type === 'TAMPER' ? (
                    <span className="badge badge-orange">⚠️ TAMPER ALERT</span>
                  ) : (
                    <span className={`badge ${getActivityColor(a.type)}`}>{a.type.replace('_', ' ')}</span>
                  )}
                  <span className="alert-time">{getTimeAgo(a.timestamp)}</span>
                </div>
                {a.type === 'PANIC' && <span className="urgent-badge" style={{color: '#EF4444', fontWeight: 'bold'}}>🚨 URGENT</span>}
                <p className="alert-detail">{a.type === 'PANIC' ? 'Child pressed panic button from dashboard' : a.type === 'TAMPER' ? "SafeWeb Jr extension was disabled on child's browser!" : (a.domain || a.query || a.url || 'Unknown Action')}</p>
                <div className="alert-footer">
                  <span>{formatDate(a.timestamp)} at {formatTime(a.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderScreenTime = () => {
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
        <h2 className="mb-4">⏱ Screen Time Limits</h2>
        {children.length === 0 ? (
          <div className="empty-state-large card"><span className="emoji">👶</span><p>Add children to manage screen time.</p></div>
        ) : (
          <div className="screen-time-list">
            {children.map(c => {
              const screenTimeLimit = c.screenTimeLimitMinutes || 120;
              const percent = Math.min((screenTimeUsed / screenTimeLimit) * 100, 100);
              const isDanger = percent >= 80;
              const isWarning = percent >= 60 && percent < 80;
              const barColor = isDanger ? 'bg-red' : (isWarning ? 'bg-yellow' : 'bg-emerald');

              return (
                <div key={c.id} className="card st-card">
                  <div className="st-header">
                    <div className="flex-center gap-3">
                      <span className="child-avatar-sm">{c.avatar}</span>
                      <h3>{c.name}</h3>
                    </div>
                    <div className="st-edit">
                      <label>Daily Limit (mins): </label>
                      <input 
                        type="number" 
                        className="st-input" 
                        value={screenTimeLimit} 
                        onChange={e => updateChildField(c.id, 'screenTimeLimitMinutes', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="st-progress-container">
                    <div className="st-progress-bar">
                      <div 
                        className={`st-progress-fill ${barColor}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="st-progress-labels">
                      <span>{screenTimeUsed} mins used {percent >= 100 && <span className="badge badge-red ml-2">LIMIT REACHED</span>}</span>
                      <span>{screenTimeLimit} mins limit</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  const renderBedtime = () => (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
      <h2 className="mb-4">🌙 Bedtime Mode</h2>
      {children.length === 0 ? (
         <div className="empty-state-large card"><span className="emoji">😴</span><p>Add children to set bedtimes.</p></div>
      ) : (
        <div className="bedtime-grid">
          {children.map(c => (
            <div key={c.id} className="card bt-card">
              <span className="child-avatar-lg">{c.avatar}</span>
              <h3>{c.name}</h3>
              <p className="text-muted">Internet will be blocked after this hour.</p>
              <div className="form-group mt-3">
                <label>Bedtime Hour (24h)</label>
                <select 
                  className="input-select w-full" 
                  value={c.bedtimeHour || 21}
                  onChange={(e) => updateChildField(c.id, 'bedtimeHour', parseInt(e.target.value))}
                >
                  {Array.from({length: 24}).map((_, i) => (
                    <option key={i} value={i}>{i}:00 {i < 12 ? 'AM' : 'PM'}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderRecommendedSites = () => (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane flex-row gap-6">
      <div className="card w-full max-w-md">
        <h3 className="card-title">Add Recommended Site</h3>
        <form onSubmit={handleAddRecSite} className="form-vertical">
          <div className="form-group">
            <label>Site Name</label>
            <input required type="text" className="input-field" placeholder="e.g. Khan Academy" value={newRecSiteName} onChange={e=>setNewRecSiteName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>URL</label>
            <input required type="url" className="input-field" placeholder="https://..." value={newRecSiteUrl} onChange={e=>setNewRecSiteUrl(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="input-select" value={newRecSiteCategory} onChange={e=>setNewRecSiteCategory(e.target.value)}>
              <option>Education</option>
              <option>Entertainment</option>
              <option>Games</option>
              <option>Art & Creativity</option>
              <option>Other</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full"><FiPlus /> Add Site</button>
        </form>
      </div>

      <div className="card w-full flex-grow">
        <h3 className="card-title">Current Recommended Sites</h3>
        {recommendedSites.length === 0 ? (
          <div className="empty-state-small mt-4">
            <span className="emoji">🌐</span>
            <p>No recommended sites yet</p>
          </div>
        ) : (
          <div className="rec-list">
            {recommendedSites.map(site => (
              <div key={site.id} className="rec-item">
                <div className="rec-info">
                  <h4>{site.name}</h4>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a>
                  <span className="badge badge-indigo mt-1 inline-block">{site.category}</span>
                </div>
                <button title="Delete" className="btn-icon text-red" onClick={() => handleDeleteRecSite(site.id)}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const backendUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : 'https://safeweb-jr-backend.onrender.com';
      
      // Get last 7 days activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activityQuery = query(
        collection(db, 'activity'),
        where('parentId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      
      const snapshot = await getDocs(activityQuery);
      const activityData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      const childName = children.length > 0 
        ? children[0].name 
        : 'Your Child';
      
      const response = await fetch(
        `${backendUrl}/api/reports/generate-summary`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            activityData,
            childName,
            weekStart: sevenDaysAgo.toISOString()
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      setSummary(result.summary);
      setReportStats(result.stats);
      setLastGenerated(new Date());
      
    } catch(error) {
      console.error('Summary error:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderReports = () => (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="tab-pane">
      <div className="card report-card py-8 px-8">
        <div className="flex justify-between items-center mb-6" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2 className="text-2xl font-bold" style={{color: '#4F46E5', fontSize: '24px', margin: 0, fontWeight: 'bold'}}>📊 AI Weekly Summary</h2>
            <p className="text-muted" style={{margin: '4px 0 0 0'}}>Powered by Claude AI</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={generateSummary} 
            disabled={isGenerating}
            style={{background: '#4F46E5', opacity: isGenerating ? 0.7 : 1}}
          >
            {isGenerating ? '🤖 Generating...' : 'Generate Summary'}
          </button>
        </div>

        {summary ? (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="summary-result-card" style={{background: '#EEF2FF', padding: '24px', borderRadius: '16px'}}>
            <div className="summary-stats flex justify-between mb-4 pb-4 border-b border-indigo-200" style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #C7D2FE', paddingBottom: '16px', marginBottom: '16px'}}>
               <div>
                 <strong className="text-indigo-900" style={{color: '#312E81'}}>{reportStats?.siteVisits || 0}</strong> sites visited <span className="mx-2 text-indigo-300" style={{color: '#A5B4FC', margin: '0 8px'}}>|</span> 
                 <strong className="text-indigo-900" style={{color: '#312E81'}}>{reportStats?.flagged || 0}</strong> flagged <span className="mx-2 text-indigo-300" style={{color: '#A5B4FC', margin: '0 8px'}}>|</span> 
                 <strong className="text-indigo-900" style={{color: '#312E81'}}>{reportStats?.blocked || 0}</strong> blocked
                 <span className="mx-2 text-indigo-300" style={{color: '#A5B4FC', margin: '0 8px'}}>|</span>
                 <strong className="text-indigo-900" style={{color: '#312E81'}}>{reportStats?.panics || 0}</strong> panics
               </div>
               <span className="text-sm text-indigo-400" style={{color: '#818CF8', fontSize: '14px'}}>Generated {lastGenerated ? getTimeAgo(lastGenerated) : 'just now'}</span>
            </div>
            
            <div className="summary-text text-indigo-900" style={{lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#312E81', fontSize: '16px'}}>
              {summary}
            </div>

            <div className="flex gap-4 mt-6" style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
              <button className="btn-outline flex-1" style={{flex: 1, color: '#4F46E5', borderColor: '#4F46E5', background: 'transparent'}} onClick={generateSummary} disabled={isGenerating}>🔄 Regenerate</button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200" style={{textAlign: 'center', padding: '48px 0', background: '#F9FAFB', borderRadius: '12px', border: '2px dashed #E5E7EB'}}>
             <FiMail style={{fontSize: '48px', color: '#9CA3AF', margin: '0 auto 16px'}}/>
             <p className="text-gray-500 font-medium" style={{color: '#6B7280', fontWeight: 'bold'}}>Click generate to let AI analyze this week's web activity.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const getActiveView = () => {
    switch(activeTab) {
      case 'overview': return renderOverview();
      case 'children': return renderChildren();
      case 'activity': return renderActivity();
      case 'alerts': return renderAlerts();
      case 'screentime': return renderScreenTime();
      case 'bedtime': return renderBedtime();
      case 'recommended': return renderRecommendedSites();
      case 'reports': return renderReports();
      default: return renderOverview();
    }
  };

  if (loading) return (
    <div className="p-dashboard">
       <aside className="p-sidebar">
         <div className="p-sidebar-header"><FiShield className="brand-icon" /><span className="brand-text">SafeWeb Jr</span></div>
         <nav className="p-sidebar-nav"><p className="nav-label">MENU</p></nav>
       </aside>
       <div className="p-main" style={{padding: '32px'}}>
         <div className="skeleton-box" style={{height: 60, marginBottom: 24, borderRadius: 8}}></div>
         <div style={{display: 'flex', gap: 24}}>
           <div className="skeleton-box" style={{height: 120, flex: 1, borderRadius: 12}}></div>
           <div className="skeleton-box" style={{height: 120, flex: 1, borderRadius: 12}}></div>
           <div className="skeleton-box" style={{height: 120, flex: 1, borderRadius: 12}}></div>
         </div>
       </div>
    </div>
  );

  if (error) return (
    <div className="p-dashboard">
       <div className="p-main" style={{padding: '32px', textAlign: 'center'}}>
         <h2 style={{color: '#EF4444'}}>Error Loading Dashboard</h2>
         <p>{error}</p>
         <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Retry</button>
       </div>
    </div>
  );

  return (
    <div className="p-dashboard">
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0, y:-50}} animate={{opacity:1, y:20}} exit={{opacity:0, y:-50}} className="toast-notification">
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`p-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="p-sidebar-header">
          <FiShield className="brand-icon" />
          <span className="brand-text">SafeWeb Jr</span>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}><FiX /></button>
        </div>
        
        <nav className="p-sidebar-nav">
          <p className="nav-label">MENU</p>
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
            >
              <tab.icon className="nav-item-icon" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="p-main">
        {/* Top Navbar */}
        <header className="p-top-nav">
          <div className="nav-left">
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <FiMenu />
            </button>
            <h1 className="current-tab-title">{TABS.find(t => t.id === activeTab)?.label}</h1>
          </div>
          <div className="nav-right" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <span className="parent-greeting">Hi, {currentUser?.displayName || 'Parent'} 👋</span>
            <button className="btn-outline" style={{padding: '8px 16px', borderRadius: '8px', color: '#4F46E5', border: '2px solid #4F46E5', background: 'transparent', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => navigate('/kid/dashboard')}>
              👦 Kid View
            </button>
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-content-area">
          <AnimatePresence mode="wait">
            {getActiveView()}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal for Add Child */}
      <AnimatePresence>
        {showChildModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowChildModal(false)}>
            <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} className="modal-box">
              <h2>Add Child Profile</h2>
              <p className="text-muted mb-4">Create a profile to set distinct rules and monitoring.</p>
              
              <form onSubmit={handleAddChild}>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" required value={newChildName} onChange={e=>setNewChildName(e.target.value)} className="input-field" placeholder="e.g. Maya"/>
                </div>
                <div className="form-group mb-4">
                  <label>Age</label>
                  <input type="number" required min="3" max="17" value={newChildAge} onChange={e=>setNewChildAge(e.target.value)} className="input-field" placeholder="e.g. 8"/>
                </div>
                <div className="form-group mb-6">
                  <label>Choose Avatar</label>
                  <div className="avatar-picker">
                    {AVATARS.map(avatar => (
                      <button key={avatar} type="button" onClick={() => setNewChildAvatar(avatar)} className={`avatar-btn ${newChildAvatar === avatar ? 'selected' : ''}`}>
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" className="btn-outline" onClick={() => setShowChildModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Profile</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Delete Child */}
      <AnimatePresence>
        {childToDelete && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setChildToDelete(null)}>
            <motion.div initial={{scale:0.95, y:20}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} className="modal-box" style={{textAlign: 'center'}}>
              <h2 style={{color: '#EF4444', marginBottom: '16px'}}>Delete {childToDelete.name}?</h2>
              <p className="text-muted mb-6">Are you sure you want to delete {childToDelete.name}? This cannot be undone.</p>
              <div className="flex justify-center gap-3" style={{display: 'flex', justifyContent: 'center', gap: '12px'}}>
                <button type="button" className="btn-outline" onClick={() => setChildToDelete(null)}>Cancel</button>
                <button type="button" className="btn-primary" style={{backgroundColor: '#EF4444', borderColor: '#EF4444'}} onClick={handleDeleteChild}><FiTrash2 style={{marginRight: '8px', display: 'inline-block'}}/> Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
