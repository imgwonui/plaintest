// 연결 상태 표시 컴포넌트
// 데이터베이스 연결 문제를 사용자에게 알리고 재시도 옵션 제공

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Spinner,
  useColorMode,
  Collapse,
  IconButton
} from '@chakra-ui/react';
import { RepeatIcon, ChevronDownIcon, ChevronUpIcon, WarningIcon } from '@chakra-ui/icons';
import { Z_INDEX_LAYERS } from '../utils/zIndexLayers';

export interface ConnectionStatus {
  isOnline: boolean;
  lastSuccess: Date | null;
  errorCount: number;
  retryCount: number;
  isRetrying: boolean;
  errorMessage?: string;
}

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  onRetry,
  onDismiss,
  showDetails = false
}) => {
  const { colorMode } = useColorMode();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // 온라인 상태면 표시하지 않음
  if (status.isOnline && status.errorCount === 0) {
    return null;
  }
  
  // 상태에 따른 알림 타입 결정
  const getAlertStatus = () => {
    if (status.isRetrying) return 'info';
    if (status.isOnline && status.errorCount > 0) return 'warning';
    return 'error';
  };
  
  // 상태 메시지 생성
  const getStatusMessage = () => {
    if (status.isRetrying) {
      return `데이터베이스 연결을 재시도하는 중... (${status.retryCount}번째 시도)`;
    }
    
    if (status.isOnline) {
      return '연결이 복구되었습니다. 이전 데이터를 표시하고 있을 수 있습니다.';
    }
    
    return '데이터베이스 연결에 문제가 있습니다. 이전에 저장된 데이터를 표시하고 있습니다.';
  };
  
  // 마지막 성공 시간 포맷
  const getLastSuccessText = () => {
    if (!status.lastSuccess) return '알 수 없음';
    
    const now = new Date();
    const diff = now.getTime() - status.lastSuccess.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return status.lastSuccess.toLocaleDateString();
  };
  
  return (
    <Box position="relative" mb={4} zIndex={Z_INDEX_LAYERS.CONTENT}>
      <Alert 
        status={getAlertStatus()} 
        variant="solid"
        borderRadius="md"
        bg={
          getAlertStatus() === 'error' ? '#e53e3e' :
          getAlertStatus() === 'warning' ? '#d69e2e' :
          '#3182ce'
        }
      >
        <AlertIcon />
        <VStack align="flex-start" flex="1" spacing={2}>
          <HStack justify="space-between" w="100%">
            <AlertTitle fontSize="md" color="white">
              {status.isRetrying ? '연결 재시도 중' : 
               status.isOnline ? '연결 복구됨' : 
               '연결 문제 발생'}
            </AlertTitle>
            
            <HStack spacing={2}>
              {/* 에러 카운트 뱃지 */}
              {status.errorCount > 0 && (
                <Badge 
                  colorScheme="red" 
                  variant="solid"
                  fontSize="xs"
                  bg="rgba(255, 255, 255, 0.2)"
                  color="white"
                >
                  에러 {status.errorCount}회
                </Badge>
              )}
              
              {/* 재시도 버튼 */}
              {!status.isRetrying && onRetry && (
                <Button
                  size="sm"
                  leftIcon={<RepeatIcon />}
                  onClick={onRetry}
                  variant="outline"
                  color="white"
                  borderColor="rgba(255, 255, 255, 0.3)"
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                  }}
                >
                  재시도
                </Button>
              )}
              
              {/* 로딩 스피너 */}
              {status.isRetrying && (
                <Spinner size="sm" color="white" thickness="2px" />
              )}
              
              {/* 상세 정보 토글 */}
              {showDetails && (
                <IconButton
                  aria-label="상세 정보 토글"
                  icon={isDetailsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                />
              )}
            </HStack>
          </HStack>
          
          <AlertDescription color="white" fontSize="sm" opacity={0.9}>
            {getStatusMessage()}
          </AlertDescription>
        </VStack>
      </Alert>
      
      {/* 상세 정보 */}
      {showDetails && (
        <Collapse in={isDetailsOpen} animateOpacity>
          <Box
            mt={2}
            p={4}
            bg={colorMode === 'dark' ? '#2d3748' : '#f7fafc'}
            borderRadius="md"
            border={`1px solid ${colorMode === 'dark' ? '#4a5568' : '#e2e8f0'}`}
          >
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="sm" fontWeight="semibold" color={colorMode === 'dark' ? 'gray.100' : 'gray.700'}>
                연결 상태 세부 정보
              </Text>
              
              <VStack align="flex-start" spacing={2} fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                <HStack>
                  <Text fontWeight="medium">현재 상태:</Text>
                  <Badge colorScheme={status.isOnline ? 'green' : 'red'}>
                    {status.isOnline ? '온라인' : '오프라인'}
                  </Badge>
                </HStack>
                
                <HStack>
                  <Text fontWeight="medium">마지막 성공:</Text>
                  <Text>{getLastSuccessText()}</Text>
                </HStack>
                
                <HStack>
                  <Text fontWeight="medium">총 에러 횟수:</Text>
                  <Text>{status.errorCount}회</Text>
                </HStack>
                
                <HStack>
                  <Text fontWeight="medium">재시도 횟수:</Text>
                  <Text>{status.retryCount}회</Text>
                </HStack>
                
                {status.errorMessage && (
                  <VStack align="flex-start" spacing={1}>
                    <Text fontWeight="medium">최근 에러 메시지:</Text>
                    <Text 
                      fontSize="xs" 
                      fontFamily="mono"
                      p={2}
                      bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                      borderRadius="md"
                      wordBreak="break-word"
                    >
                      {status.errorMessage}
                    </Text>
                  </VStack>
                )}
              </VStack>
              
              {/* 도움말 메시지 */}
              <Box 
                p={3} 
                bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} 
                borderRadius="md"
                borderLeft="4px solid"
                borderLeftColor="blue.400"
              >
                <HStack align="flex-start" spacing={3}>
                  <WarningIcon color="blue.400" mt={0.5} />
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold" color={colorMode === 'dark' ? 'blue.200' : 'blue.700'}>
                      사용자 안내
                    </Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'blue.300' : 'blue.600'}>
                      • 현재 이전에 저장된 데이터를 표시하고 있습니다.<br />
                      • 새로운 게시글이나 댓글이 반영되지 않을 수 있습니다.<br />
                      • 잠시 후 자동으로 다시 시도하거나 '재시도' 버튼을 클릭하세요.<br />
                      • 문제가 계속되면 페이지를 새로고침해 주세요.
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// 연결 상태 관리 훅
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: true,
    lastSuccess: new Date(),
    errorCount: 0,
    retryCount: 0,
    isRetrying: false
  });
  
  // 에러 발생 시 상태 업데이트
  const reportError = (error: Error) => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      errorCount: prev.errorCount + 1,
      errorMessage: error.message
    }));
  };
  
  // 재시도 시작
  const startRetry = () => {
    setStatus(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));
  };
  
  // 성공 시 상태 업데이트
  const reportSuccess = () => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      lastSuccess: new Date(),
      isRetrying: false
    }));
  };
  
  // 재시도 완료 (실패 시)
  const endRetry = () => {
    setStatus(prev => ({
      ...prev,
      isRetrying: false
    }));
  };
  
  return {
    status,
    reportError,
    startRetry,
    reportSuccess,
    endRetry
  };
};

export default ConnectionStatusIndicator;