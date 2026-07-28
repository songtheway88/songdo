$(function () {
    let $header = $('header'), idx = 0;
    let isNormalScrollSection = false;

    // 반응형 체크 함수
    function checkResponsive() {
        return $(window).width() <= 1110;
    }

    // 풀페이지 스크롤 제어 함수
    function handleScrollMode() {
        var isMobile = checkResponsive();

        if (isMobile) {
            if (!isNormalScrollSection) {
                $.fn.fullpage.setAutoScrolling(false);
                $.fn.fullpage.setFitToSection(false);
                // 모바일에서는 모든 섹션의 fullpage 스크롤 강제를 끄고 자연스러운 일반 스크롤로 해제
                $('.section').css({
                    'height': 'auto',
                    'min-height': '100vh',
                    'overflow-y': 'visible'
                });
                isNormalScrollSection = true;
            }
        } else {
            if (isNormalScrollSection) {
                $.fn.fullpage.setAutoScrolling(true);
                $.fn.fullpage.setFitToSection(true);
                // 스타일 초기화
                $('.section').css({
                    'height': '',
                    'min-height': '',
                    'overflow-y': ''
                });
                isNormalScrollSection = false;
            }
        }
    }

    $('#fullpage').fullpage({
        navigation: false,
        scrollingSpeed: 1000,
        autoScrolling: true,
        fitToSection: true,
        scrollBar: false,
        scrollOverflow: true,
        responsiveHeight: 600,
        normalScrollElements: '.schedule_list_wrap',


        afterLoad: function (anchorLink, index) {
            idx = index - 1; // 2.9.x에서는 1부터 시작
            $('.section').eq(idx).find('.ani').each(function (i) {
                var $el = $(this);
                setTimeout(function () {
                    $el.addClass('show');
                }, i * 200);
            });

            // 스크롤 모드 체크
            handleScrollMode();
        },
        onLeave: function (index, nextIndex, direction) {
            $('.section').eq(index - 1).find('.ani').removeClass('show');
        }
    });

    // 윈도우 리사이즈 이벤트
    $(window).resize(function () {
        handleScrollMode();
    });

    // 초기 로드시 체크
    handleScrollMode();

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
            if (isNormalScrollSection) {
                document.getElementById('section_ebook').scrollIntoView({ behavior: 'smooth' });
            } else {
                $.fn.fullpage.moveTo('section_ebook');
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

    // ⚠️ 텔레그램 연동 설정 (customer.html과 동일한 봇/고정 수신자 사용)
    var TELEGRAM_BOT_TOKEN = '8940934508:AAGY8fXpECknMdoF6HK3pVydUUKZmy3nR04';
    var FIXED_CHAT_IDS = ['8753795118', '8849368033']; // 관리자 + 영업사원 등 항상 수신할 Chat ID 목록

    function sendTelegramLead(message) {
        var getUpdatesUrl = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/getUpdates';

        return fetch(getUpdatesUrl)
            .then(function (response) { return response.json(); })
            .then(function (data) {
                var chatIds = new Set();
                FIXED_CHAT_IDS.forEach(function (id) { chatIds.add(String(id)); });

                if (data.ok && data.result) {
                    data.result.forEach(function (item) {
                        if (item.message && item.message.chat) {
                            chatIds.add(String(item.message.chat.id));
                        } else if (item.my_chat_member && item.my_chat_member.chat) {
                            chatIds.add(String(item.my_chat_member.chat.id));
                        }
                    });
                }

                var sendUrl = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
                var sendPromises = Array.from(chatIds).map(function (chatId) {
                    return fetch(sendUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: message })
                    });
                });

                return Promise.all(sendPromises);
            });
    }

    $('.ebook_source_btn').on('click', function () {
        $('.ebook_source_btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#ebook_privacy_link').on('click', function () {
        $('#ebook_privacy_box').toggleClass('show');
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

        sendTelegramLead(message).catch(function (error) {
            console.error('텔레그램 전송 실패:', error);
        });

        window.open(EBOOK_DOWNLOAD_URL, '_blank');
    });
});