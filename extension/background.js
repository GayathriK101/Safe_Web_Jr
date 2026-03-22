async function logActivityToFirestore(data) {
  const projectId = "safeweb-jr";
  const apiKey = "AIzaSyB8o1SfL1x0jwPtpZXgCYnDSMNtLXQ5Dh4";
  
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
          childId: {stringValue: "placeholder"},
          parentId: {stringValue: "placeholder"},
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
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.storage.local.get(['sitesVisited'], (result) => {
      let count = (result.sitesVisited || 0) + 1;
      
      const visitData = {
        url: tab.url,
        title: tab.title,
        timestamp: new Date().toISOString(),
        childId: "placeholder"
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
      childId: "placeholder"
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
    const data = {
      type: "TAMPER",
      timestamp: Date.now()
    };
    chrome.storage.local.set({ tamperEvent: data });
    logActivityToFirestore(data);
  }
});
