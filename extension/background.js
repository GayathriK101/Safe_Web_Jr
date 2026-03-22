let sitesVisited = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    sitesVisited: 0, 
    flagsToday: 0, 
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
      
      console.log("Logged visit:", visitData);
      
      chrome.storage.local.set({ 
        sitesVisited: count,
        lastVisit: visitData
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
    
    console.log("PANIC TRIGGERED", panicData);
    chrome.storage.local.set({ lastPanic: panicData });
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
      
      // Keep only last 50
      if (sites.length > 50) {
        sites.length = 50;
      }
      
      chrome.storage.local.set({ flaggedSites: sites });
    });
  }
  return true;
});

// Detect tampering if the extension is disabled
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    chrome.storage.local.set({
      tamperEvent: {
        type: "TAMPER",
        timestamp: Date.now()
      }
    });
  }
});
