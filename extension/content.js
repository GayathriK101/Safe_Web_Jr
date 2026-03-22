// SafeWeb Jr Content Filter
console.log("SafeWeb Jr scanning: " + window.location.href);

const BLOCKED_DOMAINS = [
  // Major adult video sites
  "pornhub.com", "xvideos.com", "xnxx.com", 
  "xhamster.com", "redtube.com", "youporn.com",
  "tube8.com", "eporner.com", "spankbang.com",
  "beeg.com", "hqporner.com", "tnaflix.com",
  "tubecup.com", "txxx.com", "vjav.com",
  "javhd.com", "javmost.com", "porntrex.com",
  "cliphunter.com", "empflix.com", "faphouse.com",
  "porndig.com", "porndoe.com", "pornone.com",
  "bravotube.net", "hdporn.net", "porn.com",
  "sex.com", "pornmd.com", "fuqer.com",
  "4tube.com", "5star.porn", "91porn.com",
  
  // Premium adult studios
  "brazzers.com", "bangbros.com", "realitykings.com",
  "mofos.com", "twistys.com", "nubiles.net",
  "digitalplayground.com", "kink.com", "faketaxi.com",
  "fakehub.com", "passion-hd.com", "babes.com",
  "wicked.com", "penthouse.com", "hustler.com",
  "playboy.com", "playboyplus.com",
  
  // Live cam sites
  "chaturbate.com", "livejasmin.com", "stripchat.com",
  "cam4.com", "myfreecams.com", "bongacams.com",
  "camsoda.com", "jerkmate.com", "streamate.com",
  "imlive.com", "flirt4free.com", "liveprivates.com",
  "cams.com", "amateur.tv", "camplace.com",
  
  // Dating and hookup sites
  "adultfriendfinder.com", "ashleymadison.com",
  "fling.com", "alt.com", "benaughty.com",
  "gleeden.com", "victoriamilan.com", "snap sexting",
  
  // Hentai and anime adult
  "nhentai.net", "hentaihaven.xxx", "rule34.xxx",
  "rule34.paheal.net", "e621.net", "gelbooru.com",
  "danbooru.donmai.us", "sankakucomplex.com",
  "fakku.net", "hentai2read.com", "luscious.net",
  "hentaifox.com", "imhentai.xxx",
  
  // OnlyFans and similar
  "onlyfans.com", "fapello.com", "thothub.to",
  "simpcity.su", "coomer.party", "kemono.party",
  "fansly.com", "manyvids.com", "clips4sale.com",
  "iwantclips.com", "niteflirt.com",
  
  // Gore and shock sites  
  "liveleak.com", "bestgore.com", "goregrish.com",
  "theync.com", "crazyshit.com", "kaotic.com",
  "gorethread.com", "ogrish.com", "rotten.com",
  "watchpeopledie.tv", "uncoverreality.com",
  
  // Escort sites
  "backpage.com", "skipthegames.com", "eroticmonkey.ch",
  "slixa.com", "tryst.link", "preferred411.com",
  
  // Other adult
  "xart.com", "hegre.com", "femjoy.com",
  "met-art.com", "watch-my-gf.com", "homemoviestube.com",
  "motherless.com", "heavy-r.com", "drtuber.com",
  "nuvid.com", "gotporn.com", "perverzija.com"
];

const BAD_WORDS = [
  // Direct explicit terms
  "porn", "porno", "pornography", "xxx", "x-rated",
  "nsfw", "adult content", "explicit content",
  
  // Sexual acts and terms
  "sex", "sexual", "intercourse", "masturbate", 
  "masturbation", "orgasm", "erection", "ejaculate",
  "blowjob", "handjob", "fingering", "cunnilingus",
  "fellatio", "anal", "threesome", "orgy", "gangbang",
  "creampie", "squirt", "climax", "foreplay",
  
  // Body parts used explicitly  
  "penis", "vagina", "vulva", "clitoris", "testicles",
  "boobs", "boob", "breasts", "nipple", "nipples",
  "naked", "nude", "nudes", "nudity", "topless",
  "bottomless", "genitals", "privates", "dick",
  "cock", "pussy", "ass", "butt naked", "bare",
  
  // Search terms kids use
  "naked girls", "naked boys", "naked women", "naked men",
  "nude girls", "nude boys", "hot naked", "sexy naked",
  "nude photos", "naked photos", "sex video", "sex tape",
  "leaked nudes", "leaked photos", "onlyfans leaked",
  
  // Soft explicit terms
  "erotic", "erotica", "seductive", "sensual",
  "sexy", "naughty", "kinky", "horny", "aroused",
  "strip", "stripper", "stripping", "lap dance",
  "escort", "prostitute", "prostitution", "hookup",
  "one night stand", "friends with benefits",
  "sexting", "sext", "dirty pics", "dirty photos",
  
  // Adult platforms and content types
  "onlyfans", "hentai", "anime porn", "rule34",
  "doujin", "ecchi", "lemon fanfic", "smut",
  "fanfiction sex", "wattpad sex", "ao3 explicit",
  
  // Violence and gore
  "gore", "gory", "beheading", "decapitation",
  "murder video", "death video", "brutal killing",
  "graphic violence", "live death", "liveleak",
  "bestgore", "shock site", "snuff", "torture video",
  "execution video", "stabbing video", "shooting video",
  
  // Self harm
  "how to kill myself", "how to commit suicide",
  "suicide methods", "painless death", "self harm",
  "cutting myself", "how to cut", "want to die",
  "end my life", "kill myself",
  
  // Drugs and substances
  "cocaine", "heroin", "meth", "methamphetamine",
  "fentanyl", "lsd", "mdma", "ecstasy", "molly",
  "opium", "crack", "crystal meth", "buy drugs",
  "buy weed", "buy marijuana", "how to get high",
  "drug dealer", "get stoned", "smoke weed",
  "roll a joint", "bong", "drug high",
  
  // Hate speech
  "nazi", "white supremacist", "kkk", "hate speech",
  "racial slur", "ethnic cleansing", "genocide",
  
  // Grooming related
  "send me pics", "send nudes", "show me your body",
  "are you alone", "dont tell your parents",
  "our little secret", "special friend",
  "meet in person", "come to my house"
];

const hostname = window.location.hostname.replace('www.', '').toLowerCase();

function showBlockScreen(title, message) {
  const blockHTML = `
    <div style="background-color: black; color: white; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999999999; font-family: sans-serif; text-align: center; padding: 20px; box-sizing: border-box;">
      <div style="font-size: 80px; margin-bottom: 20px;">🛡️</div>
      <h1 style="color: #ef4444; font-size: 48px; margin: 0 0 20px 0;">${title}</h1>
      <p style="font-size: 20px; max-width: 600px; margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
      <p style="color: #9ca3af; font-size: 16px; margin: 0 0 40px 0;">This visit has been reported to your parent</p>
      <div style="background-color: #1f2937; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #e5e7eb;">If you think this is a mistake, ask your parent to whitelist it</p>
      </div>
    </div>
  `;
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.insertAdjacentHTML('afterbegin', blockHTML);
}

// Domain Blacklist Check
if (BLOCKED_DOMAINS.some(d => hostname.includes(d))) {
  showBlockScreen("Site Blocked", "SafeWeb Jr has blocked this site because it contains content that is not appropriate for children");
  
  chrome.storage.local.get({ blockedToday: 0 }, (res) => {
    chrome.storage.local.set({ blockedToday: res.blockedToday + 1 });
  });
  
  chrome.storage.local.set({
    lastBlockedSite: { type: "BLOCKED_SITE", domain: hostname, timestamp: Date.now() }
  });
  
  chrome.runtime.sendMessage({ type: "SITE_BLOCKED", domain: hostname, timestamp: Date.now() });

  // Stop script execution here
  throw new Error("Execution stopped due to blocked domain.");
}

function monitorSearchQuery() {
  const url = new URL(window.location.href);
  let query = "";
  if (hostname.includes("google.com") || hostname.includes("bing.com") || hostname.includes("duckduckgo.com")) {
    query = url.searchParams.get("q") || "";
  } else if (hostname.includes("youtube.com")) {
    query = url.searchParams.get("search_query") || "";
  } else if (hostname.includes("yahoo.com") && url.searchParams.has("p")) {
    query = url.searchParams.get("p") || "";
  }

  query = query.toLowerCase();

  if (query && BAD_WORDS.some(word => query.includes(word))) {
    showBlockScreen("Search Blocked", "This search contains inappropriate content");
    
    chrome.storage.local.get({ blockedToday: 0 }, (res) => {
      chrome.storage.local.set({ blockedToday: res.blockedToday + 1 });
    });
    
    chrome.storage.local.set({
      lastBlockedSearch: { type: "BLOCKED_SEARCH", query, site: hostname, timestamp: Date.now() }
    });
    
    chrome.runtime.sendMessage({ type: "SEARCH_BLOCKED", query, timestamp: Date.now() });
    
    throw new Error("Execution stopped due to blocked search.");
  }
}

// Run search monitor
monitorSearchQuery();

// Check Safe YouTube Redirect (if not blocked)
chrome.storage.local.get({ safeYouTubeEnabled: true }, (res) => {
  if (res.safeYouTubeEnabled) {
    const currentUrl = window.location.href;
    if (currentUrl.includes("youtube.com") && !currentUrl.includes("youtubekids.com")) {
      window.location.href = "https://www.youtubekids.com";
      // We don't throw an error here to allow normal redirection workflow, but parsing still continues
      return; 
    }
  }
});

let sessionFlags = 0;

function scanTextNode(node) {
  const text = node.nodeValue.trim().toLowerCase();
  if (text.length < 3) return false;

  const hasBadWord = BAD_WORDS.some(word => text.includes(word));
  
  if (hasBadWord) {
    const parent = node.parentElement;
    if (parent && !parent.getAttribute("data-safeweb-blurred")) {
      parent.setAttribute("data-safeweb-blurred", "true");
      
      parent.style.filter = "blur(8px)";
      parent.style.position = "relative";
      
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

// YouTube Title Scanning explicitly
function scanYouTubeTitles() {
  if (!hostname.includes("youtube.com")) return 0;
  
  let flags = 0;
  // Video titles usually have id="video-title" or class containing "ytd-video-renderer" or "ytd-rich-item-renderer"
  const elements = Array.from(document.querySelectorAll('#video-title, ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer'));
  
  elements.forEach(el => {
    if (el.getAttribute("data-yt-scanned")) return;
    
    // get text content
    const text = el.textContent.toLowerCase();
    const hasBadWord = BAD_WORDS.some(word => text.includes(word));
    
    if (hasBadWord) {
      el.setAttribute("data-yt-scanned", "true");
      // Blur the container
      el.style.filter = "blur(15px)"; // More blur for video thumbnails
      el.style.pointerEvents = "none"; // Disable clicks
      flags++;
    } else {
      el.setAttribute("data-yt-scanned", "safe");
    }
  });
  
  return flags;
}

function scanPage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  let flagsFound = 0;
  
  while ((node = walker.nextNode())) {
    const parentName = node.parentElement ? node.parentElement.nodeName.toLowerCase() : "";
    if (parentName !== 'script' && parentName !== 'style' && parentName !== 'noscript') {
      if (scanTextNode(node)) {
        flagsFound++;
      }
    }
  }
  
  // Also scan YT specific
  flagsFound += scanYouTubeTitles();
  
  if (flagsFound > 0) {
    sessionFlags += flagsFound;
    chrome.storage.local.get({ flagsToday: 0 }, (res) => {
      chrome.storage.local.set({ flagsToday: res.flagsToday + flagsFound });
    });
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
  
  const observer = new MutationObserver((mutations) => {
    let newFlags = 0;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (scanTextNode(node)) newFlags++;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
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
    
    newFlags += scanYouTubeTitles();
    
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
  
  setTimeout(() => {
    observer.disconnect();
  }, 30000);
  
}, 1000);
