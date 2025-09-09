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
}) => {
  const { colorMode } = useColorMode();
  const linkTo = type === 'story' ? `/story/${id}` : `/lounge/${id}`;
  
  const getBadgeVariant = (loungeType?: string) => {
    switch (loungeType) {
      case 'question': return 'question';
      case 'experience': return 'experience';
      case 'info': return 'help';
      case 'free': return 'story';
      case 'news': return 'orange';
      case 'advice': return 'purple';
      case 'recommend': return 'green';
      case 'anonymous': return 'gray';
      default: return 'story';
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
            {type === 'lounge' && loungeType && (
              <HStack>
                <Badge variant={getBadgeVariant(loungeType)} size="sm">
                  {getBadgeText(loungeType)}
                </Badge>
                {isExcellent && (
                  <Badge variant="excellent" size="sm">
                    우수
                  </Badge>
                )}
              </HStack>
            )}
            
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
                {summary}
              </Text>
            )}
          </VStack>

          <HStack spacing={2} flexWrap="wrap">
            {tags.slice(0, 3).map((tag, index) => (
              <Tag key={index} size="sm" variant={getTagVariant(index)}>
                <TagLabel>{tag}</TagLabel>
              </Tag>
            ))}
          </HStack>

          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between" fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'}>
              <Text>{dayjs(createdAt).format('YYYY.MM.DD')}</Text>
              
              {type === 'lounge' && (
                <HStack spacing={3}>
                  {likeCount !== undefined && (
                    <Text>좋아요 {likeCount}</Text>
                  )}
                  {commentCount !== undefined && (
                    <Text>댓글 {commentCount}</Text>
                  )}
                  {scrapCount !== undefined && (
                    <Text>스크랩 {scrapCount}</Text>
                  )}
                </HStack>
              )}
            </HStack>
            
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