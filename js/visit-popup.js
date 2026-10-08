// 방문예약 이벤트 팝업 (기존 룰렛 팝업 대체)
// 노출 조건은 기존과 동일: 모바일(≤768px) 메인 페이지, 관심고객등록 페이지 제외
(function () {
  if (window.innerWidth > 768) return;
  if (/\/customer(\.html)?$/.test(window.location.pathname)) return;

  // 닫으면 같은 세션 동안 다시 띄우지 않음
  try {
    if (sessionStorage.getItem('visitPopupClosed') === '1') return;
  } catch (e) {}

  var TEL = '1688-5535';

  var overlay = document.createElement('div');
  overlay.className = 'visit-popup-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'visitPopupTitle');
  overlay.innerHTML =
    '<div class="visit-popup">' +
    '<div class="visit-popup-body">' +
    '<p class="visit-popup-eyebrow">지금 방문 예약 시</p>' +
    '<p class="visit-popup-title" id="visitPopupTitle">백화점 상품권<br><strong>3만원 증정</strong></p>' +
    '<a class="visit-popup-tel" href="tel:' + TEL + '">상담전화 <b>' + TEL + '</b></a>' +
    '<div class="visit-popup-btns">' +
    '<a class="visit-popup-btn is-call" href="tel:' + TEL + '">전화상담</a>' +
    '<a class="visit-popup-btn is-reserve" href="/customer">방문예약</a>' +
    '</div>' +
    '</div>' +
    '<button type="button" class="visit-popup-close">✕ 닫기</button>' +
    '</div>';

  document.body.appendChild(overlay);
  setTimeout(function () {
    overlay.classList.add('active');
  }, 100);

  function close() {
    overlay.classList.remove('active');
    try {
      sessionStorage.setItem('visitPopupClosed', '1');
    } catch (e) {}
    setTimeout(function () {
      overlay.remove();
    }, 300);
  }

  overlay.querySelector('.visit-popup-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.isConnected) close();
  });
})();
