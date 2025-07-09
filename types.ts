export enum Category {
  CULTURE = "문화",
  BEAUTY_HEALTH = "뷰티/건강",
  STUDY = "스터디",
  SHOPPING = "쇼핑",
  FOOD = "음식", // Added Food category as it's common for student discounts
  OTHER = "기타",
}

export interface DiscountInfo {
  id: string;
  description: string;
  conditions: string;
}

export interface Store {
  id: string;
  name: string;
  category: Category;
  address: string;
  contact?: string;
  latitude?: number; 
  longitude?: number;
  discounts: DiscountInfo[];
  imageUrl?: string;
  rating?: number; // 0-5
  operatingHours?: string;
}

export interface ReceiptData {
  id: string;
  storeName: string;
  items: string[];
  discountApplied: string;
  totalAmount: string;
  date: string;
  storeCategory?: Category;
}

export interface SuggestedDiscount {
  title: string;
  description: string;
}

export interface ReceiptAnalysisResult {
  analyzedReceipt: Omit<ReceiptData, 'id'>;
  immediateBenefits: SuggestedDiscount[];
  futureBenefits: SuggestedDiscount[];
}

export interface ModalState {
  isOpen: boolean;
  type: 'storeDetails' | 'aiRecommender' | 'ocrInput' | 'receiptHistory' | 'favorites' | 'receiptAiAnalysis' | null;
  data?: Store | ReceiptData[] | Store[] | ReceiptAnalysisResult; // Store for details, ReceiptData[] for history, Store[] for favorites
}

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}