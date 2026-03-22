document.addEventListener('DOMContentLoaded', () => {
  // Load stats from storage
  chrome.storage.local.get(['sitesVisited', 'flagsRaised', 'pointsEarned'], (result) => {
    if (result.sitesVisited !== undefined) document.getElementById('sites-visited').textContent = result.sitesVisited;
    if (result.flagsRaised !== undefined) document.getElementById('flags-raised').textContent = result.flagsRaised;
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
