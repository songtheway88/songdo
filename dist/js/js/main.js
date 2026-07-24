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
        var currentSection = $('.section').eq(idx);
        var hasNormalScrollClass = currentSection.hasClass('normal-scroll'); // 특정 클래스명

        if (isMobile && hasNormalScrollClass) {
            if (!isNormalScrollSection) {
                $.fn.fullpage.setAutoScrolling(false);
                $.fn.fullpage.setFitToSection(false);
                // 해당 섹션에 스크롤바 표시
                currentSection.css({
                    'height': 'auto',
                    'min-height': '100vh',
                    'overflow-y': 'auto'
                });
                isNormalScrollSection = true;
            }
        } else {
            if (isNormalScrollSection) {
                $.fn.fullpage.setAutoScrolling(true);
                $.fn.fullpage.setFitToSection(true);
                // 스타일 초기화
                $('.section.normal-scroll').css({
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
});