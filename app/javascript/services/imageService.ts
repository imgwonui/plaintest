// 이미지 처리 중앙화 서비스
// 프로젝트 전체에서 일관된 이미지 처리 로직 제공

import { compressImage, isImageFile, needsCompression, type CompressionResult } from '../utils/imageCompressor';

export interface ImageProcessingOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  showProgress?: boolean;
}

export interface ImageProcessingResult {
  processedFile: File;
  wasProcessed: boolean;
  originalSize: number;
  finalSize: number;
  compressionRatio?: number;
}

class ImageService {
  private static instance: ImageService;
  
  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * 썸네일용 이미지 처리 (고품질 유지)
   */
  async processThumbnailImage(
    file: File,
    onProgress?: (message: string, type: 'info' | 'success' | 'error') => void
  ): Promise<ImageProcessingResult> {
    if (!isImageFile(file)) {
      throw new Error('이미지 파일만 처리할 수 있습니다.');
    }

    const options: ImageProcessingOptions = {
      maxSizeMB: 5,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8
    };

    return this.processImage(file, options, onProgress);
  }

  /**
   * 에디터용 이미지 처리 (적당한 품질)
   */
  async processEditorImage(
    file: File,
    onProgress?: (message: string, type: 'info' | 'success' | 'error') => void
  ): Promise<ImageProcessingResult> {
    if (!isImageFile(file)) {
      throw new Error('이미지 파일만 처리할 수 있습니다.');
    }

    const options: ImageProcessingOptions = {
      maxSizeMB: 5,
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.85
    };

    return this.processImage(file, options, onProgress);
  }

  /**
   * 일반적인 이미지 처리
   */
  async processImage(
    file: File,
    options: ImageProcessingOptions = {},
    onProgress?: (message: string, type: 'info' | 'success' | 'error') => void
  ): Promise<ImageProcessingResult> {
    const {
      maxSizeMB = 5,
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8
    } = options;

    const originalSize = file.size;

    try {
      // 압축이 필요하지 않으면 바로 반환
      if (!needsCompression(file, maxSizeMB)) {
        return {
          processedFile: file,
          wasProcessed: false,
          originalSize,
          finalSize: originalSize
        };
      }

      // 압축 진행 알림
      if (onProgress) {
        onProgress(
          `파일이 큽니다. 자동으로 최적화하고 있어요. (${this.formatFileSize(originalSize)})`,
          'info'
        );
      }

      const compressionResult = await compressImage(file, {
        maxSizeMB,
        maxWidth,
        maxHeight,
        quality
      });

      const finalSize = compressionResult.compressedFile.size;

      // 압축 완료 알림
      if (compressionResult.wasCompressed && onProgress) {
        const reductionPercent = ((originalSize - finalSize) / originalSize * 100).toFixed(0);
        onProgress(
          `최적화 완료! ${this.formatFileSize(originalSize)} → ${this.formatFileSize(finalSize)} (${reductionPercent}% 감소)`,
          'success'
        );
      }

      return {
        processedFile: compressionResult.compressedFile,
        wasProcessed: compressionResult.wasCompressed,
        originalSize,
        finalSize,
        compressionRatio: compressionResult.compressionRatio
      };

    } catch (error) {
      console.error('이미지 처리 실패:', error);
      
      if (onProgress) {
        onProgress('이미지 처리 중 오류가 발생했습니다. 원본을 사용합니다.', 'error');
      }

      // 실패 시 원본 반환
      return {
        processedFile: file,
        wasProcessed: false,
        originalSize,
        finalSize: originalSize
      };
    }
  }

  /**
   * 여러 이미지를 배치로 처리
   */
  async processMultipleImages(
    files: File[],
    options: ImageProcessingOptions = {},
    onProgress?: (message: string, type: 'info' | 'success' | 'error', current?: number, total?: number) => void
  ): Promise<ImageProcessingResult[]> {
    const results: ImageProcessingResult[] = [];
    const imageFiles = files.filter(file => isImageFile(file));

    if (imageFiles.length === 0) {
      throw new Error('이미지 파일이 없습니다.');
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      if (onProgress) {
        onProgress(`이미지 처리 중... (${i + 1}/${imageFiles.length})`, 'info', i + 1, imageFiles.length);
      }

      try {
        const result = await this.processImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`파일 ${file.name} 처리 실패:`, error);
        // 실패한 파일은 원본으로 유지
        results.push({
          processedFile: file,
          wasProcessed: false,
          originalSize: file.size,
          finalSize: file.size
        });
      }
    }

    if (onProgress) {
      onProgress('모든 이미지 처리가 완료되었습니다.', 'success');
    }

    return results;
  }

  /**
   * 이미지 파일 검증
   */
  validateImageFile(file: File, maxSizeMB: number = 50): { isValid: boolean; error?: string } {
    if (!isImageFile(file)) {
      return {
        isValid: false,
        error: '이미지 파일만 업로드할 수 있습니다.'
      };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. ${maxSizeMB}MB 이하의 파일을 선택해주세요.`
      };
    }

    return { isValid: true };
  }

  /**
   * 이미지 메타데이터 추출
   */
  async extractImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    type: string;
    size: number;
    name: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: file.type,
          size: file.size,
          name: file.name
        });
      };

      img.onerror = () => {
        reject(new Error('이미지 메타데이터를 추출할 수 없습니다.'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 권장 압축 설정 반환
   */
  getRecommendedSettings(usage: 'thumbnail' | 'editor' | 'profile' | 'general'): ImageProcessingOptions {
    const settings: Record<string, ImageProcessingOptions> = {
      thumbnail: {
        maxSizeMB: 5,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      },
      editor: {
        maxSizeMB: 5,
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85
      },
      profile: {
        maxSizeMB: 2,
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.9
      },
      general: {
        maxSizeMB: 5,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      }
    };

    return settings[usage] || settings.general;
  }
}

// 싱글톤 인스턴스 export
export const imageService = ImageService.getInstance();

// 편의 함수들
export const processThumbnailImage = (file: File, onProgress?: (message: string, type: 'info' | 'success' | 'error') => void) =>
  imageService.processThumbnailImage(file, onProgress);

export const processEditorImage = (file: File, onProgress?: (message: string, type: 'info' | 'success' | 'error') => void) =>
  imageService.processEditorImage(file, onProgress);

export const validateImage = (file: File, maxSizeMB?: number) =>
  imageService.validateImageFile(file, maxSizeMB);

export const getImageMetadata = (file: File) =>
  imageService.extractImageMetadata(file);

export default imageService;