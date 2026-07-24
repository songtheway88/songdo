$(document).ready(function () {
    // 풀메뉴 버튼
    $(".full_menu_btn button").off('click').on('click', function () {
        $('body').toggleClass('full_menu_on');
        console.log('풀메뉴 버튼 클릭됨');
    });

    // 모바일 반응형 : response_img 클래스가 있을 경우
    // 이미지 파일명 앞에 m_가 붙은 이미지로 교체
    function updateImages() {
        if ($('.response_img').length > 0) {
            $('.response_img').each(function () {
                var $img = $(this);
                var src = $img.attr('src');
                if (src) {
                    var filename = src.substring(src.lastIndexOf('/') + 1);
                    var path = src.substring(0, src.lastIndexOf('/') + 1);
                    var mo_filename = 'm_' + filename;
                    if ($(window).width() <= 1080 && filename.indexOf('m_') == -1) {
                        $img.attr('src', path + mo_filename);
                    } else if ($(window).width() > 1080 && filename.indexOf('m_') > -1) {
                        var pc_filename = filename.replace('m_', '');
                        $img.attr('src', path + pc_filename);
                    }
                }
            });
        }
    }
    // 아이폰 대응
    document.addEventListener("DOMContentLoaded", function () {
        // iPhone Safari 감지
        const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
        if (!isIOS) return;

        // 아이폰일 때만 하이픈 교체 (전화번호 자동 감지 방지)
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
            a.innerHTML = a.innerHTML.replace(/1688-5535/, '1660&#8209;1109');
        });
    });


    updateImages();

    // iframe 높이 자동 조절
    window.resizeIframe = function (obj) {
        if (!obj || (!$(obj).prop('contentDocument') && !$(obj).prop('contentWindow'))) {
            return;
        }

        try {
            var $iframe = $(obj);
            var doc = $iframe.prop('contentDocument') || $iframe.prop('contentWindow').document;
            var $body = $(doc.body);
            var $html = $(doc.documentElement);

            if (!$body.length || !$html.length) return;

            // 깜박임 방지를 위해 visibility로 숨기기
            var originalVisibility = $iframe.css('visibility');
            $iframe.css('visibility', 'hidden');

            // 높이를 0으로 설정하여 정확한 높이 측정
            $iframe.css('height', '0px');

            var h = Math.max(
                $html.prop('scrollHeight'), $body.prop('scrollHeight'),
                $html.prop('offsetHeight'), $body.prop('offsetHeight'),
                $html.prop('clientHeight'), $body.prop('clientHeight')
            );

            // 새로운 높이 설정
            $iframe.css('height', h + 'px');

            // 높이가 변경되었을 때만 visibility 복원
            setTimeout(function () {
                $iframe.css('visibility', originalVisibility || 'visible');
            }, 10);

        } catch (error) {
            console.warn('iframe 크기 조정 중 오류:', error);
            // 오류 시 visibility 복원
            $(obj).css('visibility', 'visible');
        }
    };

    // 모바일 토글 메뉴 (하나 열리면 나머지 닫힘)
    $(document)
        .off('click', '.full_menu_wrap > ul > li > a')
        .on('click', '.full_menu_wrap > ul > li > a', function (e) {

            var $li = $(this).parent();
            var $sub = $li.children('.depth2');

            // 서브메뉴가 없으면 기본 이동
            if (!$sub.length) return;

            e.preventDefault();

            // 현재 li 외의 다른 메뉴들 닫기
            $li
                .siblings('li')
                .children('.depth2:visible')
                .stop(true, true)
                .slideUp(300);

            // 현재 메뉴 토글
            $sub.stop(true, true).slideToggle(300);
        });
});

