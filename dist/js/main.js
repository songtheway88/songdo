$(function () {
    let $header = $('header'), idx = 0;

    // 풀페이지 스크롤 세팅 (휠 가로채기 없이 자연스러운 네이티브 브라우저 스크롤 지원)
    $('#fullpage').fullpage({
        navigation: false,
        autoScrolling: false,
        fitToSection: false,
        scrollBar: true,
        scrollOverflow: false,
        scrollingSpeed: 700,
        css3: true
    });

    // IntersectionObserver를 활용한 .ani 요소 스크롤 감지 애니메이션 (PC & 모바일 60fps)
    if ('IntersectionObserver' in window) {
        var aniObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('show');
                }
            });
        }, { threshold: 0.1 });
        $('.ani').each(function () {
            aniObserver.observe(this);
        });
    } else {
        $('.ani').addClass('show');
    }

    // 히어로 / 전자책 입력폼 / CONTACT 구간에서는 우측 플로팅 버튼 숨김 (입력 방해 방지)
    var $floatingWrap = $('.mobile_floating_wrap');
    var floatingHideZoneIds = ['section0', 'section_ebook', 'section3'];
    var floatingHideZoneEls = floatingHideZoneIds
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    if (floatingHideZoneEls.length && $floatingWrap.length && 'IntersectionObserver' in window) {
        var intersectingHideZones = {};
        var floatingObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                intersectingHideZones[entry.target.id] = entry.isIntersecting;
            });
            var anyHideZoneVisible = Object.keys(intersectingHideZones).some(function (id) {
                return intersectingHideZones[id];
            });
            $floatingWrap.toggleClass('show_floating', !anyHideZoneVisible);
        }, { threshold: 0.15 });
        floatingHideZoneEls.forEach(function (el) { floatingObserver.observe(el); });
    }

    // 플로팅 무료전자책 버튼 - 전자책 섹션으로 스크롤
    $('.btn_ebook').on('click', function (event) {
        if ($(this).attr('href') === '#section_ebook') {
            event.preventDefault();
            var target = document.getElementById('section_ebook');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // 네이버TV 임베드 (클릭 시 재생)
    $('.video_embed .video_play_btn').on('click', function () {
        var $embed = $(this).closest('.video_embed');
        var videoId = $embed.data('video-id');
        var $iframe = $('<iframe>', {
            src: 'https://tv.naver.com/embed/' + videoId + '?autoPlay=true',
            allow: 'autoplay; fullscreen',
            allowfullscreen: true,
            frameborder: 0
        });
        $embed.empty().append($iframe);
    });

    // 무료 전자책 다운로드 폼
    var EBOOK_DOWNLOAD_URL = 'https://docs.google.com/document/d/1jhr6sjxWCyWnk1m1MFb9VYcwwcVlH7mZRkkUyRbCltk/view';

    function sendTelegramLead(message) {
        return fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
        }).then(function(response) {
            return response.json().then(function(data) {
                if (!response.ok) {
                    throw new Error(data.error || '텔레그램 전송 실패');
                }
                return data;
            });
        });
    }

    // 분양천국 대시보드로 리드 전송 (고객DB 적재 + 텔레그램/문자 알림은 대시보드가 처리).
    // 대시보드 전송이 실패했을 때만 sendTelegramLead로 폴백해 중복 발송을 피한다.
    var EBOOK_FUNNEL_SOURCE_MAP = {
        '네이버 검색': 'naver',
        '네이버 블로그': 'naver',
        '네이버 배너광고': 'naver',
        '유튜브': 'youtube',
        '인스타그램': 'instagram',
        '페이스북': 'facebook'
    };

    function sendDashboardLead(name, phone, source) {
        var utmSource = EBOOK_FUNNEL_SOURCE_MAP[$('.ebook_source_btn.active').data('value')] || 'etc';
        return fetch('https://bunyang-dashboard.vercel.app/api/leads/intake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'baf26a49282944188052d00aaca7372e'
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                message: '전자책 신청 / 유입경로: ' + source,
                utm_source: utmSource
            })
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('대시보드 접수 실패: ' + response.status);
            }
        });
    }

    $('.ebook_source_btn').on('click', function () {
        $('.ebook_source_btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#ebook_privacy_link').on('click', function () {
        $('#ebook_privacy_box').toggleClass('show');
    });

    var ebookAgreeTouchHandledAt = 0;

    function toggleEbookAgreement(event) {
        if ($(event.target).closest('#ebook_privacy_link').length) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        var checkbox = document.getElementById('ebook_agree_check');
        if (!checkbox) {
            return;
        }

        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        ebookAgreeTouchHandledAt = Date.now();
    }

    $('#ebook_agree_check, .ebook_agree_label').on('touchend', toggleEbookAgreement);
    $('#ebook_agree_check, .ebook_agree_label').on('click', function (event) {
        if (Date.now() - ebookAgreeTouchHandledAt < 500) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    });

    $('#ebook_form').on('submit', function (event) {
        event.preventDefault();

        var name = $('#ebook_name').val().trim();
        var phone = $('#ebook_phone').val().trim();
        var agreed = $('#ebook_agree_check').is(':checked');

        if (!name) {
            alert('이름을 입력해 주세요.');
            return;
        }
        if (!phone) {
            alert('연락처를 입력해 주세요.');
            return;
        }
        if (!agreed) {
            alert('개인정보 수집 및 이용에 동의해 주세요.');
            return;
        }

        var $activeSource = $('.ebook_source_btn.active');
        var source = $activeSource.length ? $activeSource.data('value') : '미선택';
        var sourceEtc = $('#ebook_source_etc').val().trim();
        if (sourceEtc) {
            source += ' (' + sourceEtc + ')';
        }

        var message = '🔔 [송도 한내들 센트럴리버] (전자책 유입)\n\n' +
            '👤 이름: ' + name + '\n' +
            '📞 연락처: ' + phone + '\n' +
            '🧭 유입경로: ' + source + '\n' +
            '⏰ 신청시간: ' + new Date().toLocaleString('ko-KR');

        var $submitBtn = $('.ebook_submit');
        var originalText = $submitBtn.text();
        $submitBtn.text('전송 중...').prop('disabled', true);

        sendDashboardLead(name, phone, source)
            .then(function () {
                alert('무료 전자책 신청이 완료되었습니다.\n확인을 누르시면 다운로드 페이지로 이동합니다.');
                window.location.href = EBOOK_DOWNLOAD_URL;
            })
            .catch(function (dashboardErr) {
                console.error('대시보드 리드 전송 실패, 텔레그램 직접 발송으로 폴백:', dashboardErr);
                return sendTelegramLead(message)
                    .then(function () {
                        alert('무료 전자책 신청이 완료되었습니다.\n확인을 누르시면 다운로드 페이지로 이동합니다.');
                        window.location.href = EBOOK_DOWNLOAD_URL;
                    })
                    .catch(function (error) {
                        console.error('텔레그램 전송 실패:', error);
                        alert('전송 중 오류가 발생했습니다. 다시 시도해 주세요.');
                    });
            })
            .finally(function () {
                $submitBtn.text(originalText).prop('disabled', false);
            });
    });
});
