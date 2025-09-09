import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#7A5AF8', // Main brand color
      600: '#6d48f7',
      700: '#5b21b6',
      800: '#4c1d95',
      900: '#3c1a78',
    },
    gray: {
      50: '#e4e4e5',   // 거의 흰색에 가까운 매우 밝은 회색
      100: '#c3c3c6',  // 매우 밝은 회색 (라이트 그레이)
      200: '#9e9ea4',  // 밝은 회색 (실버 그레이에 가까움)
      300: '#7e7e87',  // 밝은 중간 회색
      400: '#626269',  // 중간 회색 (뉴트럴 그레이)
      500: '#4d4d59',  // 중간 어두운 회색 (슬레이트 그레이)
      600: '#3c3c47',  // 어두운 회색 (차콜 그레이보다 약간 밝음)
      700: '#2c2c35',  // 매우 어두운 회색 (거의 검정에 가까운 차콜 그레이)
      800: '#1f1f26',  // 더 어두운 회색 (추가)
      900: '#0f0f14',  // 가장 어두운 회색 (추가)
    }
  },
  fonts: {
    heading: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`,
    body: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'gray.50' : 'gray.700',
        lineHeight: '1.6',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: '8px',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500',
            },
          },
        },
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.100',
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.50',
          },
        }),
        ghost: (props: any) => ({
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.50',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.600' : 'white',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.50',
          overflow: 'hidden',
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'gray.400' : 'gray.100',
            shadow: 'sm',
          },
          transition: 'all 0.2s',
        },
      }),
    },
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        fontSize: 'xs',
        fontWeight: '500',
        px: 2,
        py: 1,
      },
      variants: {
        story: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.50',
          color: props.colorMode === 'dark' ? 'brand.100' : 'brand.700',
        }),
        question: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.50',
          color: props.colorMode === 'dark' ? 'blue.100' : 'blue.700',
        }),
        experience: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'green.600' : 'green.50',
          color: props.colorMode === 'dark' ? 'green.100' : 'green.700',
        }),
        help: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'purple.600' : 'purple.50',
          color: props.colorMode === 'dark' ? 'purple.100' : 'purple.700',
        }),
        excellent: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'yellow.600' : 'yellow.50',
          color: props.colorMode === 'dark' ? 'yellow.50' : 'yellow.700',
        }),
        weekly: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.500',
          color: props.colorMode === 'dark' ? 'white' : 'white',
          fontWeight: '600',
        }),
      },
    },
    Tag: {
      baseStyle: {
        container: {
          borderRadius: '4px',
          fontSize: 'xs',
        },
      },
      variants: {
        subtle: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.100',
            color: props.colorMode === 'dark' ? 'gray.100' : 'gray.600',
          },
        }),
        blue: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.100',
            color: props.colorMode === 'dark' ? 'blue.100' : 'blue.700',
          },
        }),
        green: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'green.600' : 'green.100',
            color: props.colorMode === 'dark' ? 'green.100' : 'green.700',
          },
        }),
        purple: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'purple.600' : 'purple.100',
            color: props.colorMode === 'dark' ? 'purple.100' : 'purple.700',
          },
        }),
        orange: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'orange.600' : 'orange.100',
            color: props.colorMode === 'dark' ? 'orange.100' : 'orange.700',
          },
        }),
        teal: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'teal.600' : 'teal.100',
            color: props.colorMode === 'dark' ? 'teal.100' : 'teal.700',
          },
        }),
        pink: (props: any) => ({
          container: {
            bg: props.colorMode === 'dark' ? 'pink.600' : 'pink.100',
            color: props.colorMode === 'dark' ? 'pink.100' : 'pink.700',
          },
        }),
      },
    },
  },
});

export default theme;