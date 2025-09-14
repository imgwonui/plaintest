import React from 'react';
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
import { getUserDisplayLevel } from '../services/userLevelService';

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

const Card: React.FC<CardProps> = ({
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
  const linkTo = type === 'story' ? `/story/${id}` : `/lounge/${id}`;
  
  const getBadgeVariant = (loungeType?: string) => {
    switch (loungeType) {
      case 'question': return 'blue';
      case 'experience': return 'green';
      case 'info': return 'purple';
      case 'free': return 'gray';
      case 'news': return 'orange';
      case 'advice': return 'teal';
      case 'recommend': return 'pink';
      case 'anonymous': return 'red';
      default: return 'gray';
    }
  };

  const getBadgeText = (loungeType?: string) => {
    switch (loungeType) {
      case 'question': return '질문/Q&A';
      case 'experience': return '경험담/사연 공유';
      case 'info': return '정보·팁 공유';
      case 'free': return '자유글/잡담';
      case 'news': return '뉴스에 한마디';
      case 'advice': return '같이 고민해요';
      case 'recommend': return '추천해주세요';
      case 'anonymous': return '익명 토크';
      default: return '';
    }
  };

  const getTagVariant = (index: number) => {
    const variants = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
    return variants[index % variants.length];
  };

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
          <Image
            src={imageUrl}
            alt={title}
            w="full"
            h="200px"
            objectFit="cover"
          />
        )}
        
        <VStack align="stretch" p={5} spacing={3}>
          <VStack align="stretch" spacing={2}>
            <VStack align="stretch" spacing={2}>
              {type === 'lounge' && loungeType && (
                <HStack>
                  <Badge colorScheme={getBadgeVariant(loungeType)} size="sm">
                    {getBadgeText(loungeType)}
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
                {stripHtmlTags(summary)}
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
                    authorId && (
                      <LevelBadge 
                        level={getUserDisplayLevel(authorId).level} 
                        size="xs" 
                        variant="subtle"
                        showIcon={true}
                      />
                    )
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

export default Card;