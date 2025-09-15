import React, { useState, useRef, useEffect } from 'react';
import { Image, Box, Skeleton, useColorMode } from '@chakra-ui/react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  priority?: boolean;
  className?: string;
  borderRadius?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: (error: any) => void;
  fallbackSrc?: string;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 'full',
  height = 'auto',
  priority = false,
  className,
  borderRadius = '0',
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  placeholder = 'blur',
  sizes,
  quality = 85
}) => {
  const { colorMode } = useColorMode();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // 뷰포트에서 50px 전에 로딩 시작
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // 이미지 URL 최적화 (필요시)
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return '';
    
    // URL에 이미 최적화 파라미터가 있는지 확인
    if (originalSrc.includes('?') || originalSrc.includes('&')) {
      return originalSrc;
    }
    
    // 기본 최적화 파라미터 추가 (필요한 경우에만)
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setHasError(true);
    onError?.(error);
    console.warn('Image loading failed:', src);
  };

  // 기본 fallback SVG
  const defaultFallback = `data:image/svg+xml;base64,${btoa(`
    <svg width="${typeof width === 'number' ? width : 300}" height="${typeof height === 'number' ? height : 200}" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="${colorMode === 'dark' ? '#3C3C47' : '#F3F4F6'}"/>
      <path d="M150 90L120 120H180L150 90Z" fill="${colorMode === 'dark' ? '#626269' : '#9CA3AF'}"/>
      <circle cx="150" cy="110" r="15" fill="none" stroke="${colorMode === 'dark' ? '#626269' : '#9CA3AF'}" stroke-width="2"/>
    </svg>
  `)}`;

  const shouldShowImage = isInView || priority;

  return (
    <Box
      ref={containerRef}
      position="relative"
      width={width}
      height={height}
      borderRadius={borderRadius}
      overflow="hidden"
      className={className}
    >
      {/* 로딩 스켈레톤 */}
      {!isLoaded && shouldShowImage && (
        <Skeleton
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          borderRadius={borderRadius}
          startColor={colorMode === 'dark' ? '#3C3C47' : '#E2E8F0'}
          endColor={colorMode === 'dark' ? '#4D4D59' : '#F7FAFC'}
        />
      )}

      {/* 실제 이미지 */}
      {shouldShowImage && (
        <Image
          ref={imgRef}
          src={hasError ? (fallbackSrc || defaultFallback) : getOptimizedSrc(src)}
          alt={alt}
          width="100%"
          height="100%"
          objectFit={objectFit}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          opacity={isLoaded ? 1 : 0}
          transition="opacity 0.3s ease-in-out"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      {/* 플레이스홀더 (이미지 로드 전) */}
      {!shouldShowImage && (
        <Box
          width="100%"
          height="100%"
          bg={colorMode === 'dark' ? '#3C3C47' : '#F3F4F6'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={borderRadius}
        >
          <Box
            as="svg"
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="60" height="60" rx="8" fill={colorMode === 'dark' ? '#4D4D59' : '#E2E8F0'} />
            <path d="M30 22L24 30H36L30 22Z" fill={colorMode === 'dark' ? '#626269' : '#9CA3AF'} />
            <circle cx="30" cy="26" r="4" fill="none" stroke={colorMode === 'dark' ? '#626269' : '#9CA3AF'} strokeWidth="2" />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OptimizedImage;