import React, { useState, useEffect, useCallback } from 'react';
import { Store, Category, ReceiptData, ModalState, DiscountInfo, NotificationMessage, ReceiptAnalysisResult, SuggestedDiscount } from './types';
import { fetchInitialDiscounts, getAiRecommendations, analyzeReceiptText, analyzeReceiptAndSuggestDiscounts } from './services/geminiService';
import { CATEGORIES_WITH_INFO, getCategoryInfo, MOCK_USER_PREFERENCES_PROMPT, APP_TITLE } from './constants';
import StoreCard from './components/StoreCard';
import Modal from './components/Modal';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import { calculateDistance, fileToBase64 } from './utils';
import MenuBar from './components/MenuBar';

const ActionButton = ({ icon, text, onClick, colorClass, isLoading = false }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 text-center group" disabled={isLoading}>
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${colorClass} ${isLoading ? 'cursor-not-allowed bg-white/5' : ''}`}>
            {isLoading ? <LoadingSpinner size="sm" /> : <i className={`${icon} text-2xl sm:text-3xl text-white`}></i>}
        </div>
        <span className="text-xs sm:text-sm font-medium text-white/90">{text}</span>
    </button>
);


const App: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null });
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  
  const [aiRecommendations, setAiRecommendations] = useState<Store[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [userPreferencesInput, setUserPreferencesInput] = useState<string>('');

  const [receiptHistory, setReceiptHistory] = useState<ReceiptData[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrInputText, setOcrInputText] = useState<string>('');
  
  const [isReceiptAiLoading, setIsReceiptAiLoading] = useState<boolean>(false);
  const [receiptAnalysisResult, setReceiptAnalysisResult] = useState<ReceiptAnalysisResult | null>(null);
  const [receiptAiImageFile, setReceiptAiImageFile] = useState<File | null>(null);
  const [receiptAiPreviewUrl, setReceiptAiPreviewUrl] = useState<string | null>(null);
  const [isCurrentReceiptSaved, setIsCurrentReceiptSaved] = useState<boolean>(false);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<NotificationMessage | null>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isNearbyModeActive, setIsNearbyModeActive] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  
  const [activeView, setActiveView] = useState('explore');


  const showNotification = (message: string, type: NotificationMessage['type']) => {
    setNotification({ id: crypto.randomUUID(), message, type });
  };

  useEffect(() => {
    const handleScroll = () => {
        setIsHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialStores = await fetchInitialDiscounts();
        if (initialStores.length === 0) {
            showNotification("초기 할인 정보를 불러오지 못했습니다.", "error");
        } else {
            showNotification("할인 정보를 성공적으로 불러왔습니다!", "success");
        }
        setStores(initialStores);
      } catch (err) {
        console.error(err);
        setError("할인 정보를 불러오는 중 오류가 발생했습니다.");
        showNotification("할인 정보 로딩 중 오류 발생.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    let result = [...stores]; 

    if (selectedCategory !== 'all') {
      result = result.filter(store => store.category === selectedCategory);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(store => 
        store.name.toLowerCase().includes(lowerSearchTerm) ||
        store.address.toLowerCase().includes(lowerSearchTerm) ||
        store.discounts.some(d => d.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (isNearbyModeActive && userLocation) {
      result = result
        .map(store => ({
          ...store,
          distance: store.latitude && store.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, store.latitude, store.longitude) : Infinity,
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      result = result.map(store => {
        const { distance, ...rest } = store as (Store & { distance?: number });
        return rest;
      });
    }

    setFilteredStores(result);
  }, [stores, selectedCategory, searchTerm, isNearbyModeActive, userLocation]);


  useEffect(() => {
    const storedFavorites = localStorage.getItem('혜택ON_favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    const storedReceipts = localStorage.getItem('혜택ON_receiptHistory');
    if (storedReceipts) {
      setReceiptHistory(JSON.parse(storedReceipts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('혜택ON_favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  useEffect(() => {
    localStorage.setItem('혜택ON_receiptHistory', JSON.stringify(receiptHistory));
  }, [receiptHistory]);


  const handleSelectStore = (store: Store) => {
    setCurrentStore(store);
    setModalState({ isOpen: true, type: 'storeDetails', data: store });
    setActiveView('explore'); // 상세 정보는 explore의 일부로 간주
  };

  const handleAiRecommend = async (preferences: string) => {
    if (!preferences.trim()) {
        showNotification("추천을 받으려면 원하는 내용을 입력해주세요.", "info");
        return;
    }
    setIsAiLoading(true);
    setAiRecommendations([]);
    try {
      // 항상 전체 가게 목록을 기반으로 추천하여 더 나은 결과를 제공
      const storesForRecommendation = stores;
      const recommendations = await getAiRecommendations(preferences, storesForRecommendation);
      if (recommendations.length > 0) {
        setAiRecommendations(recommendations);
        showNotification("AI 추천을 생성했습니다!", "success");
      } else {
        showNotification("AI가 현재 조건에 맞는 추천을 찾지 못했습니다.", "info");
      }
    } catch (err) {
      console.error(err);
      showNotification("AI 추천 생성 중 오류 발생.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOcrSubmit = async () => {
    if (!ocrInputText.trim()) {
      showNotification("영수증 내용을 입력해주세요.", "info");
      return;
    }
    setIsOcrLoading(true);
    try {
      const receiptDetails = await analyzeReceiptText(ocrInputText);
      if (receiptDetails) {
        setReceiptHistory(prev => [receiptDetails, ...prev]);
        showNotification("영수증이 성공적으로 분석되어 등록되었습니다.", "success");
        setOcrInputText(''); 
        closeModal();
      } else {
        showNotification("영수증 분석에 실패했습니다. 입력 내용을 확인해주세요.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("영수증 분석 중 오류 발생.", "error");
    } finally {
      setIsOcrLoading(false);
    }
  };
  
  const handleReceiptAiFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showNotification('이미지 파일만 업로드 가능합니다 (JPG, PNG 등).', 'error');
            return;
        }
        setReceiptAiImageFile(file);
        setReceiptAnalysisResult(null); // Reset previous results
        setIsCurrentReceiptSaved(false); // Reset saved state for new image
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptAiPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeReceiptForDiscounts = async () => {
    if (!receiptAiImageFile) {
        showNotification("분석할 영수증 이미지 파일을 선택해주세요.", "info");
        return;
    }
    setIsReceiptAiLoading(true);
    setReceiptAnalysisResult(null);
    setIsCurrentReceiptSaved(false);
    try {
        const base64Data = await fileToBase64(receiptAiImageFile);
        const result = await analyzeReceiptAndSuggestDiscounts(base64Data, receiptAiImageFile.type);
        if (result) {
            setReceiptAnalysisResult(result);
            showNotification("영수증 분석 및 할인 추천이 완료되었습니다.", "success");
        } else {
            showNotification("영수증 분석에 실패했습니다. 이미지 품질을 확인하거나 다시 시도해주세요.", "error");
        }
    } catch (err) {
        console.error("Error analyzing receipt for discounts:", err);
        showNotification("영수증 분석 중 오류가 발생했습니다.", "error");
    } finally {
        setIsReceiptAiLoading(false);
    }
  };

  const handleSaveAnalyzedReceipt = () => {
      if (receiptAnalysisResult) {
          const { analyzedReceipt } = receiptAnalysisResult;
          const isDuplicate = receiptHistory.some(receipt => 
              receipt.storeName === analyzedReceipt.storeName &&
              receipt.date === analyzedReceipt.date &&
              receipt.totalAmount === analyzedReceipt.totalAmount
          );

          if (isDuplicate) {
              showNotification("이미 내역에 저장된 영수증입니다.", "info");
              setIsCurrentReceiptSaved(true); // Mark as saved even if it's a duplicate to update UI
              return;
          }

          const newReceipt: ReceiptData = {
              id: crypto.randomUUID(),
              ...analyzedReceipt
          };
          setReceiptHistory(prev => [newReceipt, ...prev]);
          showNotification("분석된 영수증이 내역에 저장되었습니다.", "success");
          setIsCurrentReceiptSaved(true);
      }
  };


  const toggleFavorite = (storeId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(storeId);
      if (isFav) {
        showNotification("찜 목록에서 삭제되었습니다.", "info");
        return prev.filter(id => id !== storeId);
      } else {
        showNotification("찜 목록에 추가되었습니다!", "success");
        return [...prev, storeId];
      }
    });
  };
  
  const closeModal = () => {
    const previousModalType = modalState.type;
    setModalState({ isOpen: false, type: null });
    setActiveView('explore');
     if (previousModalType === 'receiptAiAnalysis') {
        setReceiptAiImageFile(null);
        setReceiptAiPreviewUrl(null);
        setReceiptAnalysisResult(null);
        setIsCurrentReceiptSaved(false);
    }
  };

  const handleToggleNearbyMode = () => {
    if (isNearbyModeActive) {
      setIsNearbyModeActive(false);
      setUserLocation(null);
      setLocationError(null);
      showNotification("주변 검색 모드가 해제되었습니다.", "info");
    } else {
      setIsLocationLoading(true);
      setLocationError(null);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setIsNearbyModeActive(true);
            setIsLocationLoading(false);
            showNotification("사용자 위치를 확인했습니다. 주변 혜택을 정렬합니다.", "success");
          },
          (geoError: GeolocationPositionError) => { 
            let uiMessage = "위치 정보를 가져올 수 없습니다. ";
            switch (geoError.code) {
              case geoError.PERMISSION_DENIED: uiMessage += "위치 정보 접근 권한이 거부되었습니다."; break;
              case geoError.POSITION_UNAVAILABLE: uiMessage += "현재 위치를 확인할 수 없습니다."; break;
              case geoError.TIMEOUT: uiMessage += "위치 정보 요청 시간이 초과되었습니다."; break;
              default: uiMessage += (geoError.message || "알 수 없는 오류가 발생했습니다."); break;
            }
            setLocationError(uiMessage); 
            showNotification(uiMessage, "error");
            setIsLocationLoading(false);
            setIsNearbyModeActive(false); 
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        const message = "이 브라우저에서는 위치 정보 서비스를 지원하지 않습니다.";
        setLocationError(message);
        showNotification(message, "error");
        setIsLocationLoading(false);
      }
    }
  };
  
  const handleMenuNavigate = (view: string) => {
    setActiveView(view);
    switch (view) {
      case 'explore':
        closeModal();
        setSelectedCategory('all');
        setSearchTerm('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'ai':
        setAiRecommendations([]); 
        setUserPreferencesInput(''); 
        setModalState({ isOpen: true, type: 'aiRecommender' });
        break;
      case 'receipt-ai':
        setReceiptAnalysisResult(null);
        setReceiptAiImageFile(null);
        setReceiptAiPreviewUrl(null);
        setIsCurrentReceiptSaved(false);
        setModalState({ isOpen: true, type: 'receiptAiAnalysis' });
        break;
      case 'favorites':
        setModalState({ isOpen: true, type: 'favorites', data: stores.filter(s => favorites.includes(s.id)) });
        break;
      default:
        break;
    }
  };

  const renderModalContent = () => {
    if (!modalState.isOpen) return null;

    switch (modalState.type) {
      case 'storeDetails':
        const store = modalState.data as Store & { distance?: number };
        if (!store) return null;
        const categoryInfo = getCategoryInfo(store.category);
        return (
          <div className="space-y-4 text-white/90">
            <img src={store.imageUrl || `https://picsum.photos/seed/${store.id}/600/400`} alt={store.name} className="w-full h-64 object-cover rounded-lg mb-4 shadow-md"/>
            <p className="text-sm">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-white/10`}>
                    <i className={`mr-1 ${categoryInfo.icon}`}></i> {store.category}
                </span>
            </p>
            {store.rating && (
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (<i key={i} className={`fa-star ${i < Math.round(store.rating!) ? 'fas' : 'far'}`}></i>))}
                <span className="ml-2 text-white/80 font-semibold">{store.rating.toFixed(1)} / 5.0</span>
              </div>
            )}
            <p><i className="fas fa-map-marker-alt text-white/60 mr-2"></i><strong>주소:</strong> {store.address}</p>
            {isNearbyModeActive && userLocation && typeof store.distance === 'number' && store.distance !== Infinity && (
                 <p className="text-sm text-blue-300"><i className="fas fa-route mr-2 text-blue-300/80"></i><strong>거리:</strong> 약 {store.distance.toFixed(1)}km</p>
            )}
            {store.contact && <p><i className="fas fa-phone text-white/60 mr-2"></i><strong>연락처:</strong> {store.contact}</p>}
            {store.operatingHours && <p><i className="fas fa-clock text-white/60 mr-2"></i><strong>운영시간:</strong> {store.operatingHours}</p>}
            <h4 className="font-semibold text-lg mt-3 text-white border-t border-white/20 pt-3">제공 혜택:</h4>
            <ul className="list-disc list-inside space-y-2">
              {store.discounts.map((d: DiscountInfo) => (
                <li key={d.id}>
                  <p className="font-medium text-indigo-200">{d.description}</p>
                  <p className="text-xs text-white/60 pl-4">└ 조건: {d.conditions}</p>
                </li>
              ))}
            </ul>
             <button
                onClick={() => { toggleFavorite(store.id);}}
                className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-colors text-white ${favorites.includes(store.id) ? 'bg-red-500/50 hover:bg-red-500/70' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <i className={`fas fa-heart mr-2 ${favorites.includes(store.id) ? 'text-red-300' : ''}`}></i>
                {favorites.includes(store.id) ? '찜 해제' : '찜하기'}
            </button>
          </div>
        );
      case 'aiRecommender':
        return (
          <div className="space-y-4">
            <p className="text-sm text-white/80">원하는 할인 스타일이나 활동을 알려주시면 AI가 맞춤형 정보를 찾아드립니다!</p>
            <textarea
              className="w-full p-3 border border-white/20 rounded-md h-32 focus:ring-2 focus:ring-purple-400 bg-white/5 text-white placeholder-white/50"
              value={userPreferencesInput}
              onChange={(e) => setUserPreferencesInput(e.target.value)}
              placeholder="궁금한 점이나 선호하는 할인을 입력하세요..."
            />
            <button
              onClick={() => handleAiRecommend(userPreferencesInput)}
              disabled={isAiLoading}
              className="w-full bg-purple-500/80 hover:bg-purple-500/100 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isAiLoading ? <LoadingSpinner size="sm" /> : <><i className="fas fa-magic mr-2"></i>AI 추천받기</>}
            </button>

            {isAiLoading ? (
              <LoadingSpinner message="AI가 추천을 생성하는 중입니다..." />
            ) : aiRecommendations.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-semibold text-lg mb-2 text-white">추천 결과:</h4>
                  <ul className="space-y-2">
                    {aiRecommendations.map(recStore => (
                      <li key={recStore.id} className="p-3 bg-white/5 rounded-md hover:bg-white/10 cursor-pointer" onClick={() => { closeModal(); handleSelectStore(recStore);}}>
                        <p className="font-medium text-indigo-300">{recStore.name} <span className="text-xs text-white/60">({recStore.category})</span></p>
                        <p className="text-sm text-white/80 truncate">{recStore.discounts[0]?.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6 text-white/70">
                    <p>추천 결과가 여기에 표시됩니다.</p>
                </div>
              )
            }
          </div>
        );
      case 'ocrInput':
        return (
          <div className="space-y-4">
            <textarea
              className="w-full p-3 border border-white/20 rounded-md h-40 focus:ring-2 focus:ring-teal-400 bg-white/5 text-white placeholder-white/50"
              value={ocrInputText}
              onChange={(e) => setOcrInputText(e.target.value)}
              placeholder="영수증 내용을 입력하거나, 주요 항목을 설명해주세요."
            />
            <button
              onClick={handleOcrSubmit}
              disabled={isOcrLoading}
              className="w-full bg-teal-500/80 hover:bg-teal-500/100 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isOcrLoading ? <LoadingSpinner message="분석 중..." /> : <><i className="fas fa-edit mr-2"></i>텍스트로 영수증 등록</>}
            </button>
          </div>
        );
      case 'receiptAiAnalysis':
        return (
          <div className="space-y-4">
              {!receiptAnalysisResult && !isReceiptAiLoading && (
                  <>
                      <p className="text-sm text-white/80">영수증 사진을 올리면 내용을 분석하고, 관련된 할인 정보를 추천해 드립니다.</p>
                      <div>
                          <label htmlFor="receiptAiUpload" className="w-full cursor-pointer bg-white/5 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center p-6 hover:bg-white/10 transition-colors">
                              <i className="fas fa-cloud-upload-alt text-4xl text-white/70 mb-2"></i>
                              <span className="text-white font-semibold">이미지 선택하기</span>
                              <span className="text-xs text-white/60">또는 여기에 파일을 드래그하세요</span>
                          </label>
                          <input id="receiptAiUpload" type="file" accept="image/*" onChange={handleReceiptAiFileChange} className="hidden" />
                      </div>
                      {receiptAiPreviewUrl && (
                          <div className="mt-2 text-center">
                              <img src={receiptAiPreviewUrl} alt="영수증 미리보기" className="max-h-60 w-auto inline-block rounded-md border border-white/20" />
                          </div>
                      )}
                      <button onClick={handleAnalyzeReceiptForDiscounts} disabled={!receiptAiImageFile || isReceiptAiLoading} className="w-full bg-cyan-500/80 hover:bg-cyan-500/100 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors">
                          {isReceiptAiLoading ? <LoadingSpinner size="sm"/> : <><i className="fas fa-robot mr-2"></i>AI 분석 시작하기</>}
                      </button>
                  </>
              )}

              {isReceiptAiLoading && !receiptAnalysisResult && <LoadingSpinner message="AI가 영수증을 분석하고 있습니다..." />}
              
              {receiptAnalysisResult && (
                  <div className="space-y-6">
                      <div>
                          <h4 className="font-semibold text-lg mb-2 text-cyan-300">✔️ 분석된 영수증 정보</h4>
                          <div className="p-3 bg-white/5 rounded-lg space-y-1 text-sm">
                              <p><strong>가게:</strong> {receiptAnalysisResult.analyzedReceipt.storeName}</p>
                              <p><strong>날짜:</strong> {receiptAnalysisResult.analyzedReceipt.date}</p>
                              <p><strong>항목:</strong> {receiptAnalysisResult.analyzedReceipt.items.join(', ')}</p>
                              <p><strong>총액:</strong> {receiptAnalysisResult.analyzedReceipt.totalAmount}</p>
                          </div>
                          <button onClick={handleSaveAnalyzedReceipt} disabled={isCurrentReceiptSaved} className="w-full mt-2 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                             {isCurrentReceiptSaved
                                 ? <><i className="fas fa-check-circle mr-2 text-green-400"></i>저장되었습니다</>
                                 : <><i className="fas fa-save mr-2"></i>이 영수증 내역에 저장하기</>
                             }
                          </button>
                      </div>

                      {receiptAnalysisResult.immediateBenefits.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 text-green-300">🎉 지금 바로 받을 수 있는 혜택!</h4>
                            <ul className="space-y-3">
                                {receiptAnalysisResult.immediateBenefits.map((discount, index) => (
                                    <li key={`immediate-${index}`} className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                        <p className="font-semibold text-green-200">{discount.title}</p>
                                        <p className="text-sm text-white/80 mt-1 leading-relaxed">{discount.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                      )}

                      {receiptAnalysisResult.futureBenefits.length > 0 && (
                          <div>
                              <h4 className="font-semibold text-lg mb-2 text-purple-300">💡 이런 혜택은 어떠세요?</h4>
                              <ul className="space-y-3">
                                  {receiptAnalysisResult.futureBenefits.map((discount, index) => (
                                      <li key={`future-${index}`} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                          <p className="font-semibold text-indigo-300">{discount.title}</p>
                                          <p className="text-sm text-white/80 mt-1 leading-relaxed">{discount.description}</p>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                      
                      {receiptAnalysisResult.immediateBenefits.length === 0 && receiptAnalysisResult.futureBenefits.length === 0 && (
                         <p className="text-center py-4 text-white/70 text-sm">추천할만한 관련 할인 혜택을 찾지 못했습니다.</p>
                      )}
                  </div>
              )}
          </div>
        );
      case 'receiptHistory':
         const history = modalState.data as ReceiptData[];
         return (
            <div className="space-y-3">
            {history.length === 0 ? <p className="text-white/80">등록된 영수증 내역이 없습니다.</p> :
              history.map(receipt => (
                <div key={receipt.id} className="p-3 bg-white/5 rounded-lg">
                  <p className="font-semibold text-white">{receipt.storeName} <span className="text-xs text-white/60">({getCategoryInfo(receipt.storeCategory || Category.OTHER).label})</span></p>
                  <p className="text-sm text-white/80">항목: {receipt.items.join(', ')}</p>
                  <p className="text-sm text-green-300">할인: {receipt.discountApplied}</p>
                  <p className="text-sm text-white font-medium">총액: {receipt.totalAmount}</p>
                  <p className="text-xs text-white/50 mt-1">날짜: {receipt.date}</p>
                </div>
              ))
            }
            </div>
         );
      case 'favorites':
        const favStores = (modalState.data as Store[]) || stores.filter(s => favorites.includes(s.id));
        return (
            <div className="space-y-3">
            {favStores.length === 0 ? <p className="text-white/80">찜한 가게가 없습니다.</p> :
              favStores.map(store => (
                <div key={store.id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center cursor-pointer hover:bg-white/10" onClick={() => { closeModal(); handleSelectStore(store); }}>
                  <div>
                    <p className="font-semibold text-indigo-300">{store.name} <span className="text-xs text-white/60">({getCategoryInfo(store.category).label})</span></p>
                    <p className="text-sm text-white/80 truncate">{store.discounts[0]?.description}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(store.id); }} className="text-red-400 hover:text-red-300 text-lg p-1" aria-label="찜 해제">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))
            }
            </div>
        );
      default: return null;
    }
  };
  
  const getModalTitle = () => {
    switch (modalState.type) {
      case 'storeDetails': return (modalState.data as Store)?.name || "상세 정보";
      case 'aiRecommender': return "AI 맞춤 할인 추천";
      case 'ocrInput': return "영수증 등록 (텍스트)";
      case 'receiptAiAnalysis': return "AI 영수증 분석";
      case 'receiptHistory': return "나의 혜택 내역";
      case 'favorites': return "찜한 가게 목록";
      default: return "";
    }
  }

  return (
    <div className="min-h-screen text-white pb-32 sm:pb-24">
      <Header 
        isScrolled={isHeaderScrolled}
        onShowFavorites={() => handleMenuNavigate('favorites')}
        onShowReceiptHistory={() => setModalState({ isOpen: true, type: 'receiptHistory', data: receiptHistory })}
        favoriteCount={favorites.length}
      />
      <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="glass-panel rounded-3xl p-6 mb-8">
          <div className="flex flex-col items-center text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-1">학생 할인 정보</h2>
              <p className="text-white/80">다양한 조건으로 할인 혜택을 찾아보세요!</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
              <ActionButton icon="fas fa-location-arrow" text="내 주변 혜택" onClick={handleToggleNearbyMode} colorClass={isNearbyModeActive ? 'bg-blue-500/80' : 'bg-white/10'} isLoading={isLocationLoading} />
              <ActionButton icon="fas fa-magic" text="AI 추천" onClick={() => handleMenuNavigate('ai')} colorClass="bg-white/10" />
              <ActionButton icon="fas fa-edit" text="텍스트 영수증" onClick={() => setModalState({ isOpen: true, type: 'ocrInput' })} colorClass="bg-white/10" />
          </div>

          <div>
            <input 
              type="text"
              placeholder="상점 이름, 주소, 할인 내용 검색..."
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {locationError && <p className="text-red-400 text-sm mt-2 text-center">{locationError}</p>}
           {isNearbyModeActive && !locationError && userLocation && (
            <p className="text-blue-300 text-sm mt-2 text-center">
              <i className="fas fa-check-circle mr-1"></i>내 주변 기준으로 정렬되었습니다.
            </p>
          )}
        </div>
        
        <div className="mb-6 flex flex-wrap gap-2 items-center justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors glass-panel ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <i className="fas fa-list-ul mr-2"></i>전체
          </button>
          {CATEGORIES_WITH_INFO.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center glass-panel ${selectedCategory === cat.key ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <span className={`mr-2 ${cat.color}`}>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>
        
        {isLoading && <LoadingSpinner message="할인 정보를 불러오는 중입니다..."/>}
        {!isLoading && error && <p className="text-center text-red-400 text-lg">{error}</p>}
        
        {!isLoading && !error && filteredStores.length === 0 && (
          <div className="text-center py-10 glass-panel rounded-2xl">
            <i className="fas fa-ghost text-5xl text-white/50 mb-4"></i>
            <p className="text-xl text-white/80">선택한 조건에 맞는 할인 정보가 없습니다.</p>
            <p className="text-sm text-white/60 mt-1">다른 카테고리나 검색어를 사용해보세요.</p>
          </div>
        )}

        {!isLoading && !error && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map(store => (
              <StoreCard 
                key={store.id} 
                store={store as Store & { distance?: number }}
                onSelectStore={handleSelectStore}
                onToggleFavorite={toggleFavorite}
                isFavorite={favorites.includes(store.id)}
                showDistance={isNearbyModeActive && userLocation && typeof (store as Store & { distance?: number }).distance === 'number'}
                distance={(store as Store & { distance?: number }).distance}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-white/60 text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        <p>학생들의 스마트한 소비 생활을 응원합니다!</p>
      </footer>

      {modalState.isOpen && (
        <Modal 
            isOpen={modalState.isOpen} 
            onClose={closeModal} 
            title={getModalTitle()}
            size={(modalState.type === 'storeDetails' || modalState.type === 'receiptAiAnalysis') ? 'lg' : 'md'}
        >
          {renderModalContent()}
        </Modal>
      )}

      <MenuBar 
        activeView={activeView}
        onNavigate={handleMenuNavigate}
        favoriteCount={favorites.length}
      />
    </div>
  );
};

export default App;