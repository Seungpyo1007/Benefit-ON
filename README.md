# 혜택:ON (혜택온) Ver.1 - 청소년 할인 정보 플랫폼

청소년들을 위한 할인 정보를 한눈에 볼 수 있는 웹 애플리케이션입니다. 영화관, 음식점, 쇼핑몰 등 다양한 카테고리의 청소년 할인 혜택을 찾고, AI 추천 시스템과 영수증 분석 기능을 통해 더욱 스마트한 소비를 도와줍니다.

## 🎖️ 주요 기능

### ⛳ 위치 기반 서비스
- **근처 매장 찾기**: 현재 위치 기반으로 가까운 할인 매장을 찾아드립니다
- **데모 위치**: 강남역, 용산역 등 주요 지역의 데모 위치를 제공합니다

### 🎯 카테고리별 검색
- **영화관**: CGV, 롯데시네마, 메가박스, KU시네마테크 등
- **음식점**: 애슐리퀸즈, 빕스, 피자몰, 미스터피자, 도미노피자 등
- **쇼핑**: 스파오, WHOAU, 아디다스, 나이키 등
- **문화**: 국립중앙박물관, 리움미술관, N서울타워 등
- **스터디**: 교보문고, 핫트랙스 등

### 🪩 AI 추천 시스템
- **개인화된 추천**: 사용자의 선호도를 입력하면 AI가 맞춤형 매장을 추천합니다
- **Gemini AI 활용**: Google의 Gemini AI 모델을 사용한 지능형 추천

### 📸 영수증 분석 기능
- **영수증 업로드**: 영수증 사진을 업로드하면 자동으로 분석합니다
- **혜택 추출**: 영수증에서 사용 가능한 혜택 정보를 자동으로 추출합니다
- **대안 추천**: 영수증 분석 결과를 바탕으로 다른 할인 매장을 추천합니다

### 💾 개인화 기능
- **즐겨찾기**: 자주 이용하는 매장을 즐겨찾기에 추가
- **최근 본 매장**: 최근에 확인한 매장 목록 관리
- **영수증 히스토리**: 분석한 영수증 기록 보관

## 🛠 기술 스택

- **Frontend**: React 19.1.0, TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Service**: Google Gemini AI (@google/genai)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 설치 및 실행

### Prerequisites
- Node.js (최신 LTS 버전 권장)

### 설치 방법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   `.env.local` 파일을 생성하고 Gemini API 키를 설정하세요:
   ```
   VITE_API_KEY=your_gemini_api_key_here
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **빌드**
   ```bash
   npm run build
   ```

## 🔧 프로젝트 구조

```
SDHS-HACKATHON-2025-Team10/
├── components/          # React 컴포넌트
│   ├── Header.tsx      # 헤더 컴포넌트
│   ├── StoreCard.tsx   # 매장 카드 컴포넌트
│   ├── Modal.tsx       # 모달 컴포넌트
│   └── ...
├── services/           # 서비스 레이어
│   └── geminiService.ts # Gemini AI 서비스
├── types.ts           # TypeScript 타입 정의
├── constants.tsx      # 상수 및 정적 데이터
├── utils.ts          # 유틸리티 함수
└── App.tsx           # 메인 애플리케이션 컴포넌트
```

## 🎨 주요 컴포넌트

- **App.tsx**: 메인 애플리케이션 로직 및 상태 관리
- **StoreCard**: 매장 정보를 카드 형태로 표시
- **Modal**: 매장 상세 정보, AI 추천, 영수증 분석 등의 모달
- **Header**: 검색, 필터링, 위치 설정 기능이 포함된 헤더
- **MenuBar**: 하단 네비게이션 메뉴

## 🚀 배포

이 프로젝트는 Vercel를 통해 배포됩니다.

🌐 **배포 링크**: [https://benefit-on-v2.vercel.app/](https://benefit-on-v2.vercel.app/)

## 📱 사용법

1. **매장 탐색**: 메인 화면에서 카테고리별로 매장을 탐색하세요
2. **검색**: 상단 검색창에서 매장명이나 주소로 검색하세요
3. **위치 설정**: 로고를 클릭하여 데모 위치를 설정하세요
4. **AI 추천**: "AI 추천" 버튼을 클릭하고 선호도를 입력하세요
5. **영수증 분석**: "영수증 분석" 버튼을 클릭하고 영수증 사진을 업로드하세요

## 🤝 기여하기

이 프로젝트는 SDHS 해커톤 2025 Team10 "LBM" 의 결과물입니다.

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

**Copyright © 2025 SDHS Hackathon Team10 "LBM"**  
All rights reserved.
