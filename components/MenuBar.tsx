import React, { useState, useRef, useEffect } from 'react';

const menuItems = [
  { id: 'explore', label: '둘러보기', icon: 'fas fa-compass' },
  { id: 'ai', label: 'AI 추천', icon: 'fas fa-magic' },
  { id: 'receipt-ai', label: '영수증 AI', icon: 'fas fa-receipt' },
  { id: 'favorites', label: '찜 목록', icon: 'fas fa-heart' },
];

interface MenuBarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  favoriteCount: number;
}

const MenuBar: React.FC<MenuBarProps> = ({ activeView, onNavigate, favoriteCount }) => {
  const [indicatorStyle, setIndicatorStyle] = useState<{ opacity: number; left?: number; width?: number; }>({ opacity: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // useLayoutEffect를 useEffect로 변경하여 DOM 요소의 크기와 위치가 완전히 계산된 후 스타일을 적용합니다.
  // 이를 통해 초기 렌더링 시 인디케이터 위치 오류를 해결합니다.
  useEffect(() => {
    // 활성 탭을 찾고, 유효하지 않은 경우 기본값으로 '둘러보기'를 사용합니다.
    let activeIndex = menuItems.findIndex(item => item.id === activeView);
    if (activeIndex === -1) {
      activeIndex = 0; // '둘러보기'로 기본 설정
    }
    
    const activeTabNode = tabsRef.current[activeIndex];
    
    if (activeTabNode) {
        // useEffect는 페인트 이후에 실행되므로, 이 시점에는 요소의 크기가 정확합니다.
        setIndicatorStyle({
            opacity: 1,
            left: activeTabNode.offsetLeft,
            width: activeTabNode.offsetWidth,
        });
    }
  }, [activeView]); // activeView가 변경될 때만 이 효과를 다시 실행합니다.

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div 
        className="relative glass-panel flex items-center p-1.5 rounded-full shadow-lg"
      >
        <div
          className="absolute h-[85%] bg-white/25 backdrop-blur-sm rounded-full"
          style={{ 
            ...indicatorStyle, 
            transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.2s ease-in-out', 
            top: '50%', 
            transform: 'translateY(-50%)'
          }}
        ></div>

        {menuItems.map((item, index) => (
          <button
            key={item.id}
            ref={el => { tabsRef.current[index] = el; }}
            onClick={() => onNavigate(item.id)}
            className={`relative z-10 flex flex-col items-center justify-center w-20 h-14 rounded-full transition-colors duration-300 text-center px-2 group`}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
             <div className="relative">
                <i className={`${item.icon} text-xl transition-all duration-300 ${
                    activeView === item.id ? 'text-blue-400' : 'text-white/70 group-hover:text-white'
                }`}></i>
                {item.id === 'favorites' && favoriteCount > 0 && (
                     <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-blue-400 ring-2 ring-[#1f2029]"></span>
                )}
            </div>
            <span className={`text-xs font-semibold mt-1 transition-colors duration-300 ${
              activeView === item.id ? 'text-blue-400' : 'text-white/70 group-hover:text-white'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuBar;