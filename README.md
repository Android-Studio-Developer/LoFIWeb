# LoFIWeb

Discord 없이도 웹에서 LoFI를 함께 듣거나, 혼자 집중할 수 있는 웹 앱 프로토타입입니다.

## 핵심 기능

- 🎧 Solo / Room 모드 (6자리 코드)
- ⌚ 컴팩트 시계 UI + 저자극 다크 톤 인터페이스
- 🔁 chill & modern 애니메이션 배경
- 🔊 Additional Sound (Rain/Cafe) 믹서
- 🎹🐌 느린 템포(58/65/72 BPM) LoFI 신스 생성
- 👫 방장 중심 컨트롤 동기화 (같은 브라우저/탭 기반)

## 실행 방법

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173` 접속.

> 브라우저 자동재생 정책 때문에 첫 재생은 사용자 클릭이 필요합니다.

## 파일 구조

- `index.html`: UI 뷰 레이아웃
- `styles.css`: 스타일/배경 애니메이션
- `app.js`: 룸/동기화/오디오 엔진 로직

---

### 💳 크레딧

**LoFI Chilling v.(int) h3**

not affliated with any of streaming.

made by Android_Studio_Developer

![GitHub favicon](https://github.githubassets.com/favicons/favicon.svg) Github: https://github.com/
