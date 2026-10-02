// 분양소식 게시판 정적 생성기
// board-src/posts.mjs → board/index.html, board/<slug>/index.html, public/sitemap.xml, public/rss.xml, public/robots.txt
// 사용: npm run board  (npm run build 시 자동 실행)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE, posts } from '../board-src/posts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = SITE.base;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ymd = (iso) => iso.slice(0, 10);
const dotDate = (iso) => ymd(iso).replace(/-/g, '.');
const textLen = (html) => html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, '').length;
const postUrl = (p) => `${BASE}/board/${p.slug}`;

// ---------- 검증 ----------
const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
const slugs = new Set();
for (const p of posts) {
  if (slugs.has(p.slug)) throw new Error(`중복 slug: ${p.slug}`);
  slugs.add(p.slug);
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`slug는 영문 소문자/숫자/하이픈만: ${p.slug}`);
  if (p.title.length > 60) throw new Error(`title 60자 초과(${p.title.length}): ${p.title}`);
  if (!p.title.startsWith(SITE.name)) throw new Error(`title은 현장명으로 시작: ${p.title}`);
  const len = textLen(p.body);
  if (len < 1500) throw new Error(`본문 1,500자 미만(${len}자): ${p.slug}`);
  if (p.related.length !== 3) throw new Error(`관련글 3개 필요: ${p.slug}`);
  p._len = len;
}
for (const p of posts) for (const r of p.related) if (!slugs.has(r)) throw new Error(`관련글 slug 없음: ${p.slug} → ${r}`);
const descs = new Set(posts.map((p) => p.description));
if (descs.size !== posts.length) throw new Error('meta description 중복');

// ---------- 공통 조각 ----------
const NAV = `<ul class="depth1">
<li class="__board"><a href="/board" target="_self">분양소식</a></li>
<li><a href="/supply" target="_self">분양안내</a>
<ul class="depth2">
<li><a href="/supply" target="_self">공급안내</a></li>
<li><a href="/gonggo" target="_self">모집공고</a></li>
<li><a href="/document01" target="_self">계약안내문</a></li>
<li><a href="/stampduty" target="_self">인지세안내</a></li>
<li><a href="/report" target="_self">자금조달계획서</a></li>
</ul>
</li>
<li><a href="/board/model-house" target="_self">모델하우스</a></li>
<li><a href="/customer" target="_self">관심고객등록</a></li>
</ul>`.replace(' class="__board"', ' class="active"');

const TRACKING_HEAD = `  <!-- Meta Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '3178709688982142');
    fbq('track', 'PageView');
  </script>
  <!-- End Meta Pixel Code -->`;

const TRACKING_BODY = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17692240151"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'AW-17692240151');
    gtag('config', 'G-E55B5ZVJT0');
</script>
<!-- 네이버 애널리틱스 -->
<script src="//wcs.pstatic.net/wcslog.js" type="text/javascript"></script>
<script type="text/javascript">
    if (!wcs_add) var wcs_add = {};
    wcs_add["wa"] = "15684ae74680680";
    if (window.wcs) {
        wcs_do();
    }
</script>`;

function layout({ title, description, canonical, ogType, image, jsonld, main, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="naver-site-verification" content="83d0d23ba3e7259b95d7d20bb32add1295379a97" />
${TRACKING_HEAD}
<meta content="telephone=no" name="format-detection"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>${esc(title)}</title>
<meta content="${esc(description)}" name="description"/>
<link href="${canonical}" rel="canonical"/>
<meta content="index, follow" name="robots"/>
<meta content="${ogType}" property="og:type"/>
<meta content="ko_KR" property="og:locale"/>
<meta content="${esc(SITE.name)}" property="og:site_name"/>
<meta content="${esc(title)}" property="og:title"/>
<meta content="${esc(description)}" property="og:description"/>
<meta content="${canonical}" property="og:url"/>
<meta content="${image}" property="og:image"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${esc(title)}" name="twitter:title"/>
<meta content="${esc(description)}" name="twitter:description"/>
<meta content="${image}" name="twitter:image"/>
<link href="${BASE}/rss.xml" rel="alternate" title="${esc(SITE.name)} 분양소식" type="application/rss+xml"/>
${extraHead}<link href="/img/favicon.png" rel="icon" type="image/png"/>
<link crossorigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet"/>
<link href="/css/reset.css" rel="stylesheet"/>
<link href="/css/common.css" rel="stylesheet"/>
<link href="/css/style.css" rel="stylesheet"/>
<link href="/css/board.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<script src="/js/common.js"></script>
<script type="application/ld+json">${JSON.stringify(jsonld, null, 2)}</script>
</head>
<body>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=3178709688982142&ev=PageView&noscript=1" alt=""/></noscript>
<header>
<div>
<div class="header_left_wrap">
<a href="https://hndapt.co.kr" target="_blank" rel="noopener"><img alt="유승종합건설 한내들" src="/img/favicon.webp" width="44" height="44"/></a>
<span class="header_open">GRAND OPEN</span>
</div>
<p class="site_logo txt_hide"><a href="/">${esc(SITE.name)}</a></p>
<ul class="right">
<li>
<a href="tel:${SITE.tel.replace(/-/g, '')}">
<img alt="전화 아이콘" src="/img/tel-ico.webp" width="20" height="20"/>
<span>${SITE.tel}</span>
</a>
</li>
<li class="customer">
<a href="/customer">방문예약</a>
</li>
</ul>
</div>
<nav>
${NAV}
</nav>
<div class="header_menu_wrap">
${NAV}
</div>
</header>
<div class="full_menu_btn">
<button type="button" aria-label="전체메뉴">
<span></span>
<span></span>
<span></span>
</button>
</div>
<div class="full_menu_wrap">
${NAV}
</div>
<div class="sub_visual"></div>
<div class="s_menu">
<div class="rel_wrap">
<p class="s_menu_title">분양소식</p>
<ul class="depth2">
<li class="active"><a href="/board" target="_self">분양소식</a></li>
<li><a href="/board/model-house" target="_self">모델하우스</a></li>
<li><a href="/board/faq" target="_self">자주 묻는 질문</a></li>
<li><a href="/customer" target="_self">관심고객등록</a></li>
</ul>
</div>
</div>
<div class="sub_content">
${main}
</div>
<!-- 🔹 Footer -->
<footer class="section fp-auto-height" id="section4">
<div class="footer_logo">
<img alt="${esc(SITE.name)} 로고" src="/img/footer-logo.webp"/>
</div>
<ul>
<li>광고대행 : 바이럴러스 대표 : 송덕일 | 사업자등록번호 : 302-08-96000 | 관리자 연락처 010-4487-4468 | 이메일 Viralers@naver.com</li>
</ul>
<p class="footer_txt_type"><span>총 501세대</span> (전 세대 전용 84㎡) </p>
<p class="footer_links"><a href="/board">분양소식</a><span>·</span><a href="/board/model-house">모델하우스 안내</a><span>·</span><a href="/customer">관심고객등록</a><span>·</span><a href="tel:${SITE.tel}">대표번호 ${SITE.tel}</a></p>
<ul class="disclaimer">
<li>※ 본 웹사이트의 CG, 사진, 일러스트 등은 소비자의 이해를 돕기 위해 제작된 것으로 실제와 다소 차이가 있을 수 있습니다.</li>
<li>※ 본 웹사이트는 제작, 편집, 인쇄과정상 오류가 있을 수 있으니, 중요사항 및 세부사항은 견본주택에 문의하시기 바랍니다.</li>
</ul>
<p class="copyright">
        COPYRIGHT ⓒ <b>${esc(SITE.name)}. </b> ALL RIGHTS RESERVED.
    </p>
</footer>
${TRACKING_BODY}
<div class="mobile_floating_wrap">
<div class="floating_btn_list">
<a aria-label="분양상담" class="floating_btn btn_phone" href="tel:${SITE.tel}">
<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
</a>
<a aria-label="무료전자책" class="floating_btn btn_ebook" href="/#section_ebook">
<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
</a>
<a aria-label="방문예약" class="floating_btn btn_reserve" href="/customer">
<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><rect height="4" rx="1" ry="1" width="8" x="8" y="2"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path></svg>
</a>
</div>
</div>
<div class="mobile_bottom_bar">
<a class="bottom_bar_item" href="/customer">방문예약</a>
<a class="bottom_bar_item" href="tel:${SITE.tel}">전화상담</a>
</div>
</body>
</html>
`;
}

const ORG = {
  '@type': 'Organization',
  '@id': `${BASE}/#organization`,
  name: SITE.name,
  url: `${BASE}/`,
  telephone: SITE.tel,
  logo: { '@type': 'ImageObject', url: `${BASE}/img/og_image.jpg` },
};

// ---------- 글 페이지 ----------
const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));

function postPage(p) {
  const url = postUrl(p);
  const img = p.image;
  const imgAbs = `${BASE}/img/og_image.jpg`;
  const related = p.related.map((s) => bySlug[s]);
  const main = `<article class="post_wrap">
<nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href="/board">분양소식</a><span>›</span>${esc(p.keyword)}</nav>
<h1>${esc(p.h1 || p.title)}</h1>
<div class="post_meta"><span>공지</span><time datetime="${p.date}">${dotDate(p.date)}</time><span>대표번호 <a href="tel:${SITE.tel}">${SITE.tel}</a></span></div>
<figure class="post_figure">
<img src="${img.src}" alt="${esc(img.alt)}" width="${img.w}" height="${img.h}" loading="eager" decoding="async"/>
<figcaption>${esc(img.caption || img.alt)}</figcaption>
</figure>
<div class="post_body">
${p.body.trim()}
</div>
<p class="post_note">※ 본 글은 2025년 작성된 ${esc(SITE.name)} 영업교육자료와 공공기관 공개자료를 바탕으로 정리한 참고용 안내입니다. 계획·예정 사항은 관계기관 사정에 따라 변경될 수 있으며, 분양가·일정·자격 등 최종 내용은 입주자모집공고와 견본주택 안내가 우선합니다. <span class="need_check">[확인 필요]</span> 표시는 공식 자료로 재확인이 필요한 항목입니다.</p>
<section class="post_cta">
<strong>${esc(p.ctaTitle || '궁금한 내용은 전화 한 통으로 확인하세요')}</strong>
<p>상담 예약을 남기시면 담당자가 일정과 세부 조건을 안내해 드립니다. 대표번호 ${SITE.tel}</p>
<div class="post_cta_btns">
<a class="btn_tel" href="tel:${SITE.tel}">📞 ${SITE.tel} 전화상담</a>
<a class="btn_form" href="/customer">방문예약·상담신청</a>
<a class="btn_home" href="/">메인 페이지 보기</a>
</div>
</section>
<section class="related_posts">
<h2>함께 보면 좋은 글</h2>
<ul>
${related.map((r) => `<li><a href="/board/${r.slug}">${esc(r.title)}</a></li>`).join('\n')}
</ul>
</section>
<div class="post_nav_list"><a href="/board">목록으로</a></div>
</article>`;

  const graph = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: p.title,
      description: p.description,
      image: [imgAbs],
      datePublished: p.date,
      dateModified: p.modified || p.date,
      inLanguage: 'ko-KR',
      author: { '@id': `${BASE}/#organization` },
      publisher: { '@id': `${BASE}/#organization` },
      mainEntityOfPage: url,
      keywords: [SITE.name, p.keyword].join(', '),
    },
    ORG,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: '분양소식', item: `${BASE}/board` },
        { '@type': 'ListItem', position: 3, name: p.keyword, item: url },
      ],
    },
  ];
  if (p.faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }

  return layout({
    title: p.title,
    description: p.description,
    canonical: url,
    ogType: 'article',
    image: imgAbs,
    jsonld: { '@context': 'https://schema.org', '@graph': graph },
    extraHead: `<meta content="${p.date}" property="article:published_time"/>\n<meta content="${p.modified || p.date}" property="article:modified_time"/>\n`,
    main,
  });
}

// ---------- 목록 페이지 ----------
function listPage() {
  const url = `${BASE}/board`;
  const title = `${SITE.name} 분양소식 | 공지·모델하우스·분양 정보 모음`;
  const description = `${SITE.name} 분양소식 게시판. 모델하우스 위치, 분양가, 84㎡ 타입별 평면, 입주시기, 교통·학군·시세비교 등 공지 ${posts.length}건을 최신순으로 확인하세요. 대표번호 ${SITE.tel}`;
  const rows = sorted
    .map(
      (p) => `<tr>
<td class="col_notice"><span class="notice_badge">공지</span></td>
<td class="col_title"><a href="/board/${p.slug}">${esc(p.title)}</a><span>${esc(p.summary)}</span></td>
<td class="col_date"><time datetime="${p.date}">${dotDate(p.date)}</time></td>
</tr>`
    )
    .join('\n');
  const main = `<section class="board_wrap">
<div class="board_head">
<h1>${esc(SITE.name)} 분양소식</h1>
<p>총 ${posts.length}건 · 최신순</p>
</div>
<table class="board_table">
<caption class="txt_hide">${esc(SITE.name)} 분양소식 공지 목록</caption>
<thead>
<tr><th class="col_notice" scope="col">공지</th><th scope="col">제목</th><th class="col_date" scope="col">날짜</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<section class="post_cta">
<strong>원하는 정보를 찾지 못하셨나요?</strong>
<p>상담 예약을 남기시거나 대표번호로 문의해 주세요. 대표번호 ${SITE.tel}</p>
<div class="post_cta_btns">
<a class="btn_tel" href="tel:${SITE.tel}">📞 ${SITE.tel} 전화상담</a>
<a class="btn_form" href="/customer">방문예약·상담신청</a>
<a class="btn_home" href="/">메인 페이지 보기</a>
</div>
</section>
</section>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'ko-KR',
        isPartOf: { '@id': `${BASE}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: postUrl(p), name: p.title })),
        },
      },
      ORG,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: '분양소식', item: url },
        ],
      },
    ],
  };
  return layout({ title, description, canonical: url, ogType: 'website', image: `${BASE}/img/og_image.jpg`, jsonld, main });
}

// ---------- sitemap / rss / robots ----------
function sitemap() {
  const latest = ymd(sorted[0].date);
  const staticPages = [
    ['/', latest, '1.0'],
    ['/board', latest, '0.9'],
    ['/customer', SITE.staticLastmod, '0.7'],
    ['/supply', SITE.staticLastmod, '0.6'],
    ['/gonggo', SITE.staticLastmod, '0.6'],
    ['/document01', SITE.staticLastmod, '0.5'],
    ['/stampduty', SITE.staticLastmod, '0.5'],
    ['/report', SITE.staticLastmod, '0.5'],
  ];
  const urls = [
    ...staticPages.map(([p, d, pr]) => ({ loc: BASE + p, lastmod: d, priority: pr })),
    ...sorted.map((p) => ({ loc: postUrl(p), lastmod: ymd(p.modified || p.date), priority: '0.8' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
}

function rfc822(iso) {
  return new Date(iso).toUTCString().replace('GMT', '+0000');
}

function rss() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE.name)} 분양소식</title>
  <link>${BASE}/board</link>
  <description>${esc(SITE.name)} 모델하우스·분양가·평면·입주·교통·학군 등 분양 공지</description>
  <language>ko</language>
  <lastBuildDate>${rfc822(sorted[0].modified || sorted[0].date)}</lastBuildDate>
  <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
${sorted
  .map(
    (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${postUrl(p)}</link>
    <guid isPermaLink="true">${postUrl(p)}</guid>
    <description>${esc(p.description)}</description>
    <category>분양소식</category>
    <pubDate>${rfc822(p.date)}</pubDate>
  </item>`
  )
  .join('\n')}
</channel>
</rss>
`;
}

const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /bds_admin/

Sitemap: ${BASE}/sitemap.xml
`;

// ---------- 쓰기 ----------
const write = (rel, content) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};

// 사라진 글 폴더 정리 (board 하위만)
const boardDir = path.join(ROOT, 'board');
if (fs.existsSync(boardDir)) {
  for (const d of fs.readdirSync(boardDir, { withFileTypes: true })) {
    if (d.isDirectory() && !slugs.has(d.name)) fs.rmSync(path.join(boardDir, d.name), { recursive: true });
  }
}

write('board/index.html', listPage());
for (const p of posts) write(`board/${p.slug}/index.html`, postPage(p));
write('public/sitemap.xml', sitemap());
write('public/rss.xml', rss());
write('public/robots.txt', robots);

console.log(`board: ${posts.length}개 글 생성`);
for (const p of sorted) console.log(`  ${String(p._len).padStart(5)}자  ${String(p.title.length).padStart(2)}  /board/${p.slug}`);
