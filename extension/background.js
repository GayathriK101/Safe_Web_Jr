async function syncSettingsFromFirestore() {
  const projectId = "safeweb-jr";
  const apiKey = "AIzaSyB8o1SfL1x0jwPtpZXgCYnDSMNtLXQ5Dh4";
  
  try {
    const storageRes = await chrome.storage.local.get(['parentId']);
    const parentId = storageRes.parentId || "unlinked";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/${parentId}?key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    if (data && data.fields) {
      const screenTimeLimit = data.fields.screenTimeLimit ? Number(data.fields.screenTimeLimit.integerValue || data.fields.screenTimeLimit.doubleValue || 120) : 120;
      const bedtimeHour = data.fields.bedtimeHour ? Number(data.fields.bedtimeHour.integerValue || data.fields.bedtimeHour.doubleValue || 21) : 21;
      const bedtimeEnabled = data.fields.bedtimeEnabled ? data.fields.bedtimeEnabled.booleanValue : true;
      const safeYouTubeEnabled = data.fields.safeYouTubeEnabled ? data.fields.safeYouTubeEnabled.booleanValue : true;
      
      chrome.storage.local.set({
        screenTimeLimit,
        bedtimeHour,
        bedtimeEnabled,
        safeYouTubeEnabled
      }, () => {
        checkBedtime();
      });
    }
  } catch(e) {
    console.log("Sync failed silently", e);
  }
}

async function checkBedtime() {
  const data = await chrome.storage.local.get({
    bedtimeHour: 21,
    bedtimeEnabled: true
  });
  const currentHour = new Date().getHours();
  console.log("Bedtime check:", currentHour, 
    ">=", data.bedtimeHour, 
    "enabled:", data.bedtimeEnabled);
  if (data.bedtimeEnabled && 
      (currentHour >= data.bedtimeHour || currentHour < 6)) {
    chrome.storage.local.set({bedtimeLocked: true});
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        if (tab.id && tab.url && 
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, 
            {type: "BEDTIME_LOCK"})
            .catch(e => {});
        }
      });
    });
  } else {
    chrome.storage.local.set({bedtimeLocked: false});
  }
}

async function logActivityToFirestore(data) {
  const projectId = "safeweb-jr";
  const apiKey = "AIzaSyB8o1SfL1x0jwPtpZXgCYnDSMNtLXQ5Dh4";
  
  // Always get fresh parentId from storage
  const stored = await chrome.storage.local.get(['parentId']);
  const parentId = stored.parentId || "unlinked";
  
  console.log("Logging activity with parentId:", parentId);
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/activity?key=${apiKey}`;
  
  try {
    await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        fields: {
          type: {stringValue: data.type || ""},
          url: {stringValue: data.url || ""},
          domain: {stringValue: data.domain || ""},
          query: {stringValue: data.query || ""},
          parentId: {stringValue: parentId},
          childId: {stringValue: "placeholder"},
          timestamp: {stringValue: new Date().toISOString()}
        }
      })
    });
  } catch(e) {
    console.log("Firebase log failed silently", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    sitesVisited: 0, 
    flagsToday: 0, 
    blockedToday: 0,
    flagsRaised: 0, 
    pointsEarned: 0,
    flaggedSites: [],
    lastResetDate: new Date().toDateString()
  });
  syncSettingsFromFirestore();
});

chrome.alarms.create("syncSettings", { periodInMinutes: 5 });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    chrome.storage.local.get({screenTimeExceeded: false, bedtimeLocked: false}, (res) => {
      if (res.screenTimeExceeded) {
        chrome.tabs.sendMessage(tabId, {type: "SCREEN_TIME_EXCEEDED"}).catch(e => {});
      } else if (res.bedtimeLocked) {
        chrome.tabs.sendMessage(tabId, {type: "BEDTIME_LOCK"}).catch(e => {});
      }
    });

    chrome.storage.local.get(['sitesVisited'], (result) => {
      let count = (result.sitesVisited || 0) + 1;
      
      const visitData = {
        url: tab.url,
        title: tab.title,
        timestamp: new Date().toISOString(),
        childId: "unknown"
      };
      
      chrome.storage.local.set({ 
        sitesVisited: count,
        lastVisit: visitData
      });
      
      logActivityToFirestore({
        type: "SITE_VISIT",
        url: tab.url,
        title: tab.title
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PANIC") {
    const panicData = {
      timestamp: new Date().toISOString(),
      type: "PANIC_ALERT",
      childId: "unknown"
    };
    
    chrome.storage.local.set({ lastPanic: panicData });
    logActivityToFirestore({ type: "PANIC", urgent: true });
    
    sendResponse({ success: true });
  } 
  else if (message.type === "CONTENT_FLAGGED") {
    chrome.storage.local.get({ flaggedSites: [] }, (res) => {
      const sites = res.flaggedSites;
      sites.unshift({
        url: message.url,
        timestamp: message.timestamp,
        count: message.count
      });
      
      if (sites.length > 50) {
        sites.length = 50;
      }
      
      chrome.storage.local.set({ flaggedSites: sites });
      logActivityToFirestore({ type: "CONTENT_FLAGGED", url: message.url, count: message.count });
    });
  }
  else if (message.type === "SITE_BLOCKED") {
    logActivityToFirestore({ type: "SITE_BLOCKED", domain: message.domain });
  }
  else if (message.type === "SEARCH_BLOCKED") {
    logActivityToFirestore({ type: "SEARCH_BLOCKED", query: message.query });
  }
  return true;
});

// Detect tampering if the extension is disabled
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    chrome.storage.local.set({ tamperEvent: { type: "TAMPER", timestamp: Date.now() } });
    logActivityToFirestore({
      type: "TAMPER",
      domain: "extension_disabled",
      url: "extension_disabled",
      urgent: true
    });
  }
});

// Screen Time & Bedtime Tracking
let activeTabId = null;
let activeTabUrl = null;
let activeTabStartTime = null;

chrome.tabs.onActivated.addListener(activeInfo => {
  handleTabChange(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    handleTabChange(tabId);
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    handleTabChange(null);
  } else {
    chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
      if (tabs.length > 0) handleTabChange(tabs[0].id);
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === activeTabId) {
    handleTabChange(null);
  }
});

function handleTabChange(newTabId) {
  const now = Date.now();
  
  if (activeTabId && activeTabStartTime) {
    const timeSpent = Math.floor((now - activeTabStartTime) / 60000); // minutes
    if (timeSpent > 0 && activeTabUrl) {
      updateScreenTime(activeTabUrl, timeSpent);
    }
  }
  
  activeTabId = newTabId;
  activeTabStartTime = now;
  if (newTabId) {
    chrome.tabs.get(newTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        activeTabUrl = null;
      } else {
        activeTabUrl = tab.url;
      }
    });
  } else {
    activeTabUrl = null;
  }
}

function updateScreenTime(url, minutes) {
  if (!url || url.startsWith('chrome://')) return;
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const todayStr = new Date().toDateString();
    
    chrome.storage.local.get(['screenTimeToday', 'screenTimeByDomain', 'screenTimeDate'], (res) => {
      let stToday = res.screenTimeToday || 0;
      let stDomain = res.screenTimeByDomain || {};
      let stDate = res.screenTimeDate;
      
      if (stDate !== todayStr) {
         stToday = 0;
         stDomain = {};
         stDate = todayStr;
         chrome.storage.local.set({ screenTimeExceeded: false });
      }
      
      stToday += minutes;
      stDomain[domain] = (stDomain[domain] || 0) + minutes;
      
      chrome.storage.local.set({
        screenTimeToday: stToday,
        screenTimeByDomain: stDomain,
        screenTimeDate: stDate
      });
    });
  } catch(e) {}
}

chrome.alarms.create("screenTimeCheck", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncSettings") {
    syncSettingsFromFirestore();
  }
  if (alarm.name === "screenTimeCheck") {
    // Flush current tab time to keep it accurate up to the minute
    const now = Date.now();
    if (activeTabId && activeTabStartTime) {
       const timeSpent = Math.floor((now - activeTabStartTime) / 60000);
       if (timeSpent >= 1 && activeTabUrl) {
          updateScreenTime(activeTabUrl, timeSpent);
          activeTabStartTime = now; // reset start time to prevent double-counting
       }
    }
    
    // Check Screen Time and Bedtime
    chrome.storage.local.get([
      'screenTimeToday', 'screenTimeByDomain', 'screenTimeLimit', 
      'bedtimeHour', 'bedtimeEnabled'
    ], (res) => {
      const stToday = res.screenTimeToday || 0;
      const limit = res.screenTimeLimit || 120;
      const bHour = res.bedtimeHour !== undefined ? res.bedtimeHour : 21;
      const bEnabled = res.bedtimeEnabled !== undefined ? res.bedtimeEnabled : true;
      const currentHour = new Date().getHours();
      
      console.log("Bedtime check:", currentHour, ">=", bHour, "enabled:", bEnabled);
      console.log("Screen time:", stToday, "/", limit);
      
      // Log screen time
      if (stToday > 0) {
        logActivityToFirestore({
          type: "SCREEN_TIME_UPDATE",
          totalMinutes: stToday,
          domain: "screen_time",
          url: "screen_time"
        });
      }
      
      if (stToday >= limit) {
        chrome.storage.local.set({screenTimeExceeded: true});
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
             if (tab.id && tab.url && 
                 !tab.url.startsWith('chrome://') &&
                 !tab.url.startsWith('chrome-extension://')) {
               chrome.tabs.sendMessage(tab.id, {type: "SCREEN_TIME_EXCEEDED"}).catch(()=>{});
             }
          });
        });
        logActivityToFirestore({type: "SCREEN_TIME_EXCEEDED", totalMinutes: stToday});
      }
      
      checkBedtime();
    });
  }
});

syncSettingsFromFirestore();
