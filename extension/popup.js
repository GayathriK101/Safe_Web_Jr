document.addEventListener('DOMContentLoaded', () => {
  const todayStr = new Date().toDateString();

  chrome.storage.local.get(['sitesVisited', 'flagsToday', 'blockedToday', 'pointsEarned', 'lastResetDate'], (result) => {
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
});
