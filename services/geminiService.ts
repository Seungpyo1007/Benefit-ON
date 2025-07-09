
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Store, ReceiptData, Category, DiscountInfo, ReceiptAnalysisResult, SuggestedDiscount } from '../types';
import { GEMINI_MODEL_NAME, CATEGORIES_WITH_INFO } from '../constants';

// Vite exposes environment variables on `import.meta.env`
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.error("VITE_API_KEY is not set. Please set the environment variable in your .env file or hosting provider.");
  // You might want to throw an error or handle this more gracefully
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseJsonFromText = <T,>(text: string): T | null => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    try {
      // Attempt to fix common JSON errors like trailing commas
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas before a closing bracket or brace
      return JSON.parse(jsonStr) as T;
    } catch (e2) {
      console.error("Failed to parse JSON response after attempting to fix trailing commas:", e2, "Original text:", jsonStr);
      return null;
    }
  }
};


export const fetchInitialDiscounts = async (): Promise<Store[]> => {
  const prompt = `
  아래에 제공된 서울시 학생 할인 서점 목록을 기반으로, 10-15개의 서점에 대한 가상 할인 정보를 생성해주세요.
  제공된 정보를 바탕으로 하되, 실제 주소, 연락처, 운영 시간, 평점 등 상세 정보를 추가하여 JSON 배열 형태로 제공해주세요.
  모든 서점의 카테고리는 "스터디"로 지정해야 합니다.

  --- PROVIDED BOOKSTORE LIST ---
  🎓 서울 학생할인/할인 혜택 서점 리스트
  📚 대형서점
  ✅ 교보문고
  위치: 광화문 본점, 강남점, 영등포점, 잠실점, 합정점 등
  할인 방식: 교보문고 멤버십 가입 시 구매 적립금, 생일 할인 쿠폰, 제휴 신용카드 청구할인, 간헐적 학생 인증 이벤트 (학생증 인증 시 쿠폰 지급)

  ✅ 영풍문고
  위치: 종각점, 여의도 IFC몰, 용산아이파크몰 등
  할인 방식: 회원 등급별 할인, 특정 기간 학생 인증 이벤트, 문화누리카드 등 사용 시 할인

  ✅ YES24 중고서점
  위치: 강남점, 홍대점
  할인: 중고도서 저가, 간헐적 학생 인증 이벤트

  🏫 대학가 서점
  ✅ 성균관문고
  위치: 혜화동 성균관대 앞
  할인: 학생증 제시 시 학술서적·전공서적 5~10% 할인

  ✅ 홍익문고
  위치: 홍익대학교 주변
  할인: 대학생 대상 전공서적 할인, 중고서적 저가 판매

  ✅ 서울대 생협 서점
  위치: 서울대학교 캠퍼스 내
  할인: 교재·전공서적 특별할인(서울대 학생증 필요)

  ✅ 연세문고
  위치: 연세대 정문 근처
  할인: 학생증 제시 시 전공·교양서적 할인

  ✅ 고려대 구내서점
  위치: 고려대 내
  할인: 학생증으로 구입 시 5~10% 할인

  🪙 중고/독립서점 (할인/저가)
  ✅ 알라딘 중고서점
  위치: 신촌점, 종로점, 강남점 등
  할인: 이미 저렴한 중고서적, 학생 인증 할인은 별도 없으나 중고 구매 자체가 50~70% 할인

  --- END OF LIST ---

  각 상점 정보는 다음 JSON 형식을 따라야 합니다:
  - id: UUID 문자열 (예: "xxxx-xxxx-xxxx-xxxx")
  - name: 상점 이름 (예: "교보문고 광화문점"). 지점명까지 포함하여 고유하게 만들어주세요.
  - category: "스터디" 로 고정.
  - address: 실제적인 가상의 주소 (예: "서울특별시 종로구 종로 1"). 목록에 있는 위치를 기반으로 생성해주세요.
  - contact: 가상의 연락처 (예: "02-123-4567")
  - latitude: 주소에 맞는 위도 값 (숫자).
  - longitude: 주소에 맞는 경도 값 (숫자).
  - discounts: 할인 정보 배열. 제공된 할인 방식을 바탕으로 1-2개의 할인 정보를 생성. 각 할인은 다음을 포함합니다:
    - id: UUID 문자열
    - description: 할인 설명 (예: "학생증 제시 시 전공서적 10% 할인")
    - conditions: 할인 조건 (예: "일부 품목 제외, 멤버십 가입 필수")
  - imageUrl: \`https://picsum.photos/seed/\${Math.random().toString().substring(2)}/400/300\` 형식의 이미지 URL.
  - rating: 1에서 5 사이의 숫자 (예: 4.8)
  - operatingHours: 운영 시간 (예: "매일 10:00 - 22:00")

  위도와 경도는 서울의 다양한 지역 (종로, 강남, 신촌, 혜화 등)에 맞게 분포되도록 해주세요.
  모든 상점에 유효한 위도와 경도 값을 반드시 포함해야 합니다.

  최종 결과물은 JSON 형식으로만 응답해주세요. 설명이나 추가 텍스트 없이 순수 JSON 배열만 반환해야 합니다.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const stores = parseJsonFromText<Store[]>(response.text);
    if (stores && Array.isArray(stores)) {
      return stores.map(store => ({
        ...store,
        id: store.id || crypto.randomUUID(),
        category: Object.values(Category).includes(store.category) ? store.category : Category.OTHER,
        discounts: store.discounts.map(d => ({...d, id: d.id || crypto.randomUUID()})),
        latitude: typeof store.latitude === 'number' ? store.latitude : undefined,
        longitude: typeof store.longitude === 'number' ? store.longitude : undefined,
        imageUrl: store.imageUrl || `https://picsum.photos/seed/${crypto.randomUUID()}/400/300` // Ensure imageUrl if Gemini misses it
      }));
    }
    console.error("Failed to parse stores or response is not an array:", stores);
    return [];
  } catch (error) {
    console.error("Error fetching initial discounts:", error);
    return [];
  }
};

export const getAiRecommendations = async (userPreferences: string, availableStores: Store[]): Promise<Store[]> => {
  if (!availableStores || availableStores.length === 0) return [];

  const storeListText = availableStores.map(s => `- ${s.name} (${s.category}, 주소: ${s.address}): ${s.discounts.map(d => d.description).join(', ')}`).join('\n');

  const prompt = `
  다음은 사용자의 선호도입니다:
  "${userPreferences}"

  아래는 현재 이용 가능한 할인 상점 목록입니다:
  ${storeListText}

  사용자의 선호도와 현재 이용 가능한 할인 정보를 바탕으로, 가장 적합한 3개의 상점을 추천해주세요.
  추천하는 상점의 'id' 값만 JSON 배열 형태로 반환해주세요. 예를 들어: ["상점ID1", "상점ID2", "상점ID3"]
  설명이나 추가 텍스트 없이 순수 JSON 배열만 반환해야 합니다.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const recommendedStoreIds = parseJsonFromText<string[]>(response.text);
    if (recommendedStoreIds && Array.isArray(recommendedStoreIds)) {
      return recommendedStoreIds
        .map(id => availableStores.find(store => store.id === id))
        .filter(store => store !== undefined) as Store[];
    }
    console.error("Failed to parse recommended store IDs or response is not an array:", recommendedStoreIds);
    return [];
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    return [];
  }
};

export const analyzeReceiptText = async (receiptText: string): Promise<ReceiptData | null> => {
  const prompt = `
  다음은 사용자가 입력한 영수증 텍스트입니다:
  "${receiptText}"

  이 텍스트를 분석하여 다음 정보를 JSON 객체 형태로 추출해주세요:
  - storeName: 상점 이름 (가장 가능성 높은 이름으로)
  - items: 구매한 주요 품목 또는 서비스 목록 (문자열 배열)
  - discountApplied: 영수증 텍스트에서 '할인', '프로모션', '쿠폰' 등 할인과 관련된 키워드를 찾아 적용된 할인 내용을 정확히 추출해주세요. 할인 내역이 없다면 '없음'으로 기재합니다. (예: "학생 할인 2000원")
  - totalAmount: 총 결제 금액 (문자열, 예: "18000원")
  - date: 영수증 날짜 (YYYY-MM-DD 형식, 추정 가능하면 포함, 아니면 오늘 날짜)
  - storeCategory: 상점의 카테고리 추정 (${Object.values(Category).join(' | ')})

  JSON 형식으로만 응답해주세요. 설명이나 추가 텍스트 없이 순수 JSON 객체만 반환해야 합니다.
  만약 정보 추출이 어렵다면, 최대한 추론하여 채워주세요.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsedData = parseJsonFromText<Omit<ReceiptData, 'id'>>(response.text);
    if (parsedData) {
      return { 
        ...parsedData, 
        id: crypto.randomUUID(),
        date: parsedData.date || new Date().toISOString().split('T')[0],
        storeCategory: parsedData.storeCategory && Object.values(Category).includes(parsedData.storeCategory) ? parsedData.storeCategory : Category.OTHER,
      };
    }
    return null;
  } catch (error) {
    console.error("Error analyzing receipt text:", error);
    return null;
  }
};

export const analyzeReceiptAndSuggestDiscounts = async (base64ImageData: string, mimeType: string): Promise<ReceiptAnalysisResult | null> => {
  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageData,
    },
  };

  const textPart = {
    text: `
    당신은 학생 및 일반 사용자를 위한 할인 정보 앱의 스마트 AI 어시스턴트입니다. 당신의 임무는 영수증 이미지를 분석하고, 사용자가 받을 수 있는 혜택을 두 가지 유형으로 나누어 제공하는 것입니다: "지금 바로 받을 수 있는 혜택"과 "앞으로 유용한 혜택".

    1.  **영수증 분석**: 먼저, 영수증 이미지를 분석하여 다음 정보를 최대한 정확하게 추출해주세요.
        *   \`storeName\`: 상점 이름
        *   \`items\`: 구매한 주요 품목 또는 서비스 목록 (문자열 배열)
        *   \`discountApplied\`: 영수증 이미지에서 '할인', '프로모션', '쿠폰 적용' 등 할인과 관련된 텍스트를 주의 깊게 찾아, 적용된 할인 내용을 정확히 기재해주세요. 만약 명시된 할인 내역이 전혀 없다면 "없음"으로 기재해주세요.
        *   \`totalAmount\`: 최종 결제 금액.
        *   \`date\`: 구매 날짜 (YYYY-MM-DD 형식). 보이지 않으면 오늘 날짜.
        *   \`storeCategory\`: 다음 목록에서 상점의 카테고리를 추론해주세요: ${Object.values(Category).join(', ')}.

    2.  **혜택 분류 및 생성**: 다음으로, 추출된 'storeName'을 기반으로, 당신의 지식을 활용하여 관련 혜택을 생성하고 두 그룹으로 분류해주세요.

        *   **\`immediateBenefits\` (지금 바로 받을 수 있는 혜택)**: 현재 받은 영수증을 사용해 *즉시* 행동을 취할 수 있는 혜택. (예: 영수증 하단의 설문조사 참여 쿠폰)
        *   **\`futureBenefits\` (이런 혜택은 어떠세요?)**: 지금 당장은 아니지만, 미래에 유용하거나 알아두면 좋은 일반적인 혜택. (예: 특정 시간대 할인, 앱 전용 쿠폰, 멤버십 정보, 생일 쿠폰 등)

    3.  **JSON 출력**: 마지막으로, 다음 구조를 가진 단일 JSON 객체로만 응답해주세요. 다른 텍스트, 설명, 마크다운 서식은 포함하지 마세요.

    --- JSON 출력 형식 및 예시 (KFC 영수증의 경우) ---
    {
      "analyzedReceipt": {
        "storeName": "KFC 코엑스몰점",
        "items": ["징거버거 세트"],
        "discountApplied": "없음",
        "totalAmount": "7,800원",
        "date": "2024-07-27",
        "storeCategory": "음식"
      },
      "immediateBenefits": [
        {
          "title": "영수증 설문조사 쿠폰",
          "description": "영수증 하단의 설문조사 번호로 온라인 설문에 참여하면, 다음 구매 시 징거버거/타워버거 단품 가격에 세트를 받을 수 있는 코드를 드립니다. 받은 코드를 영수증에 적어두세요!"
        }
      ],
      "futureBenefits": [
        {
          "title": "KFC 치킨나이트 (오후 9시 이후)",
          "description": "대부분의 매장에서 오후 9시 이후 치킨 단품 주문 시 1+1 혜택을 제공합니다. 다음엔 늦은 저녁에 치킨을 즐겨보세요! (일부 매장 및 신메뉴 제외)"
        },
        {
          "title": "KFC 공식 앱 혜택",
          "description": "KFC 앱을 다운로드하면 매주 새로운 할인 쿠폰, 생일 축하 쿠폰, 멤버십 포인트(커넬) 적립 등 다양한 혜택을 받을 수 있습니다."
        },
        {
          "title": "KFC 멤버십 (커넬)",
          "description": "5,000원당 1커넬이 적립되며, 등급(실버, 골드, VIP)에 따라 매월 특별 쿠폰과 업그레이드 쿠폰 등 더 큰 혜택이 제공됩니다."
        }
      ]
    }
    --- 예시 종료 ---

    이제 제공된 이미지를 분석하고 그에 대한 JSON 객체로 응답해주세요.
    `,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: { responseMimeType: "application/json" }
    });
    
    const parsedResult = parseJsonFromText<{
      analyzedReceipt: Omit<ReceiptData, 'id'>;
      immediateBenefits: SuggestedDiscount[];
      futureBenefits: SuggestedDiscount[];
    }>(response.text);

    if (parsedResult && parsedResult.analyzedReceipt && parsedResult.immediateBenefits && parsedResult.futureBenefits) {
      return {
        analyzedReceipt: {
            ...parsedResult.analyzedReceipt,
            date: parsedResult.analyzedReceipt.date || new Date().toISOString().split('T')[0],
            storeCategory: parsedResult.analyzedReceipt.storeCategory && Object.values(Category).includes(parsedResult.analyzedReceipt.storeCategory) 
              ? parsedResult.analyzedReceipt.storeCategory 
              : Category.OTHER,
            items: parsedResult.analyzedReceipt.items || [],
        },
        immediateBenefits: parsedResult.immediateBenefits || [],
        futureBenefits: parsedResult.futureBenefits || []
      };
    }
    console.error("Failed to parse the structured response from Gemini:", parsedResult);
    return null;
  } catch (error) {
    console.error("Error analyzing receipt and suggesting discounts:", error);
    return null;
  }
};
