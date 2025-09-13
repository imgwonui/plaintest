import React from 'react';
import {
  Container,
  VStack,
  Text,
  Heading,
  Divider,
  useColorMode,
} from '@chakra-ui/react';

const About: React.FC = () => {
  const { colorMode } = useColorMode();

  return (
    <Container maxW="800px" py={12}>
      <VStack spacing={10} align="stretch">
        {/* 헤더 */}
        <VStack spacing={6} align="center" textAlign="center">
          <Heading 
            as="h1" 
            size="2xl" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            fontWeight="700"
          >
            서비스 소개
          </Heading>
        </VStack>

        {/* 메인 소개 */}
        <VStack spacing={8} align="stretch">
          <Text 
            fontSize="xl" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            lineHeight="1.8"
          >
            페이롤 아웃소싱 전문회사 (주)월급날에서 인사담당자들을 위해 직접 개발하고 운영하는 서비스, <Text as="span" color="brand.500" fontWeight="700">Plain</Text>입니다.
          </Text>
          
          <Text 
            fontSize="lg" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
          >
            국내 수많은 기업의 급여 및 인사관리 업무를 지원해온 (주)월급날은 현장에서 느낀 인사담당자들의 어려움과 필요를 누구보다 잘 알고 있습니다. 현업 담당자들이 서로의 경험을 나누고 최신 동향을 공유할 수 있는 신뢰성 있는 공간을 만들고자 Plain을 선보였습니다.
          </Text>
        </VStack>

        <Divider />

        {/* Plain 구성 */}
        <VStack spacing={6} align="stretch">
          <Heading 
            as="h2" 
            size="lg" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            Plain은 두 가지 축으로 구성됩니다.
          </Heading>

          <Text 
            fontSize="lg" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            lineHeight="1.8"
          >
            • <Text as="span" color="brand.500" fontWeight="700">Story</Text> : 인사·노무·급여 관련 전문 지식과 최신 이슈를 깊이 있게 다루는 콘텐츠 공간입니다. 법규 해석, 실무 팁, 트렌드 분석 등 인사담당자들이 놓치기 쉬운 부분을 쉽고 명확하게 전달합니다.
          </Text>

          <Text 
            fontSize="lg" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            lineHeight="1.8"
          >
            • <Text as="span" color="brand.500" fontWeight="700">Lounge</Text> : 현업 인사담당자들이 자유롭게 질문하고 사례를 공유하는 커뮤니티 공간입니다. 실무에서 마주하는 다양한 문제와 고민을 서로 나누며, 더 나은 해법을 함께 찾아갑니다.
          </Text>
        </VStack>

        <Divider />

        {/* Plain의 가치 */}
        <VStack spacing={6} align="stretch">
          <Text 
            fontSize="lg" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            lineHeight="1.8"
          >
            Plain은 단순한 정보 채널이 아닌 인사담당자를 위한 <Text as="span" color="brand.500" fontWeight="700">전문 커뮤니티이자 지식 플랫폼</Text>입니다. 축적된 경험과 데이터, 그리고 (주)월급날의 노하우가 더해져, 사용자 여러분이 인사 업무를 보다 효율적이고 자신 있게 수행할 수 있도록 돕습니다.
          </Text>
        </VStack>

        <Divider />

        {/* 미래 비전 */}
        <VStack spacing={6} align="stretch">
          <Text 
            fontSize="lg" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            lineHeight="1.8"
          >
            앞으로도 Plain은 <Text as="span" color="brand.500" fontWeight="700">"인사담당자를 가장 잘 이해하는 동반자"</Text>로서, 현장의 목소리를 담고 전문성을 강화하여, <Text as="span" color="brand.500" fontWeight="700">업계 최초이자 최고의 인사 커뮤니티</Text>로 성장해 나가겠습니다.
          </Text>
        </VStack>

        {/* 회사 정보 */}
        <VStack spacing={4} align="center" pt={8}>
          <Divider />
          <VStack spacing={2} align="center">
            <Text 
              fontSize="lg" 
              fontWeight="700"
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            >
              (주)월급날
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
            >
              페이롤 아웃소싱 전문회사
            </Text>
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
};

export default About;