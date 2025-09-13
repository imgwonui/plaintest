import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { userLevelService, getUserDisplayLevel } from '../services/userLevelService';
import { useAuth } from './AuthContext';
import LevelUpModal from '../components/LevelUpModal';

interface LevelUpData {
  userId: number;
  previousLevel: number;
  newLevel: number;
  newExp: number;
  earnedExp: number;
  activityType: string;
}

interface LevelUpContextType {
  showLevelUpModal: (data: Omit<LevelUpData, 'newExp'>) => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

interface LevelUpProviderProps {
  children: ReactNode;
}

export const LevelUpProvider: React.FC<LevelUpProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 전역 레벨업 이벤트 리스너 등록
  useEffect(() => {
    const cleanup = userLevelService.onLevelUp((eventData) => {
      // 현재 로그인한 사용자의 레벨업만 처리
      if (!user || eventData.userId !== user.id) {
        return;
      }

      // 사용자의 현재 경험치 정보 가져오기
      const userLevelInfo = getUserDisplayLevel(eventData.userId);
      
      // 레벨업 모달 데이터 설정
      setLevelUpData({
        userId: eventData.userId,
        previousLevel: eventData.oldLevel,
        newLevel: eventData.newLevel,
        newExp: userLevelInfo.totalExp,
        earnedExp: 0, // 이 값은 showLevelUpModal에서 설정됨
        activityType: 'general' // 이 값도 showLevelUpModal에서 설정됨
      });
      
      setIsModalOpen(true);
    });

    return cleanup;
  }, [user]);

  // 수동으로 레벨업 모달 표시 (특정 활동 후)
  const showLevelUpModal = (data: Omit<LevelUpData, 'newExp'>) => {
    if (!user || data.userId !== user.id) {
      return;
    }

    const userLevelInfo = getUserDisplayLevel(data.userId);
    
    setLevelUpData({
      ...data,
      newExp: userLevelInfo.totalExp
    });
    
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setLevelUpData(null);
  };

  const contextValue: LevelUpContextType = {
    showLevelUpModal
  };

  return (
    <LevelUpContext.Provider value={contextValue}>
      {children}
      
      {/* 전역 레벨업 모달 */}
      {levelUpData && (
        <LevelUpModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          previousLevel={levelUpData.previousLevel}
          newLevel={levelUpData.newLevel}
          newExp={levelUpData.newExp}
          earnedExp={levelUpData.earnedExp}
          activityType={levelUpData.activityType}
        />
      )}
    </LevelUpContext.Provider>
  );
};

// 커스텀 훅
export const useLevelUp = () => {
  const context = useContext(LevelUpContext);
  if (context === undefined) {
    throw new Error('useLevelUp must be used within a LevelUpProvider');
  }
  return context;
};

// 레벨업 훅 (활동 기반)
export const useActivityLevelUp = () => {
  const { user } = useAuth();
  const { showLevelUpModal } = useLevelUp();

  const triggerActivityLevelUp = (activityType: string, amount: number = 1) => {
    if (!user) return;

    // 현재 레벨 정보 저장
    const beforeLevelInfo = getUserDisplayLevel(user.id);
    
    // 활동 업데이트
    const result = userLevelService.updateUserActivity(user.id, activityType, amount);
    
    // 레벨업이 발생한 경우 모달 표시
    if (result.leveledUp && result.newLevel) {
      const earnedExp = userLevelService.getActivityExpGain(activityType, amount);
      
      showLevelUpModal({
        userId: user.id,
        previousLevel: beforeLevelInfo.level,
        newLevel: result.newLevel,
        earnedExp,
        activityType
      });
    }
  };

  return { triggerActivityLevelUp };
};