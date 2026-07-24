# 송도 한내들 센트럴리버 클론 프로젝트 (벤치마킹)

본 프로젝트는 `https://sd.hndapt.co.kr/` 홈페이지를 벤치마킹하여 동일한 레이아웃과 기능을 재현한 프런트엔드 웹사이트 템플릿입니다.

사용자의 요청에 따라 모든 사진(이미지)란은 레이아웃 확보를 위해 **원래 파일명이 기입된 회색 박스(SVG Placeholder)**로 대체되어 있습니다.

---

## 🛠️ 시작하기

본 프로젝트는 최신 **Vite** 개발 환경으로 구성되어 로컬에서 빠른 속도로 개발 및 미리보기가 가능합니다.

### 1. 패키지 설치
프로젝트 루트 폴더에서 아래 명령어를 실행하여 필요한 패키지를 설치합니다.
```bash
npm install
```

### 2. 개발 서버 구동 (실시간 미리보기)
로컬 개발 서버를 실행하면 `http://localhost:3000` 주소로 사이트가 즉시 열립니다.
```bash
npm run dev
```

### 3. 프로덕션 빌드 (배포용 파일 생성)
빌드 명령어를 수행하면 최적화된 파일들이 `dist/` 폴더에 생성됩니다.
```bash
npm run build
```

---

## 🖼️ 이미지 교체 및 덮어쓰기 가이드

회색 박스로 채워진 부분에 사용자가 원하는 사진을 넣으려면, 프로젝트 폴더 내에 `img/` 폴더를 생성하고 해당 회색 박스에 표시된 파일명과 **동일한 이름(확장자 포함)**으로 이미지를 저장하시면 됩니다.

### 주요 페이지별 필요 이미지 리스트

1. **메인 페이지 (`index.html`)**
   - `img/logo1.png` - 헤더 좌측 로고
   - `img/location1.png`, `location2.png`, `location3.png` - 입지 소개 이미지 3종
   - `img/premium1.png` ~ `premium6.png` - 프리미엄 특장점 카드 6종
   - `img/main_commu_01.jpg` ~ `main_commu_04.jpg` - 커뮤니티 시설 (피트니스, 골프 등) 이미지 4종

2. **사업안내 (`planning.html`, `brand.html`, `location.html`, `contact.html`)**
   - `img/sub_planning.jpg` - 사업개요 상세표 및 투시도 이미지
   - `img/sub_brand.jpg` - 유승건설 브랜드 아이덴티티 이미지
   - `img/sub_location.jpg` - 입지환경 상세 약도/지도 이미지
   - `img/sub_contact.jpg` - 모델하우스 및 현장 오시는 길 상세 이미지

3. **단지안내 (`complex.html`, `position.html`, `communuty.html`, `mobile_communication.html`)**
   - `img/sub_complex.jpg` - 단지 배치도 조감도
   - `img/sub_position.jpg` - 동호수 배치 현황판 이미지
   - `img/sub_community.jpg` - 커뮤니티 평면 및 시설 상세 이미지
   - `img/sub_mobile.jpg` - 구내이동통신 안내 상세문

4. **평면안내 (`unit_84a.html` ~ `unit_84pb.html`)**
   - `img/unit_84a_plan.jpg` ~ `unit_84pb_plan.jpg` - 각 타입별 평면도면
   - `img/unit_84a_iso.jpg` ~ `unit_84pb_iso.jpg` - 각 타입별 입체 투시도(아이소메트릭)

---

## 🔗 기능 구성 요소 정보

- **FullPage Scroll**: 메인 페이지는 마우스 휠 동작에 따라 화면이 슬라이드처럼 상하로 넘어갑니다.
- **Vimeo Popup**: 첫 진입 시 동영상 오버레이 팝업(`pop_pr`)이 구동되며, '영상닫기' 클릭 시 닫힙니다.
- **e모델하우스(VR)**: `vr01.html` 및 `vr02.html` 에서는 상단 탭을 통해 거실, 주방, 안방 등 VR 가상 투어 뷰어용 레이아웃이 연동되어 작동합니다.
- **관심고객등록 (`customer.html`)**: 원본 사이트와 동일한 수집 항목(이름, 연락처, 개인정보 수집동의 등)의 입력 양식을 지원합니다.
