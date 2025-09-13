import React from 'react';
import {
  Container,
  VStack,
  Text,
  Heading,
  Divider,
  useColorMode,
} from '@chakra-ui/react';

const Privacy: React.FC = () => {
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
            개인정보처리방침
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
            제1조 (총칙)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
          >
            (주)월급날은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 <Text as="span" color="brand.500" fontWeight="600">Plain</Text> 서비스 이용 과정에서 수집·이용되는 개인정보의 처리 기준을 설명합니다.
          </Text>
        </VStack>

        {/* 제2조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제2조 (수집하는 개인정보 항목 및 수집 방법)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              fontWeight="600"
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              lineHeight="1.8"
            >
              1. 수집 항목
            </Text>
            <VStack spacing={2} align="stretch" pl={4}>
              <Text 
                fontSize="md" 
                color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                lineHeight="1.8"
              >
                • 회원 가입 시: 이름, 이메일, 비밀번호, 소속(회사명), 직무 정보
              </Text>
              <Text 
                fontSize="md" 
                color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                lineHeight="1.8"
              >
                • 서비스 이용 시: 접속 로그, 쿠키, IP 정보, 이용 기록
              </Text>
            </VStack>
            <Text 
              fontSize="md" 
              fontWeight="600"
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              lineHeight="1.8"
            >
              2. 수집 방법
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
              pl={4}
            >
              • 홈페이지 회원가입, 문의하기, 게시글 작성, 쿠키 자동 생성 등
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
            제3조 (개인정보의 이용 목적)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
          >
            회사는 수집한 개인정보를 다음 목적에 한정하여 이용합니다.
          </Text>
          <VStack spacing={2} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. 서비스 제공 및 운영 관리
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. 회원 식별 및 인증, 부정 이용 방지
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              3. 고객 상담 및 문의 응대
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              4. 법령 및 규제 준수 의무 이행
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
            제4조 (개인정보의 보유 및 이용 기간)
          </Text>
          <VStack spacing={3} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              1. 회원 탈퇴 시 지체 없이 파기합니다.
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              2. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우(예: 전자상거래법, 국세기본법 등)는 해당 기간 동안 보관 후 파기합니다.
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
            제5조 (개인정보의 제3자 제공)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            회사는 원칙적으로 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 근거하거나 수사기관의 요청이 있을 경우 예외로 합니다.
          </Text>
        </VStack>

        {/* 제6조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제6조 (개인정보의 처리 위탁)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            회사는 원활한 서비스 제공을 위해 필요한 경우, 개인정보 처리 업무의 일부를 외부 전문 업체에 위탁할 수 있으며, 이 경우 위탁 업체와의 계약을 통해 안전하게 관리합니다.
          </Text>
        </VStack>

        {/* 제7조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제7조 (정보주체의 권리와 행사 방법)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있으며, 회사는 이에 지체 없이 조치합니다.
          </Text>
        </VStack>

        {/* 제8조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제8조 (개인정보의 파기 절차 및 방법)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            보유 기간이 지난 개인정보는 지체 없이 복구 불가능한 방법으로 안전하게 파기합니다.
          </Text>
        </VStack>

        {/* 제9조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제9조 (개인정보 보호책임자)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
          >
            이용자의 개인정보를 보호하고 관련 불만을 처리하기 위해 아래와 같이 개인정보 보호책임자를 지정합니다.
          </Text>
          <VStack spacing={2} align="stretch" pl={4}>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              • 이름: ○○○
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              • 직책: 개인정보 보호책임자
            </Text>
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
              lineHeight="1.8"
            >
              • 연락처: privacy@wolgeupnal.co.kr
            </Text>
          </VStack>
        </VStack>

        {/* 제10조 */}
        <VStack spacing={4} align="stretch">
          <Text 
            fontSize="lg" 
            fontWeight="600" 
            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          >
            제10조 (개인정보 처리방침의 변경)
          </Text>
          <Text 
            fontSize="md" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            lineHeight="1.8"
            pl={4}
          >
            법령 변경이나 서비스 개선을 위해 본 방침이 변경될 수 있으며, 변경 사항은 <Text as="span" color="brand.500" fontWeight="600">Plain</Text> 서비스 내 공지를 통해 안내합니다.
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

export default Privacy;