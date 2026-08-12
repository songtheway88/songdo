(function() {
  // 1. Mobile Check (Width <= 768px)
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Do not run if not on mobile
  if (!isMobile()) {
    return;
  }

  // 2. Do not run on customer.html (interest registration page itself)
  if (window.location.pathname.includes('customer.html')) {
    return;
  }

  // 3. Check LocalStorage for "오늘 하루 열지 않기"
  const hideUntil = localStorage.getItem('hideRouletteUntil');
  if (hideUntil && Date.now() < parseInt(hideUntil, 10)) {
    return;
  }

  // 4. Create and inject overlay structure
  const overlay = document.createElement('div');
  overlay.className = 'roulette-overlay';
  overlay.id = 'rouletteEventPopup';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Unicode Escape translation (single backslash):
  // 룰렛을 돌리고 특별 혜택을 확인해보세요 -> \ub8f0\ub81b\uc744 \ub3cc\ub9ac\uace0 \ud2b9\ubcc4 \ud61c\ud0dd\uc744 \ud655\uc778\ud574\ubcf4\uc020\uc694
  // 닫기 -> \ub2eb\uae30
  // 🎉 축하합니다! 당첨되었습니다! -> \ud83c\udf89 \ucd95\ud558\ud569\ub2c8\ub2e4! \ub2f9\ud568\ub418\uc5c8\uc2b5\ub2c8\ub2e4!
  // 백화점 상품권 3만원 -> \ubc31\ud654\uc810 \uc0c1\ud488\uad8c 3\ub9cc\uc6d0
  // 관심고객 등록하기 -> \uad00\uc2ec\uace0\uac1d \ub4f1\ub85d\ud558\uae30
  // 오늘 하루 열지 않기 -> \uc624\ub298 \ud558\ub8e8 \uc5f4\uc9c0 \uc54a\uae30

  overlay.innerHTML = `
    <div class="roulette-modal">
      <div class="roulette-header">
        <div class="limited-event">LIMITED EVENT</div>
        <div class="divider">
          <div class="divider-line"></div>
          <div class="divider-diamond"></div>
          <div class="divider-line"></div>
        </div>
        <div class="subtitle">\ub8f0\ub81b\uc744 \ub3cc\ub9ac\uace0 \ud2b9\ubcc4 \ud61c\ud0dd\uc744 \ud655\uc778\ud574\ubcf4\uc020\uc694</div>
        <button type="button" class="roulette-close-btn" aria-label="\ub2eb\uae30">&times;</button>
      </div>
      <div class="roulette-body">
        
        <!-- Phase 2: Roulette Game View (Starts Active Directly) -->
        <div class="roulette-view roulette-game-view active">
          <div class="roulette-game-container">
            <div class="roulette-pointer"></div>
            <canvas class="roulette-wheel" width="250" height="250"></canvas>
            <div class="roulette-spin-btn">START<br>EVENT</div>
          </div>
        </div>

        <!-- Phase 3: Result View -->
        <div class="roulette-view roulette-result-view">
          <h3>\ud83c\udf89 \ucd95\ud558\ud569\ub2c8\ub2e4! \ub2f9\ucca8\ub418\uc5c8\uc2b5\ub2c8\ub2e4!</h3>
          <div class="prize-card-wrapper">
            <img src="img/roulette_banner.jpg" alt="\ubc31\ud654\uc810 \uc0c1\ud488\uad8c 3\ub9cc\uc6d0" class="prize-card-img" />
          </div>
          <button type="button" class="roulette-cta-btn">\ubc29\ubb38\uc608\uc57d\ud558\uae30</button>
          <button type="button" class="roulette-home-btn">\ud648\ud398\uc774\uc9c0 \ubcf4\ub7ec\uac00\uae30</button>
        </div>

      </div>
      
      <!-- Footer daily close control -->
      <div class="roulette-footer">
        <button type="button" class="roulette-footer-btn js-roulette-today-close">\uc624\ub298 \ud558\ub8e8 \uc5f4\uc9c0 \uc54a\uae30</button>
        <button type="button" class="roulette-footer-btn js-roulette-close">\ub2eb\uae30</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger active class for transition
  setTimeout(() => {
    overlay.classList.add('active');
  }, 100);

  // 5. Select elements
  const gameView = overlay.querySelector('.roulette-game-view');
  const resultView = overlay.querySelector('.roulette-result-view');
  const spinBtn = overlay.querySelector('.roulette-spin-btn');
  const canvas = overlay.querySelector('.roulette-wheel');
  const closeBtn = overlay.querySelector('.roulette-close-btn');
  const footerCloseBtn = overlay.querySelector('.js-roulette-close');
  const todayCloseBtn = overlay.querySelector('.js-roulette-today-close');
  const ctaBtn = overlay.querySelector('.roulette-cta-btn');
  const homeBtn = overlay.querySelector('.roulette-home-btn');

  // 6. Draw Roulette Wheel on Canvas
  const ctx = canvas.getContext('2d');
  
  // Slices display only question marks "?" as requested
  const segments = [
    { label: "?", color: "#101e3d" },
    { label: "?", color: "#0a101c" },
    { label: "?", color: "#0d695b" },
    { label: "?", color: "#8b2635" }
  ];
  const numSegments = segments.length;
  const radius = canvas.width / 2;
  
  // Set up high DPI canvas support
  const dpi = window.devicePixelRatio || 1;
  canvas.width = 250 * dpi;
  canvas.height = 250 * dpi;
  canvas.style.width = '250px';
  canvas.style.height = '250px';
  ctx.scale(dpi, dpi);

  function drawWheel() {
    ctx.clearRect(0, 0, 250, 250);
    const angleStep = (2 * Math.PI) / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const startAngle = i * angleStep - Math.PI / 2; // start from top
      const endAngle = startAngle + angleStep;

      // Draw segment slice
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 4, startAngle, endAngle);
      ctx.fillStyle = segments[i].color;
      ctx.fill();

      // Draw segment outer gold line
      ctx.strokeStyle = "rgba(198, 162, 107, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(radius, radius);
      // Rotate to the center of the segment
      ctx.rotate(startAngle + angleStep / 2);
      
      // Draw big gold question mark in the center of slice
      ctx.fillStyle = "#e0c294";
      ctx.font = "bold 28px 'Pretendard', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(segments[i].label, radius * 0.55, 0);

      ctx.restore();
    }

    // Draw gold outer border ring
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "#c6a26b";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw tiny shiny gold dots on outer ring
    for (let j = 0; j < 12; j++) {
      const dotAngle = (j * (2 * Math.PI)) / 12;
      const dotX = radius + (radius - 4) * Math.cos(dotAngle);
      const dotY = radius + (radius - 4) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff3e0";
      ctx.fill();
    }
  }

  drawWheel();

  // 8. Spin Roulette Animation
  let isSpinning = false;
  spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;

    // We want the wheel to land exactly on "3만원" (Segment 2, green)
    // Target rotation formula: 5 full turns (1800 deg) + 135 deg to center Segment 2 under 12 o'clock pointer
    const targetDeg = 1800 + 135;
    canvas.style.transform = `rotate(${targetDeg}deg)`;

    // Wait for animation to finish (4s)
    setTimeout(() => {
      triggerConfetti();
      
      // Transition to Result Screen
      setTimeout(() => {
        gameView.classList.remove('active');
        resultView.classList.add('active');
      }, 800);
    }, 4000);
  });

  // 9. Confetti Celebration Effect
  function triggerConfetti() {
    const colors = ['#c6a26b', '#fff3e0', '#0d695b', '#e52b20', '#5c8cf2'];
    const container = overlay.querySelector('.roulette-body');

    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // Random position and styling
      confetti.style.left = `${Math.random() * 80 + 10}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.setProperty('--x-offset', `${(Math.random() - 0.5) * 120}px`);
      confetti.style.animationDelay = `${Math.random() * 0.4}s`;
      
      container.appendChild(confetti);

      // Clean up
      setTimeout(() => {
        confetti.remove();
      }, 2500);
    }
  }

  // 10. Close Popup Controls
  function closePopup() {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
    }, 400);
  }

  closeBtn.addEventListener('click', closePopup);
  footerCloseBtn.addEventListener('click', closePopup);

  todayCloseBtn.addEventListener('click', () => {
    // Hide for 24 hours
    const hideUntilTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('hideRouletteUntil', hideUntilTime);
    closePopup();
  });

  // 11. CTA Action Button Navigation
  ctaBtn.addEventListener('click', () => {
    closePopup();
    // Redirect to customer interest registration page
    window.location.href = 'customer.html';
  });

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      closePopup();
      window.location.href = 'index.html';
    });
  }

})();
