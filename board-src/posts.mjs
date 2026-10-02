// 분양소식 게시판 데이터 진입점
// 새 글 추가: posts-2.mjs 배열에 객체를 추가하고 `npm run board` (또는 npm run build) 실행
import { posts1 } from './posts-1.mjs';
import { posts2 } from './posts-2.mjs';

export const SITE = {
  name: '송도 한내들 센트럴리버',
  base: 'https://www.xn--220b21dzyav3g4uc2wgs8j8wak70jbsf.shop',
  tel: '1688-5535',
  staticLastmod: '2026-10-02',
};

export const posts = [...posts1, ...posts2];
