let sitesVisited = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ sitesVisited: 0, flagsRaised: 0, pointsEarned: 0 });
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
  return true;
});
