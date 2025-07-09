
import React from 'react';
import { Category } from './types';

export const GEMINI_MODEL_NAME = "gemini-2.5-flash";

export const CATEGORIES_WITH_INFO: Array<{
  key: Category;
  label: string;
  icon: React.ReactNode;
  color: string;
  promptHint: string;
}> = [
  { key: Category.FOOD, label: "음식", icon: <i className="fas fa-utensils"></i>, color: "text-orange-500", promptHint: "레스토랑, 카페, 분식점 학생 할인" },
  { key: Category.CULTURE, label: "문화", icon: <i className="fas fa-film"></i>, color: "text-purple-500", promptHint: "영화관, 공연장, 전시회 학생 할인" },
  { key: Category.BEAUTY_HEALTH, label: "뷰티/건강", icon: <i className="fas fa-spa"></i>, color: "text-pink-500", promptHint: "미용실, 헬스장, 화장품 가게 학생 할인" },
  { key: Category.STUDY, label: "스터디", icon: <i className="fas fa-book-open"></i>, color: "text-blue-500", promptHint: "스터디 카페, 독서실, 온라인 강의 학생 할인" },
  { key: Category.SHOPPING, label: "쇼핑", icon: <i className="fas fa-shopping-bag"></i>, color: "text-green-500", promptHint: "의류, 전자기기, 문구류 매장 학생 할인" },
  { key: Category.OTHER, label: "기타", icon: <i className="fas fa-ellipsis-h"></i>, color: "text-gray-500", promptHint: "기타 학생 할인" },
];

export const getCategoryInfo = (categoryKey: Category) => {
  return CATEGORIES_WITH_INFO.find(cat => cat.key === categoryKey) || CATEGORIES_WITH_INFO.find(cat => cat.key === Category.OTHER)!;
};

// Placeholder for user preferences, in a real app this would be dynamic
export const MOCK_USER_PREFERENCES_PROMPT = "저는 주로 학교 근처 스터디 카페에서 공부하고, 주말에는 친구들과 영화보는 것을 좋아합니다. 최근에는 강남역 주변에서 활동이 많습니다.";

export const APP_TITLE = "혜택:ON";