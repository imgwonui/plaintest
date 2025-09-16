import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  Box,
  Card as ChakraCard,
  CardBody,
  Image,
  Text,
  HStack,
  VStack,
  Badge,
  Tag,
  TagLabel,
  useColorMode,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getTagById } from '../data/tags';
import LevelBadge from './UserLevel/LevelBadge';
import PromotionBadge from './PromotionBadge';
import { getAuthorLevelFast } from '../services/enhancedDataService';
import OptimizedImage from './OptimizedImage';

// HTML 태그를 제거하는 유틸리티 함수
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  // HTML 태그 제거
  let stripped = html.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  stripped = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // 여러 공백을 하나로 정리
  stripped = stripped.replace(/\s+/g, ' ').trim();
  
  // 길이 제한 (카드에 맞게)
  if (stripped.length > 150) {
    stripped = stripped.substring(0, 147) + '...';
  }
  
  return stripped;
};

// 최적화된 카드 작성자 레벨 표시 컴포넌트 - 배치 로딩 사용
const CardAuthorLevel: React.FC<{ authorId: string }> = memo(({ authorId }) => {
  const [authorLevel, setAuthorLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 레벨 로드 - 향상된 데이터 서비스 사용
  useEffect(() => {
    const loadLevel = async () => {
      if (!authorId) {
        setAuthorLevel(1);
        return;
      }

      try {
        setIsLoading(true);
        // 배치 처리를 통한 빠른 로딩
        const level = await getAuthorLevelFast(authorId);
        setAuthorLevel(level);
      } catch (error) {
        console.warn('카드 작성자 레벨 로드 실패:', error);
        setAuthorLevel(1);
      } finally {
        setIsLoading(false);
      }
    };

    loadLevel();
  }, [authorId]);

  // 레벨업 이벤트 리스너
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`📈 카드 작성자 레벨업 반영: ${authorId} LV${event.detail.oldLevel} → LV${event.detail.newLevel}`);
        setAuthorLevel(event.detail.newLevel);
      }
    };

    // 캐시 무효화 이벤트 리스너
    const handleCacheInvalidated = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`🔄 카드 작성자 캐시 무효화됨, 레벨 새로고침: ${authorId}`);
        // 향상된 서비스를 통해 빠르게 새로고침
        getAuthorLevelFast(authorId).then(level => {
          setAuthorLevel(level);
        }).catch(error => {
          console.warn('카드 작성자 캐시 무효화 후 레벨 로드 실패:', error);
        });
      }
    };

    if (typeof window !== 'undefined' && authorId) {
      window.addEventListener('userLevelUp', handleLevelUp as EventListener);
      window.addEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      return () => {
        window.removeEventListener('userLevelUp', handleLevelUp as EventListener);
        window.removeEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      };
    }
  }, [authorId]);

  if (isLoading) {
    return <LevelBadge level={1} size="xs" variant="subtle" showIcon={true} />;
  }

  return (
    <LevelBadge
      level={authorLevel}
      size="xs"
      variant="subtle"
      showIcon={true}
    />
  );
});

CardAuthorLevel.displayName = 'CardAuthorLevel';

interface CardProps {
  type: 'story' | 'lounge';
  id: number;
  title: string;
  summary?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  readTime?: number;
  loungeType?: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous';
  isExcellent?: boolean;
  likeCount?: number;
  commentCount?: number;
  scrapCount?: number;
  author?: string;
  authorId?: number;
  authorVerified?: boolean;
  promotionStatus?: 'eligible' | 'pending' | 'approved' | 'rejected' | null;
  promotionNote?: string;
}

// Badge variant mapping - 메모이제이션을 위해 컴포넌트 외부로 이동
const BADGE_VARIANT_MAP: Record<string, string> = {
  'question': 'blue',
  'experience': 'green',
  'info': 'purple',
  'free': 'gray',
  'news': 'orange',
  'advice': 'teal',
  'recommend': 'pink',
  'anonymous': 'red'
};

const BADGE_TEXT_MAP: Record<string, string> = {
  'question': '질문/Q&A',
  'experience': '경험담/사연 공유',
  'info': '정보·팁 공유',
  'free': '자유글/잡담',
  'news': '뉴스에 한마디',
  'advice': '같이 고민해요',
  'recommend': '추천해주세요',
  'anonymous': '익명 토크'
};

const TAG_VARIANTS = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];

const CardComponent: React.FC<CardProps> = ({
  type,
  id,
  title,
  summary,
  imageUrl,
  tags,
  createdAt,
  readTime,
  loungeType,
  isExcellent,
  likeCount,
  commentCount,
  scrapCount,
  author,
  authorId,
  authorVerified,
  promotionStatus,
  promotionNote,
}) => {
  const { colorMode } = useColorMode();

  // 메모이제이션된 계산값들
  const linkTo = useMemo(() =>
    type === 'story' ? `/story/${id}` : `/lounge/${id}`, [type, id]
  );

  const badgeVariant = useMemo(() =>
    BADGE_VARIANT_MAP[loungeType || ''] || 'gray', [loungeType]
  );

  const badgeText = useMemo(() =>
    BADGE_TEXT_MAP[loungeType || ''] || '', [loungeType]
  );

  const getTagVariant = useCallback((index: number) =>
    TAG_VARIANTS[index % TAG_VARIANTS.length], []
  );

  // 요약 텍스트 메모이제이션
  const summaryText = useMemo(() =>
    summary ? stripHtmlTags(summary) : '', [summary]
  );

  return (
    <ChakraCard 
      as={Link} 
      to={linkTo} 
      _hover={{ textDecoration: 'none' }}
      bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
      border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
    >
      <CardBody p={0}>
        {imageUrl && (
          <OptimizedImage
            src={imageUrl}
            alt={title}
            width="full"
            height="200px"
            objectFit="cover"
            loading="lazy"
            placeholder="blur"
            priority={false}
            onError={(e) => {
              console.warn('Card image failed to load:', imageUrl);
            }}
          />
        )}
        
        <VStack align="stretch" p={5} spacing={3}>
          <VStack align="stretch" spacing={2}>
            <VStack align="stretch" spacing={2}>
              {type === 'lounge' && loungeType && (
                <HStack>
                  <Badge colorScheme={badgeVariant} size="sm">
                    {badgeText}
                  </Badge>
                  {isExcellent && (
                    <Badge variant="excellent" size="sm">
                      우수
                    </Badge>
                  )}
                </HStack>
              )}
              
              {/* Story 승격 상태 뱃지 */}
              {type === 'lounge' && promotionStatus && (
                <Box>
                  <PromotionBadge 
                    status={promotionStatus} 
                    note={promotionNote}
                    size="sm"
                  />
                </Box>
              )}
            </VStack>
            
            <Text
              fontSize="lg"
              fontWeight="600"
              lineHeight="1.4"
              noOfLines={2}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              wordBreak="break-word"
              whiteSpace="pre-wrap"
              overflowWrap="break-word"
            >
              {title}
            </Text>
            
            {summary && (
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                lineHeight="1.5"
                noOfLines={3}
              >
                {summaryText}
              </Text>
            )}
          </VStack>

          <HStack spacing={2} flexWrap="wrap">
            {tags.slice(0, 3).map((tagId, index) => {
              const tag = getTagById(tagId);
              return tag ? (
                <Tag key={index} size="sm" variant={getTagVariant(index)}>
                  <TagLabel>{tag.name}</TagLabel>
                </Tag>
              ) : null;
            })}
          </HStack>

          <VStack align="stretch" spacing={2}>
            {/* 작성자 정보 */}
            {author && (
              <HStack justify="space-between" align="center">
                <HStack spacing={2} align="center">
                  <Text 
                    fontSize="xs" 
                    color={colorMode === 'dark' ? '#9e9ea4' : '#7e7e87'}
                    fontWeight="500"
                  >
                    {author}
                  </Text>
                  {authorVerified ? (
                    <Badge colorScheme="green" size="sm">인사담당자</Badge>
                  ) : (
                    authorId && <CardAuthorLevel authorId={authorId} />
                  )}
                </HStack>
                <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'}>
                  {dayjs(createdAt).format('YYYY.MM.DD HH:mm')}
                </Text>
              </HStack>
            )}
            
            {!author && (
              <HStack justify="space-between" fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'}>
                <Text>{dayjs(createdAt).format('YYYY.MM.DD')}</Text>
              </HStack>
            )}
            
            {type === 'lounge' && (
              <HStack 
                justify="flex-start" 
                spacing={3}
                fontSize="xs" 
                color={colorMode === 'dark' ? '#7e7e87' : '#626269'}
              >
                {likeCount !== undefined && (
                  <Text>좋아요 {likeCount}</Text>
                )}
                {commentCount !== undefined && (
                  <Text>댓글 {commentCount}</Text>
                )}
                {scrapCount !== undefined && (
                  <Text>북마크 {scrapCount}</Text>
                )}
              </HStack>
            )}
            
            {type === 'story' && readTime && (
              <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#7e7e87'} fontStyle="italic">
                읽는 데에 {readTime}분 정도 걸려요
              </Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </ChakraCard>
  );
};

CardComponent.displayName = 'CardComponent';

// 메모이제이션 비교 함수 - 성능 최적화
const arePropsEqual = (prevProps: CardProps, nextProps: CardProps) => {
  // 기본적인 props 비교
  if (
    prevProps.id !== nextProps.id ||
    prevProps.title !== nextProps.title ||
    prevProps.imageUrl !== nextProps.imageUrl ||
    prevProps.likeCount !== nextProps.likeCount ||
    prevProps.commentCount !== nextProps.commentCount ||
    prevProps.scrapCount !== nextProps.scrapCount
  ) {
    return false;
  }

  // tags 배열 비교 (얕은 비교)
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  for (let i = 0; i < prevProps.tags.length; i++) {
    if (prevProps.tags[i] !== nextProps.tags[i]) {
      return false;
    }
  }

  return true;
};

const Card = memo(CardComponent, arePropsEqual);

export default Card;