// 메인 페이지 리드 입력 폼 (상단 관심고객등록 / 하단 방문예약)
// 전송 경로는 customer.html 과 동일: 분양천국 대시보드 → 실패 시 /api/submit(텔레그램) 폴백
(function () {
  var DASHBOARD_URL = 'https://bunyang-dashboard.vercel.app/api/leads/intake';
  var DASHBOARD_KEY = 'baf26a49282944188052d00aaca7372e';
  var FUNNEL_SOURCE_MAP = {
    '네이버검색': 'naver',
    '네이버블로그': 'naver',
    '인스타그램': 'instagram',
    '유튜브': 'youtube',
    '페이스북': 'facebook',
    '구글검색': 'google'
  };

  function urlUtmSource() {
    try {
      return new URLSearchParams(window.location.search).get('utm_source') || '';
    } catch (e) {
      return '';
    }
  }

  function sendDashboard(lead) {
    return fetch(DASHBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': DASHBOARD_KEY },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        pyeong_type: lead.type,
        message: lead.label + ' / 이메일: ' + lead.email + ' / 유입경로: ' + lead.funnel,
        utm_source: lead.utmSource
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('대시보드 접수 실패: ' + res.status);
    });
  }

  function sendTelegram(lead) {
    var text = '🔔 [송도 한내들 센트럴리버] (' + lead.label + ')\n\n' +
      '👤 이름: ' + lead.name + '\n' +
      '📞 연락처: ' + lead.phone + '\n' +
      '✉️ 이메일: ' + lead.email + '\n' +
      '🏠 관심타입: ' + lead.type + '\n' +
      '🧭 유입경로: ' + lead.funnel + '\n' +
      '⏰ 신청시간: ' + new Date().toLocaleString('ko-KR');
    return fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || '전송 중 오류가 발생했습니다.');
      });
    });
  }

  function bind(form) {
    var label = form.getAttribute('data-lead-label') || '메인 리드';
    var submitBtn = form.querySelector('.lead_submit');
    var etcInput = form.querySelector('.lead_funnel_etc');
    var privacyToggle = form.querySelector('.lead_privacy_toggle');
    var privacyBox = form.querySelector('.lead_privacy_box');

    if (privacyToggle && privacyBox) {
      privacyToggle.addEventListener('click', function () {
        privacyBox.classList.toggle('is-open');
      });
    }

    if (etcInput) {
      form.querySelectorAll('input[name="funnel"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
          var isEtc = radio.value === '기타' && radio.checked;
          etcInput.classList.toggle('is-open', isEtc);
          if (!isEtc) etcInput.value = '';
        });
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = (form.elements.name.value || '').trim();
      var phone = (form.elements.phone.value || '').trim();
      var type = form.elements.type ? form.elements.type.value : '';
      var email = form.elements.email ? (form.elements.email.value || '').trim() : '';
      var funnelRadio = form.querySelector('input[name="funnel"]:checked');
      var hasFunnel = !!form.querySelector('input[name="funnel"]');

      if (!name) return alert('이름을 입력해 주세요.');
      if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ''))) return alert('연락처를 정확히 입력해 주세요. (예: 010-1234-5678)');
      if (!type) return alert('관심 타입을 선택해 주세요.');
      if (hasFunnel && !funnelRadio) return alert('유입경로를 선택해 주세요.');
      if (!form.elements.agree.checked) return alert('개인정보 수집 및 이용에 동의해 주세요.');

      var funnel = funnelRadio ? funnelRadio.value : '미선택';
      if (funnel === '기타') funnel = '기타 (' + ((etcInput && etcInput.value.trim()) || '내용 미입력') + ')';

      var lead = {
        label: label,
        name: name,
        phone: phone,
        type: type,
        email: email || '입력 안 함',
        funnel: funnel,
        utmSource: urlUtmSource() || (funnelRadio && FUNNEL_SOURCE_MAP[funnelRadio.value]) || 'etc'
      };

      var originalText = submitBtn.textContent;
      submitBtn.textContent = '전송 중...';
      submitBtn.disabled = true;

      function done() {
        alert(label.indexOf('방문예약') > -1
          ? '방문예약 신청이 완료되었습니다. 담당자가 곧 연락드리겠습니다.'
          : '관심고객 등록이 완료되었습니다. 분양 소식을 가장 먼저 안내해 드리겠습니다.');
        form.reset();
        if (etcInput) etcInput.classList.remove('is-open');
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form: label });
      }

      sendDashboard(lead)
        .then(done)
        .catch(function (dashboardErr) {
          console.error('대시보드 리드 전송 실패, 텔레그램 직접 발송으로 폴백:', dashboardErr);
          return sendTelegram(lead).then(done).catch(function (err) {
            console.error('텔레그램 전송 실패:', err);
            alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도하시거나 1688-5535로 전화 주세요.');
          });
        })
        .then(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }

  function init() {
    document.querySelectorAll('form.lead_form').forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
