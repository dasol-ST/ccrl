# CCRL 홈페이지 (Climate Crisis Response Lab)

공개 주소: https://dasol-st.github.io/ccrl/

이 저장소는 GitHub Pages로 게시되는 CCRL 홈페이지 소스입니다. **`master` 브랜치의 `docs/` 폴더**가 그대로 인터넷에 공개됩니다.

- 2026-11 리디자인: 기존 Jekyll(Grayscale 테마) 사이트를 정적 사이트로 교체했습니다. 이전 사이트는 `legacy-jekyll` 태그로 보존되어 있습니다.
- 출발점: 2026-10-27 ChatGPT Sites에서 만든 홈페이지 키트(Sites 저장 버전 19, 소스 커밋 `5108e9fee9414fd275d2acd88846d3708efcbb1a`)
- 구성: HTML + CSS + 브라우저 JavaScript + JSON + 로컬 미디어
- 프레임워크, npm 의존성 설치, 빌드, API 키, 데이터베이스가 필요하지 않습니다.
- **웹사이트의 문구는 영어로 유지합니다.** 이 README는 작업자를 위해 한국어로 작성했습니다.

## 0. 자주 하는 수정 (GitHub 웹에서 바로 하기)

프로그램 설치 없이 GitHub 웹사이트에서 수정할 수 있습니다. `master`에 저장(Commit)하면 1~2분 뒤 공개 사이트에 반영됩니다.

**공통 방법:** 저장소(https://github.com/dasol-ST/ccrl)에서 파일을 열고 연필 아이콘(Edit) → 수정 → 오른쪽 위 **Commit changes** → 메시지 작성 후 Commit.

> `content.json`은 형식이 엄격합니다. 따옴표 `"`, 쉼표 `,`, 중괄호 `{ }`를 빠뜨리거나 마지막 항목 뒤에 쉼표를 남기면 **연구·인원·논문이 모두 사라집니다.** 기존 항목을 통째로 복사해 값만 바꾸는 방식을 권장합니다. 사이트가 비어 보이면 직전 수정을 되돌리면 됩니다(History → 이전 버전 확인).

### 구성원 추가·수정·삭제 — `docs/assets/content.json`의 `"members"`

```json
{
  "name": "Gildong Hong",
  "role": "MS. Student",
  "field": "Climate Risk Assessment",
  "email": "gildong@seoultech.ac.kr",
  "image": "assets/member-8.jpg"
},
```

- 화면 순서 = 목록 순서(교수님은 `"professor"`에 따로 있고 항상 맨 앞).
- 삭제(졸업 등): 해당 `{ … },` 블록 전체를 지웁니다. 목록의 **마지막** 항목 뒤에는 쉼표가 없어야 합니다.
- 사진: `docs/assets` 폴더에서 **Add file → Upload files**로 올린 뒤 `"image"`에 파일명을 적습니다. 세로가 약간 긴 정사각형(약 1:1.08)으로 잘려 보이며 얼굴은 위쪽 25% 지점 기준으로 맞춰집니다. 600×650px 정도, 300KB 이하 JPG를 권장합니다. 사진이 없으면 `"assets/member-placeholder.jpg"`.
- 파일명은 영문·숫자·하이픈만 사용합니다(공백·한글 X).

### 논문 추가 — `docs/assets/content.json`의 `"publications"`

최신 논문을 목록 **맨 위**에 추가합니다.

```json
{
  "year": 2026,
  "title": "출판된 제목 그대로",
  "journal": "Journal of Climate",
  "citation": "Kim, D., …, 2026: 제목, Journal of Climate, 39, 1–10.",
  "doi": "10.1175/jcli-d-25-0000.1"
},
```

- `doi`는 `https://doi.org/` 뒤의 부분만 적습니다. 있으면 출판사 페이지로, 없으면(줄 삭제) Google Scholar 검색으로 연결됩니다.
- **새 연도(예: 2026) 첫 논문일 때:** `docs/index.html`에서 `data-year="2025"`를 찾아 그 앞에 `<button data-year="2026" aria-pressed="false">2026</button>`를 추가합니다. 연도 버튼을 3개로 유지하려면 가장 오래된 버튼(`2023`)을 지우고 `docs/app.js`의 `Number(p.year)<2023`을 `<2024`로 바꿉니다("Earlier" 기준).

### 교수 정보·CV — `docs/assets/content.json`의 `"professor"`

- 사진 아래 두 줄: `"role"`(직위, 예: Assistant Professor)과 `"field"`(연구실 내 역할, 예: Lab Leader).
- CV 교체: `docs/assets/cv-dasol-kim.pdf`를 같은 이름으로 다시 업로드합니다. 예전 주소 유지를 위해 `docs/img/CV_Kim.pdf`도 같은 파일로 교체합니다.

### HTML에 직접 적힌 문구 — `docs/index.html`

About 문단, 대표 논문 카드 3개(Research in Focus), 연락처·Google Scholar/ResearchGate/LinkedIn 링크, 푸터는 `content.json`이 아니라 `index.html`에 있습니다. 파일 안에서 바꿀 문구를 검색(Ctrl+F)해 수정합니다.

### 수정 후 반영이 안 보일 때

GitHub 저장소의 **Actions** 탭에서 `pages build and deployment`가 초록 체크인지 확인하고, 브라우저에서 강력 새로고침(Ctrl+F5)합니다. 이미지·CSS를 바꿨는데 그대로라면 `index.html`의 `?v=20261104` 값을 오늘 날짜로 바꿉니다.

## 1. 가장 빠른 실행 방법

1. 저장소를 내려받습니다: `git clone https://github.com/dasol-ST/ccrl.git`
2. `README.md`, `package.json`, `docs`가 함께 있는 저장소 폴더를 Claude Code나 다른 코딩 세션의 작업 폴더로 엽니다.
3. Node.js 18 이상이 설치된 터미널에서 다음을 실행합니다.

```sh
node server.mjs
```

4. 브라우저에서 **http://127.0.0.1:4173/** 를 엽니다.
5. 파일을 수정하고 브라우저를 새로고침하면 반영됩니다. 서버 종료는 터미널에서 `Ctrl+C`입니다.

`npm start` 또는 `npm run dev`도 같습니다. `npm install`은 필요하지 않습니다. Windows에서는 `start-windows.cmd`를 더블클릭해도 됩니다. 실행 창에 표시되는 주소를 브라우저에서 여세요.

**`docs/index.html`을 더블클릭해서 열지 마세요.** `file://`에서는 연구·인원·논문 JSON을 읽는 `fetch()`가 차단될 수 있으므로 HTTP 서버를 사용해야 합니다.

### Node.js가 없을 때

Python이 이미 설치되어 있다면 같은 폴더에서 다음으로 실행할 수 있습니다.

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

이 경우 주소는 **http://127.0.0.1:8000/** 입니다. 별도 Python 패키지는 필요하지 않습니다.

### 포트가 사용 중일 때

Node 서버의 기본 포트는 4173입니다. 다른 포트는 환경변수로 지정합니다.

```powershell
# Windows PowerShell
$env:PORT = '4174'
node server.mjs
```

```sh
# macOS / Linux
PORT=4174 node server.mjs
```

서버는 현재 컴퓨터의 `127.0.0.1`에만 열립니다. 다른 사람에게 보낼 공개 링크는 별도 배포가 필요합니다.

## 2. 다른 AI 세션에 붙여넣을 시작 프롬프트

아래 내용을 복사하고 마지막에 원하는 수정 사항을 덧붙이면 됩니다.

```text
이 작업 폴더는 CCRL 홈페이지의 완성된 소스 키트입니다.
README.md와 SOURCES.txt를 먼저 읽고 기존 구현을 기반으로 작업해 주세요.
처음부터 다른 디자인이나 프레임워크로 다시 만들지 말고, 우선 node server.mjs로
현재 상태를 실행한 뒤 내가 요청한 부분을 수정해 주세요.

웹사이트 문구는 영어로 유지합니다. 본문 폰트는 Inter이고, 영상 마지막의
HTML 제목은 Noto Sans KR입니다. 영상은 docs/assets/ccrl-hero.mp4이며
22.5초 전체를 무음으로 한 번 재생합니다. 제목은 영상에 구워진 글자가 아니라
HTML/CSS와 app.js로 영상 시간에 동기화합니다.

기존 모바일 4:3 중앙 크롭, Pause/Skip/Replay, 종료 이미지,
Explore the lab 안내, 연구 5개와 교수 포함 인원 10명 구성을 유지해 주세요.
수정 후 PC와 모바일에서 확인하고, 변경 파일과 실행 방법을 알려 주세요.
배포 대상은 내가 지정하는 환경을 사용해 주세요.

이번에 원하는 수정 사항: [여기에 작성]
```

기존 공식 홈페이지 저장소에 적용할 경우에는 이 폴더를 저장소 전체에 덮어쓰지 말고, 해당 저장소의 구조와 게시 설정을 먼저 확인한 뒤 필요한 파일을 옮깁니다.

## 3. 파일 구성과 수정 위치

```text
ccrl/  (저장소 루트, 공개되지 않음)
  README.md                 사용법과 인수인계 설명
  SOURCES.txt               콘텐츠·이미지 출처와 변경 이력
  package.json              시작·문법 확인 명령
  server.mjs                의존성 없는 로컬 정적 서버
  start-windows.cmd         Windows 실행 도우미
  .gitignore                개발 중 생성 파일 제외 목록
  design/ccrl-logo-sheet.png  로고 시안 원본 (두 워드마크를 잘라낸 원본, 공개되지 않음)
  reference/
    html-title-desktop.png  마지막 제목 장면의 PC 기준 화면
    html-title-mobile.png   마지막 제목 장면의 모바일 기준 화면
  docs/                     GitHub Pages로 공개되는 실제 웹사이트 전체
    .nojekyll               GitHub Pages의 Jekyll 처리를 끄는 빈 파일 (삭제 금지)
    img/CV_Kim.pdf          기존 사이트 주소(…/ccrl/img/CV_Kim.pdf) 유지용 CV 사본
    index.html              페이지 골격, 메뉴, 고정 문구, 영상 제목
    style.css               기본 디자인
    readability.css         글자 크기·가독성 보정
    layout.css              반응형·그리드·영상·제목 모션 스타일
    app.js                  데이터 렌더링, 영상 동기화, 메뉴·검색·대화상자
    assets/
      content.json          연구·교수·멤버·논문 데이터와 출처
      ccrl-hero.mp4          타이틀 없는 최종 영상
      ccrl-hero-poster.jpg   영상 로딩 전 이미지
      ccrl-hero-end.jpg      재생 종료/Skip 시 보여줄 이미지
      ccrl-logo-white.png   헤더(영상 위·모바일)·푸터용 흰색 워드마크 (투명 배경)
      ccrl-logo-color.png   스크롤 후 흰 헤더용 청록 워드마크 (투명 배경)
      favicon-32.png, favicon-64.png, apple-touch-icon.png   브라우저 탭·홈 화면 아이콘 (로고의 첫 "C")
      ...                   연구 이미지, 인물 사진, CV PDF 등
```

| 바꾸려는 내용 | 수정 위치 |
| --- | --- |
| 상단 메뉴, About, 연구 하이라이트, 하단 연락처, 푸터 | `docs/index.html` |
| 마지막 영상 위 제목·부제 문구 | `docs/index.html`의 `film-title-layer` |
| 연구 설명, 멤버, 논문 목록 | `docs/assets/content.json` |
| 연구 카드에 실제 표시되는 짧은 제목 | `docs/app.js`의 `shortTitles` 배열 |
| 영상 재생·제목 등장 시점 | `docs/app.js`의 `titleSceneStart`, `renderFilmTitle` |
| 영상 제목의 크기·위치·색상 | `docs/layout.css`의 `.film-title*` |
| 글자 크기·간격·모바일 배치 | CSS 3개, 특히 `readability.css`와 `layout.css` |

CSS 적용 순서는 **style.css → readability.css → layout.css**입니다. 같은 선택자가 여러 번 있으면 뒤쪽 규칙과 미디어 쿼리까지 확인하세요. 이 키트는 현재 화면을 그대로 재현하기 위해 기존 CSS를 보존했습니다.

`content.json`의 모든 필드가 화면에 자동 연결된 것은 아닙니다. About/연락처/대표 논문 카드 등 HTML 고정 문구와 `shortTitles`도 함께 확인하세요. 논문 연도 버튼은 HTML에 있으며, 연도를 추가하면 JS 필터의 `earlier` 조건도 검토해야 합니다.

## 4. 현재 디자인과 동작

- 서울대 지구환경과학부 홈페이지의 구성에서 참고한 CCRL 소개 페이지입니다. 서울대 사이트 소스나 브랜드를 복사한 패키지는 아닙니다.
- 본문은 Inter, 마지막 영상 제목은 원본 모션과 맞춘 Noto Sans KR 900/400입니다.
- 연구 5개는 PC에서 첫 행 3개, 둘째 행 2개를 가운데 배치합니다. 가로 스크롤은 없습니다.
- 교수 포함 10명을 모두 표시하며 PC는 4열, 모바일은 2열, 360px 이하는 1열입니다.
- 모바일 영상은 중앙 기준 4:3 크롭입니다. 원본 16:9 영상의 좌우가 일부 잘립니다.
- 우측 슬라이더·섹션 레일·학교 문양 링크 버튼은 현재 화면에서 제거되어 있습니다.
- 네이티브 스크롤바는 숨기지만 스크롤 자체는 가능합니다. `Explore the lab`이 아래 내용을 안내합니다.
- 상단의 별도 큰 연구실 제목은 없으며 접근성을 위한 숨김 h1은 유지되어 있습니다.
- 연구 상세 대화상자, 팀 연락처/CV, 논문 검색·연도 필터·더 보기, 모바일 메뉴가 구현되어 있습니다.
- 논문 링크는 `content.json`의 각 논문 `doi` 값으로 `https://doi.org/…` 출판사 페이지에 연결됩니다(2026-11-04 Crossref로 18편 확인). `doi`가 없는 논문은 Google Scholar 검색 링크로 대체됩니다. 대표 논문 카드 3개의 링크는 `index.html`에 직접 적혀 있습니다.
- 연락처(Contact)의 FIND US ONLINE 항목에 Google Scholar·ResearchGate·LinkedIn 링크가 있으며 `index.html`에 직접 적혀 있습니다.

## 5. 영상과 HTML 제목 모션

현재 영상은 사용자가 제공한 `warming-v3-notitle.mp4`를 `ccrl-hero.mp4`로 보관한 것입니다. **22.5초 전체, 1280×720, 30fps, H.264, 무음**이며 제목 글자는 영상 외부에서 렌더링합니다. 원본 D: 드라이브나 이전 PC 경로에 접근하지 않아도 실행됩니다.

| 항목 | 현재 값 |
| --- | --- |
| 마지막 장면 시작 | 18.984375초 |
| 큰 제목 등장 시작 | 마지막 장면 시작 후 0.35초 = 19.334375초 |
| 큰 제목 투명도 | 0 → 1, 0.5초, 선형 |
| 큰 제목 자간 | 0.16em → 0.06em, 0.9초 |
| 큰 제목 위치 | 아래 12px → 원위치, 0.9초 |
| 부제 등장 시작 | 마지막 장면 시작 후 1.3초 = 20.284375초 |
| 부제 투명도·위치 | 0 → 1, 아래 14px → 원위치, 0.7초 |
| 자간·위치·부제 이징 | ease-out cubic: `1 - (1 - x)^3` |

가능하면 `requestVideoFrameCallback`으로 영상 시간에 맞추고, 미지원 환경에서는 `requestAnimationFrame`을 사용합니다. Pause 시 모션도 멈추고, Replay 시 제목을 숨긴 뒤 처음부터 재생합니다. Skip/자연 종료 시 마지막 이미지와 완성된 제목을 보여줍니다. 동작 줄이기 설정에서는 초기 자동재생 대신 종료 장면을 표시합니다. 브라우저가 자동재생을 막으면 Play를 눌러 시작할 수 있습니다.

영상 교체 시 MP4, poster, end 이미지 3개를 함께 갱신하고 `titleSceneStart`를 새 편집에 맞추세요. 제목이 들어간 영상을 넣으면 HTML 제목과 중복됩니다. HTML/CSS의 `?v=...` 캐시 값도 함께 갱신하는 것이 좋습니다.

## 6. 확인 방법

문법 확인:

```sh
npm run check
```

브라우저 확인:

1. PC와 모바일 폭(예: 1440px, 390px, 360px)에서 확인합니다.
2. 영상이 무음 자동재생되고 약 19.33초부터 큰 제목이 나타나는지 확인합니다.
3. Pause/Play, Skip, Replay 및 종료 후 정지 상태를 확인합니다.
4. 모바일에서 영상 위 제목과 조작 버튼이 잘리지 않는지 확인합니다.
5. 연구 5개, 인원 10명이 표시되고 상세 대화상자가 열리고 닫히는지 확인합니다.
6. 논문 검색·연도 필터·더 보기, 메뉴 및 연락처 링크를 확인합니다.

`reference`의 PNG는 2026-10-24에 캡처한 제목 완료 상태입니다. 로딩 직후에는 제목이 숨겨져 있는 것이 정상이며, Skip을 누르면 비교하기 쉽습니다.

## 7. 게시(배포)

현재 게시 방식: GitHub 저장소 Settings → Pages → Source를 **Deploy from a branch / `master` / `/docs`**로 설정합니다. `master`에 push하면 1~2분 뒤 https://dasol-st.github.io/ccrl/ 에 반영됩니다.

다른 호스팅으로 옮길 때 참고: **배포 대상은 `docs` 폴더의 내용 전체**입니다. 빌드 명령은 없습니다. `server.mjs`는 로컬 미리보기용이므로 정적 호스팅에는 필요하지 않습니다.

- 일반 정적 호스팅: 게시 디렉터리를 `docs`로 설정합니다.
- 기존 홈페이지 서버: 해당 서버의 문서 루트/게시 폴더에 `docs`의 내용을 배치합니다.
- GitHub Pages 등 하위 경로 호스팅: 상대 경로를 유지하고 `index.html`, CSS, JS, `assets`가 같은 게시 루트에 놓이게 합니다. 저장소 전체 구조는 담당자가 확인합니다.

## 8. 외부 의존성과 출처

- 영상·사진·PDF·JSON은 패키지에 포함되어 있습니다.
- Google Fonts의 Inter/Noto Sans KR은 온라인으로 불러옵니다. 인터넷이 끊기면 대체 글꼴로 표시되므로 글꼴까지 완전히 오프라인인 패키지는 아닙니다.
- DOI(출판사), Google Scholar·ResearchGate·LinkedIn, 이메일·전화 링크는 외부 서비스를 사용합니다.
- 인물/논문 콘텐츠는 기존 연구실 홈페이지에서 가져온 2026-10-14 기준 자료입니다. 이후 변경 내용은 별도 확인해야 합니다.
- 사진, 문서, 제공 영상의 권리는 각 원저작자에게 있습니다. 이 패키지는 새로운 재사용 라이선스를 부여하지 않습니다. 상세 출처와 변경 이력은 `SOURCES.txt`를 참고하세요.
- `SOURCES.txt`에는 이전 버전의 역사도 포함됩니다. 현재 구현은 이 README와 `docs`가 기준입니다.
- 브라우저 탭 아이콘은 로고 시안(`design/ccrl-logo-sheet.png`)의 첫 "C"를 잘라 만든 PNG입니다. 예전 지구 모양 `mark.svg`는 삭제했습니다.

## 9. 문제 해결

- 연구/인원/논문이 비어 있음: `file://` 대신 위 HTTP 서버로 접속했는지, `assets/content.json` 요청이 성공하는지 확인합니다.
- 예전 영상/스타일이 보임: 강력 새로고침을 하거나 HTML/CSS의 `?v=` 값을 갱신합니다.
- 제목이 시작부터 안 보임: 약 19.33초에 나타나는 설계입니다. Skip으로 완료 장면을 확인합니다.
- 영상이 안 움직임: OS의 동작 줄이기 설정이나 자동재생 제한을 확인하고 Play 또는 Replay를 누릅니다.
- 포트 오류: 기존 서버를 종료하거나 위 방법대로 다른 포트를 사용합니다.
- 수정이 반영되지 않음: 실행한 서버가 이 저장소 폴더를 가리키는지 확인합니다. 공개 사이트라면 `master`에 push했는지, GitHub 저장소의 Actions 탭에서 Pages 게시가 끝났는지 확인합니다.
