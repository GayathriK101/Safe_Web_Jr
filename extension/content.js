// SafeWeb Jr Content Filter
console.log("SafeWeb Jr scanning: " + window.location.href);

const BAD_WORDS = [
  // Sexual / Explicit
  "porn", "xxx", "nsfw", "sex", "nude", "naked", "erotica", "fetish",
  // Violence / Gore
  "gore", "behead", "murder", "suicide", "kill", "blood", "massacre", "torture",
  // Drugs
  "cocaine", "heroin", "meth", "fentanyl", "lsd", "mdma", "opium", "narcotics",
  // Hate Speech
  "nazi", "supremacist", "slur", "bigot", "racist"
];

// Check Safe YouTube Redirect
chrome.storage.local.get({ safeYouTubeEnabled: true }, (res) => {
  if (res.safeYouTubeEnabled) {
    const url = window.location.href;
    if (url.includes("youtube.com") && !url.includes("youtubekids.com")) {
      window.location.href = "https://www.youtubekids.com";
    }
  }
});

let sessionFlags = 0;

function scanTextNode(node) {
  // Ignore purely whitespace or very short texts
  const text = node.nodeValue.trim().toLowerCase();
  if (text.length < 3) return false;

  const hasBadWord = BAD_WORDS.some(word => text.includes(word));
  
  if (hasBadWord) {
    const parent = node.parentElement;
    // Prevent double processing
    if (parent && !parent.getAttribute("data-safeweb-blurred")) {
      parent.setAttribute("data-safeweb-blurred", "true");
      
      // Apply blur
      parent.style.filter = "blur(8px)";
      parent.style.position = "relative";
      
      // Create overlay
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(79, 70, 229, 0.15)";
      overlay.style.border = "2px solid #4F46E5";
      overlay.style.borderRadius = "8px";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "1000";
      overlay.style.color = "#4F46E5";
      overlay.style.fontSize = "12px";
      overlay.style.fontWeight = "bold";
      overlay.style.backdropFilter = "blur(4px)";
      overlay.style.pointerEvents = "none";
      overlay.innerText = "🛡️ Content Hidden by SafeWeb Jr";
      
      parent.appendChild(overlay);
      return true;
    }
  }
  return false;
}

function scanPage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  let flagsFound = 0;
  
  while ((node = walker.nextNode())) {
    // Skip script and style tags
    const parentName = node.parentElement ? node.parentElement.nodeName.toLowerCase() : "";
    if (parentName !== 'script' && parentName !== 'style' && parentName !== 'noscript') {
      if (scanTextNode(node)) {
        flagsFound++;
      }
    }
  }
  
  if (flagsFound > 0) {
    sessionFlags += flagsFound;
    
    // Update local storage counter immediately
    chrome.storage.local.get({ flagsToday: 0 }, (res) => {
      chrome.storage.local.set({ flagsToday: res.flagsToday + flagsFound });
    });
    
    // Send message to background
    chrome.runtime.sendMessage({
      type: "CONTENT_FLAGGED",
      count: flagsFound,
      url: window.location.href,
      timestamp: Date.now()
    });
  }
}

// Initial Run slightly delayed
setTimeout(() => {
  scanPage();
  
  // Set up MutationObserver for dynamic content
  const observer = new MutationObserver((mutations) => {
    let newFlags = 0;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (scanTextNode(node)) newFlags++;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Walk descendants
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
          let n;
          while ((n = walker.nextNode())) {
            const pName = n.parentElement ? n.parentElement.nodeName.toLowerCase() : "";
            if (pName !== 'script' && pName !== 'style' && pName !== 'noscript') {
              if (scanTextNode(n)) newFlags++;
            }
          }
        }
      });
    });
    
    if (newFlags > 0) {
      sessionFlags += newFlags;
      chrome.storage.local.get({ flagsToday: 0 }, (res) => {
        chrome.storage.local.set({ flagsToday: res.flagsToday + newFlags });
      });
      chrome.runtime.sendMessage({
        type: "CONTENT_FLAGGED",
        count: newFlags,
        url: window.location.href,
        timestamp: Date.now()
      });
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Auto disconnect after 30 seconds
  setTimeout(() => {
    observer.disconnect();
  }, 30000);
  
}, 1000);
