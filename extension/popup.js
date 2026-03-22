document.addEventListener('DOMContentLoaded', () => {
  const setupView = document.getElementById('setup-view');
  const mainView = document.getElementById('main-view');
  const linkBtn = document.getElementById('link-btn');
  const codeInput = document.getElementById('parent-code-input');
  const errorMsg = document.getElementById('setup-error');
  const successMsg = document.getElementById('setup-success');

  chrome.storage.local.get(['parentId'], (res) => {
    if (!res.parentId) {
      setupView.style.display = 'block';
    } else {
      mainView.style.display = 'block';
      loadMainView();
    }
  });

  linkBtn.addEventListener('click', () => {
    const code = codeInput.value.trim();
    if (code.length === 8) {
      chrome.storage.local.set({ parentId: code }, () => {
        errorMsg.style.display = 'none';
        successMsg.style.display = 'block';
        setTimeout(() => {
          setupView.style.display = 'none';
          mainView.style.display = 'block';
          loadMainView();
        }, 1500);
      });
    } else {
      errorMsg.textContent = "Code must be exactly 8 characters.";
      errorMsg.style.display = 'block';
    }
  });

  function loadMainView() {
    const todayStr = new Date().toDateString();

    chrome.storage.local.get(['sitesVisited', 'flagsToday', 'blockedToday', 'pointsEarned', 'lastResetDate', 'screenTimeToday', 'screenTimeLimit'], (result) => {
      // Reset flags at midnight logic
    let currentFlags = result.flagsToday || 0;
    let currentBlocked = result.blockedToday || 0;
    
    if (result.lastResetDate !== todayStr) {
      currentFlags = 0;
      currentBlocked = 0;
      chrome.storage.local.set({ 
        flagsToday: 0, 
        blockedToday: 0,
        lastResetDate: todayStr 
      });
    }

    if (result.sitesVisited !== undefined) document.getElementById('sites-visited').textContent = result.sitesVisited;
    document.getElementById('flags-raised').textContent = currentFlags;
    document.getElementById('sites-blocked').textContent = currentBlocked;
    if (result.pointsEarned !== undefined) document.getElementById('points-earned').textContent = result.pointsEarned;
    
    const stToday = result.screenTimeToday || 0;
    const stLimit = result.screenTimeLimit || 120;
    const stDisplay = document.getElementById('screen-time-display');
    if (stDisplay) {
      if (stLimit - stToday > 0) {
        stDisplay.textContent = `⏱ ${stToday} mins used`;
      } else {
        stDisplay.textContent = `⏱ ${stToday} mins used (Limit Reached)`;
        stDisplay.style.color = "#ef4444";
        stDisplay.style.fontWeight = "bold";
      }
    }
  });

    const panicBtn = document.getElementById('panic-btn');
    panicBtn.addEventListener('click', () => {
      if (panicBtn.classList.contains('disabled')) return;

      const confirmed = confirm("Are you sure? This will alert your parent immediately.");
      if (confirmed) {
        chrome.runtime.sendMessage({ type: "PANIC" }, (response) => {
          // Change button state
          panicBtn.classList.add('disabled');
          panicBtn.innerHTML = `
            <span class="icon">✅</span>
            <div class="panic-text">
              <strong>Parent Alerted!</strong>
              <span>Help is on the way.</span>
            </div>
          `;
        });
      }
    });
  }
});
