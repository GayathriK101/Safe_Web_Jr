import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, getDocs, getDoc, limit,
  updateDoc, doc, addDoc, setDoc, serverTimestamp, increment, where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut } from 'react-icons/fi';
import './KidDashboard.css';

export default function KidDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [child, setChild] = useState(null);
  const childId = child?.id;
  const [activities, setActivities] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [recommendedSites, setRecommendedSites] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [points, setPoints] = useState(0);
  const [screenTimeUsed, setScreenTimeUsed] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Setup listeners
  useEffect(() => {
    if (!currentUser) return;
    
    // Load first child
    const qChildren = query(collection(db, `users/${currentUser.uid}/children`));
    const unsubChild = onSnapshot(qChildren, (snap) => {
      if (!snap.empty) {
        setChild({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setLoading(false);
    });

    // Load rewards
    const qRewards = query(collection(db, `users/${currentUser.uid}/rewards`));
    const unsubRewards = onSnapshot(qRewards, (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load recommended sites from settings
    const unsubRec = onSnapshot(doc(db, 'settings', currentUser.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setRecommendedSites(data.recommendedSites || []);
      }
    });

    // Load Activity for Points (Current Day)
    const today = new Date();
    today.setHours(0,0,0,0);
    const qActivity = query(collection(db, 'activity'), where('parentId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
    const unsubActivity = onSnapshot(qActivity, (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubChild(); unsubRewards(); unsubRec(); unsubActivity(); };
  }, [currentUser]);

  const isFirstActivityLoad = useRef(true);

  useEffect(() => {
    if (!currentUser || !childId) return;
    
    const childRef = doc(
      db, 'users', currentUser.uid,
      'children', childId
    );
    
    let isFirstChildLoad = true;
    
    const unsubChild = onSnapshot(childRef,
      async (snap) => {
        if (snap.exists()) {
          const currentPoints = snap.data().points || 0;
          if (isFirstChildLoad && currentPoints > 500) {
            await updateDoc(childRef, { points: 50 });
          } else {
            setPoints(Math.max(0, currentPoints));
          }
        }
        isFirstChildLoad = false;
      }
    );
    
    const q = query(
      collection(db, 'activity'),
      where('parentId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const unsubActivity = onSnapshot(q,
      async (snapshot) => {
        if (isFirstActivityLoad.current) {
          isFirstActivityLoad.current = false;
          return;
        }
        if (snapshot.empty) return;
        
        const latest = snapshot.docs[0].data();
        let pointChange = 0;
        
        if (latest.type === 'SITE_BLOCKED' ||
            latest.type === 'SEARCH_BLOCKED') {
          pointChange = -20;
        } else if (
            latest.type === 'CONTENT_FLAGGED') {
          pointChange = -10;
        } else if (latest.type === 'SITE_VISIT') {
          pointChange = 2;
        }
        
        if (pointChange === 0) return;
        
        const childSnap = await getDoc(childRef);
        if (!childSnap.exists()) return;
        
        const current = childSnap.data().points || 0;
        const newPoints = Math.max(
          0, current + pointChange
        );
        
        await updateDoc(childRef, {
          points: newPoints
        });
        
        await addDoc(
          collection(
            db, 'users', currentUser.uid,
            'children', childId, 'pointsHistory'
          ),
          {
            change: pointChange,
            type: latest.type,
            timestamp: serverTimestamp(),
            label: pointChange > 0
              ? 'Safe Site Visit'
              : latest.type === 'SEARCH_BLOCKED'
                ? 'Blocked Search'
                : latest.type === 'SITE_BLOCKED'
                  ? 'Blocked Site'
                  : 'Flagged Content'
          }
        );
      }
    );
    
    return () => {
      unsubChild();
      unsubActivity();
    };
  }, [currentUser, childId]);

  // ISSUE 4 - Fix screen time showing 0 in kid dashboard
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'activity'),
      where('parentId', '==', currentUser.uid),
      where('type', '==', 'SCREEN_TIME_UPDATE'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const mins = data.totalMinutes || 0;
        setScreenTimeUsed(mins);
      }
    });
    
    return () => unsub();
  }, [currentUser]);

  // ISSUE 5 - Fix recent points history display
  useEffect(() => {
    if (!currentUser || !childId) return;
    
    const q = query(
      collection(
        db, 'users', currentUser.uid,
        'children', childId, 'pointsHistory'
      ),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setPointsHistory(history);
    });
    
    return () => unsub();
  }, [currentUser, childId]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) { }
  };

  const redeemReward = async (reward) => {
    if (points < reward.cost) return;
    
    if (window.confirm(`Are you sure you want to trade ${reward.cost} points for ${reward.title}?`)) {
      const newPoints = Math.max(0, points - reward.cost);
      await updateDoc(doc(db, `users/${currentUser.uid}/children`, childId), { points: newPoints });
      await addDoc(collection(db, `users/${currentUser.uid}/redemptions`), {
         childId: child.id,
         childName: child.name,
         rewardTitle: reward.title,
         cost: reward.cost,
         status: 'Pending',
         timestamp: new Date().toISOString()
      });
      showToast("🎉 Reward Requested!");
    }
  };



  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };
  const showToast = showToastMsg;

  if (loading || !child) {
    return <div className="kd-loading"><h3>Loading your dashboard... ✨</h3></div>;
  }

  // Calculations
  const usedMins = screenTimeUsed;
  const limitMins = child.screenTimeLimitMinutes || 120;
  const stPercent = Math.min((usedMins / limitMins) * 100, 100);
  
  let stColor = '#10B981'; // green
  if (stPercent > 60) stColor = '#F59E0B'; // yellow
  if (stPercent > 80) stColor = '#EF4444'; // red

  const currentHour = new Date().getHours();
  const bHour = child.bedtimeHour || 21;
  const hoursToBedtime = bHour - currentHour;
  let levelName = "Explorer 🌱"; 
  let nextLevelPoints = 50;

  if (points <= 50) {
     levelName = "Explorer 🌱"; nextLevelPoints = 51;
  } else if (points <= 150) {
     levelName = "Adventurer ⚡"; nextLevelPoints = 151;
  } else if (points <= 300) {
     levelName = "Champion 🏆"; nextLevelPoints = 301;
  } else if (points <= 500) {
     levelName = "Legend 🌟"; nextLevelPoints = 501;
  } else {
     levelName = "Superhero 🦸"; nextLevelPoints = Math.max(points, 501);
  }

  const levelProgress = Math.max(0, Math.min(100, (points / nextLevelPoints) * 100));

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayActs = activities.filter(a => new Date(a.timestamp) >= todayStart);
  
  const visitsToday = todayActs.filter(a => a.type === 'SITE_VISIT').length;
  const flagsToday = todayActs.filter(a => ['CONTENT_FLAGGED', 'SITE_BLOCKED'].includes(a.type)).length;
  const safeSites = Math.max(0, visitsToday - flagsToday); // simplified

  let meterEmoji = "🌟";
  if (flagsToday > 0) meterEmoji = "😊";
  if (flagsToday > 2) meterEmoji = "🙂";
  if (flagsToday > 5) meterEmoji = "😐";
  if (flagsToday > 10) meterEmoji = "😔";

  const getSiteBorderColor = (idx) => {
    const borders = ['border-blue', 'border-purple', 'border-green', 'border-pink'];
    return borders[idx % borders.length];
  };

  return (
    <div className="kd-page">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0, y:-50}} animate={{opacity:1, y:20}} exit={{opacity:0, y:-50}} className="kd-toast">
             {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="kd-nav">
        <div className="kd-nav-left">
          <div className="kd-avatar-bubble">{child.avatar}</div>
          <span className="kd-greeting">Hi, {child.name}! 👋</span>
          <div className="kd-nav-points">⭐ {points} pts</div>
        </div>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <button className="kd-btn-outline" style={{padding: '8px 16px', borderRadius: '8px', color: '#4F46E5', border: '2px solid #4F46E5', background: 'transparent', fontWeight: 'bold', cursor: 'pointer'}} onClick={() => navigate('/parent/dashboard')}>
            👨‍👩‍👧 Parent View
          </button>
          <button className="kd-btn-logout" onClick={handleLogout}><FiLogOut /></button>
        </div>
      </nav>

      <main className="kd-main">
        {/* HERO SECTION */}
        <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="kd-hero">
          <div className="kd-hero-text">
            <h1>Hey {child.name}! 🌟</h1>
            <p>You're doing amazing today!</p>
            
            <div className="kd-bedtime-badge">
              {hoursToBedtime > 0 ? `🌙 Bedtime in ${hoursToBedtime} hours` : `🌙 It's past your bedtime!`}
            </div>
          </div>
          
          <div className="kd-screen-time-ring" style={{'--percent': stPercent, '--ring-color': stColor}}>
             <div className="kd-ring-inner">
               <span className="kd-ring-used">{usedMins}</span>
               <span className="kd-ring-label">mins used</span>
               <span className="kd-ring-limit">of {limitMins}</span>
             </div>
          </div>
        </motion.section>

        <div className="kd-grid">
          {/* POINTS & LEVEL */}
          <motion.section initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="kd-card kd-level-card">
            <motion.h2 
              key={points} 
              initial={{ textShadow: "0px 0px 0px rgba(245,158,11,0)" }}
              animate={{ textShadow: ["0px 0px 15px rgba(245,158,11,0.8)", "0px 0px 0px rgba(245,158,11,0)"] }}
              transition={{ duration: 1.5 }}
            >
              ⭐ {points} Points
            </motion.h2>
            <div className="kd-level-header">
              <span className="kd-level-title">{levelName}</span>
              <span className="kd-progress-text">{Math.round(levelProgress)}% to next</span>
            </div>
            <div className="kd-progress-bar"><div className="kd-progress-fill" style={{width: `${levelProgress}%`}}></div></div>
            
            <div className="kd-history-list mt-6">
              <h4 className="text-sm text-gray-500 mb-2">Recent Points</h4>
              {points <= 0 && <p className="text-green text-sm mb-2" style={{fontWeight: 'bold'}}>Keep browsing safely to earn points! 🌟</p>}
              {pointsHistory.length === 0 ? <p className="text-muted text-sm">No points yet!</p> :
                pointsHistory.map((ph, idx) => (
                  <div key={idx} className="kd-history-item">
                    <span>{ph.label}</span>
                    <span className={ph.change > 0 ? 'text-green' : 'text-red'}>{ph.change > 0 ? '+'+ph.change : ph.change}</span>
                  </div>
                ))
              }
            </div>
          </motion.section>

          {/* TODAY'S ACTIVITY */}
          <motion.section initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}} className="kd-card kd-activity-card">
            <h2>Today's Activity</h2>
            <div className="kd-act-stats">
               <div className="kd-act-item"><span>🌐</span> {visitsToday} sites visited</div>
               <div className="kd-act-item"><span>✅</span> {safeSites} safe sites</div>
               <div className="kd-act-item"><span>⭐</span> {todayActs.filter(a => a.pointsAwarded && a.type === 'SITE_VISIT').length * 2} points earned</div>
            </div>
            <div className="kd-meter-container">
              <h3>Behavior Meter</h3>
              <div className="kd-meter-emoji">{meterEmoji}</div>
              <p className="kd-meter-msg text-center">Great job staying safe online!</p>
            </div>
          </motion.section>

          {/* REWARDS SHOP */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="kd-card kd-rewards-section col-span-2">
            <h2>🎁 Reward Shop</h2>
            {rewards.length === 0 ? (
               <div className="kd-empty">Ask your parent to add rewards! 🎁</div>
            ) : (
              <div className="kd-rewards-grid">
                {rewards.map(r => (
                  <div key={r.id} className="kd-reward-card">
                    <span className="kd-reward-emoji">{r.emoji || '🎁'}</span>
                    <div>
                      <h4 className="kd-reward-title">{r.title}</h4>
                      <p className="kd-reward-cost">⭐ {r.cost} pts</p>
                    </div>
                    <button 
                       className="kd-btn-redeem" 
                       disabled={points < r.cost}
                       onClick={() => redeemReward(r)}
                    >
                      Redeem
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* RECOMMENDED SITES */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="kd-card kd-sites-section col-span-2">
             <h2>🌐 Cool Sites for You!</h2>
             {recommendedSites.length === 0 ? (
               <div className="kd-empty">Your parent hasn't added any sites yet! 😊</div>
             ) : (
                 <div className="kd-sites-grid">
                 {recommendedSites.map((url, i) => (
                   <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`kd-site-pill ${getSiteBorderColor(i)}`}>
                     {new URL(url).hostname.replace('www.', '')}
                   </a>
                 ))}
               </div>
             )}
          </motion.section>
          
        </div>
      </main>

    </div>
  );
}
