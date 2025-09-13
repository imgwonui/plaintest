import React from 'react';
import {
  Container,
  VStack,
  Text,
  Heading,
  Divider,
  useColorMode,
} from '@chakra-ui/react';

const Terms: React.FC = () => {
  const { colorMode } = useColorMode();

  return (
    <Container maxW="800px" py={12}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={6} align="center" textAlign="center">
          <Heading 
            as="h1" 
            size="2xl" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            fontWeight="700"
          >
            이용약관
          </Heading>
        </VStack>

        <Divider />

        {/* 제1조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제1조 (목적)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
          >
            이 약관은 (주)월급날이 운영하는 <Text as="span" color="brand.500" fontWeight="600">Plain</Text> 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </Text>
        </VStack>

        {/* 제2조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제2조 (정의)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. "서비스"란 회사가 제공하는 <Text as="span" color="brand.500" fontWeight="600">Plain</Text> 웹사이트 및 관련 부가 서비스를 의미합니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. "이용자"란 본 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
            </Text>
          </VStack>
        </VStack>

        {/* 제3조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제3조 (약관의 효력 및 변경)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. 본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다.
            </Text>
          </VStack>
        </VStack>

        {/* 제4조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제4조 (이용자의 의무)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. 이용자는 법령, 본 약관, 서비스 이용 안내 및 회사가 공지하는 사항을 준수해야 합니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. 타인의 정보를 도용하거나 허위 정보를 기재해서는 안 됩니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              3. 서비스 내 게시물 작성 시, 저작권·초상권 등 제3자의 권리를 침해해서는 안 됩니다.
            </Text>
          </VStack>
        </VStack>

        {/* 제5조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제5조 (회사의 의무)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. 회사는 안정적이고 지속적인 서비스 제공을 위해 최선을 다합니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. 회사는 이용자의 개인정보를 보호하기 위해 관련 법령을 준수합니다.
            </Text>
          </VStack>
        </VStack>

        {/* 제6조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제6조 (서비스의 변경 및 중단)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            회사는 운영상, 기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 이 경우 사전에 공지합니다.
          </Text>
        </VStack>

        {/* 제7조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제7조 (저작권 및 지식재산권)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            서비스 내 제공되는 모든 콘텐츠의 저작권은 회사 또는 원저작자에게 있으며, 이용자는 이를 무단 복제·배포할 수 없습니다.
          </Text>
        </VStack>

        {/* 제8조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제8조 (면책조항)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            천재지변, 불가항력적 사유 등 회사의 합리적인 통제를 벗어난 사유로 발생한 서비스 장애에 대해 회사는 책임을 지지 않습니다.
          </Text>
        </VStack>

        {/* 제9조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제9조 (준거법 및 재판관할)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            본 약관은 대한민국 법령에 따르며, 서비스 이용과 관련하여 분쟁이 발생한 경우 회사 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
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

export default Terms;