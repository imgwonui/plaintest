// 이미지 자동 압축 유틸리티
// 5MB 이상의 이미지를 자동으로 압축하여 업로드 성능 개선

export interface CompressionOptions {
  maxSizeMB?: number;        // 최대 파일 크기 (MB)
  maxWidth?: number;         // 최대 폭
  maxHeight?: number;        // 최대 높이
  quality?: number;          // 압축 품질 (0.1 - 1.0)
  outputFormat?: string;     // 출력 포맷 ('jpeg' | 'png' | 'webp')
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

class ImageCompressor {
  private static instance: ImageCompressor;
  
  public static getInstance(): ImageCompressor {
    if (!ImageCompressor.instance) {
      ImageCompressor.instance = new ImageCompressor();
    }
    return ImageCompressor.instance;
  }

  /**
   * 이미지 파일을 압축합니다
   */
  async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxSizeMB = 5,
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      outputFormat = 'auto'
    } = options;

    const originalSize = file.size;
    const targetSizeBytes = maxSizeMB * 1024 * 1024;

    // 이미 목표 크기 이하면 압축하지 않음
    if (originalSize <= targetSizeBytes) {
      return {
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        wasCompressed: false
      };
    }

    try {
      console.log(`🗜️ 이미지 압축 시작: ${this.formatFileSize(originalSize)} → 목표: ${this.formatFileSize(targetSizeBytes)}`);
      
      const compressedFile = await this.performCompression(file, {
        maxWidth,
        maxHeight,
        quality,
        outputFormat,
        targetSizeBytes
      });

      const compressedSize = compressedFile.size;
      const compressionRatio = originalSize / compressedSize;

      console.log(`✅ 이미지 압축 완료: ${this.formatFileSize(compressedSize)} (${(compressionRatio * 100 - 100).toFixed(1)}% 감소)`);

      return {
        compressedFile,
        originalSize,
        compressedSize,
        compressionRatio,
        wasCompressed: true
      };

    } catch (error) {
      console.error('❌ 이미지 압축 실패:', error);
      // 압축 실패 시 원본 파일 반환
      return {
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        wasCompressed: false
      };
    }
  }

  /**
   * 실제 압축 작업 수행
   */
  private async performCompression(
    file: File,
    options: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      outputFormat: string;
      targetSizeBytes: number;
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      img.onload = () => {
        try {
          // 이미지 크기 계산
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // 이미지 그리기 (고품질)
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 포맷 결정
          const outputFormat = this.determineOutputFormat(file.type, options.outputFormat);
          
          // 품질 조정을 통한 압축
          this.compressWithQualityAdjustment(
            canvas,
            outputFormat,
            options.quality,
            options.targetSizeBytes,
            file.name
          ).then(resolve).catch(reject);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'));
      };

      // 파일을 Data URL로 변환
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기에 실패했습니다.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * 품질을 조정하며 목표 크기에 맞춰 압축
   */
  private async compressWithQualityAdjustment(
    canvas: HTMLCanvasElement,
    mimeType: string,
    initialQuality: number,
    targetSizeBytes: number,
    originalFileName: string
  ): Promise<File> {
    let quality = initialQuality;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mimeType, quality);
      });

      if (!blob) {
        throw new Error('이미지 변환에 실패했습니다.');
      }

      console.log(`🔄 압축 시도 ${attempts + 1}: 품질 ${(quality * 100).toFixed(0)}%, 크기: ${this.formatFileSize(blob.size)}`);

      // 목표 크기 달성 또는 품질이 너무 낮아진 경우
      if (blob.size <= targetSizeBytes || quality <= 0.1) {
        const fileName = this.generateCompressedFileName(originalFileName, mimeType);
        return new File([blob], fileName, { type: mimeType });
      }

      // 다음 시도를 위해 품질 감소
      quality = Math.max(0.1, quality - 0.15);
      attempts++;
    }

    // 최종 시도
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, mimeType, 0.1);
    });

    if (!blob) {
      throw new Error('이미지 변환에 실패했습니다.');
    }

    const fileName = this.generateCompressedFileName(originalFileName, mimeType);
    return new File([blob], fileName, { type: mimeType });
  }

  /**
   * 이미지 크기 계산 (비율 유지)
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 최대 크기보다 큰 경우 비율을 유지하며 축소
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);

      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    return { width, height };
  }

  /**
   * 출력 포맷 결정
   */
  private determineOutputFormat(originalType: string, requestedFormat: string): string {
    if (requestedFormat !== 'auto') {
      return `image/${requestedFormat}`;
    }

    // PNG는 WebP로 변환 (더 효율적)
    if (originalType === 'image/png') {
      // WebP 지원 확인
      const canvas = document.createElement('canvas');
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      return webpSupported ? 'image/webp' : 'image/jpeg';
    }

    // JPEG는 그대로 유지
    if (originalType === 'image/jpeg' || originalType === 'image/jpg') {
      return 'image/jpeg';
    }

    // 기타 포맷은 JPEG로 변환
    return 'image/jpeg';
  }

  /**
   * 압축된 파일명 생성
   */
  private generateCompressedFileName(originalName: string, mimeType: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = mimeType.split('/')[1];
    
    // WebP인 경우 확장자 수정
    const finalExtension = extension === 'jpeg' ? 'jpg' : extension;
    
    return `${nameWithoutExt}_compressed.${finalExtension}`;
  }

  /**
   * 파일 크기를 읽기 쉬운 형태로 포맷
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 여러 이미지를 배치로 압축
   */
  async compressMultiple(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      console.log(`📦 배치 압축 진행: ${i + 1}/${files.length}`);
      try {
        const result = await this.compressImage(files[i], options);
        results.push(result);
      } catch (error) {
        console.error(`❌ 파일 ${files[i].name} 압축 실패:`, error);
        // 실패한 파일은 원본으로 유지
        results.push({
          compressedFile: files[i],
          originalSize: files[i].size,
          compressedSize: files[i].size,
          compressionRatio: 1,
          wasCompressed: false
        });
      }
    }

    return results;
  }
}

// 싱글톤 인스턴스 export
export const imageCompressor = ImageCompressor.getInstance();

// 편의 함수들
export const compressImage = (file: File, options?: CompressionOptions) => 
  imageCompressor.compressImage(file, options);

export const compressImages = (files: File[], options?: CompressionOptions) => 
  imageCompressor.compressMultiple(files, options);

// 이미지 파일 타입 검증
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// 압축이 필요한지 검사
export const needsCompression = (file: File, maxSizeMB: number = 5): boolean => {
  return file.size > (maxSizeMB * 1024 * 1024);
};