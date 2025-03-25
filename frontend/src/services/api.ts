import axios, { AxiosInstance } from "axios";

interface LLMResponse {
  prompt: string;
  // 필요한 다른 응답 필드 추가
}

interface VisionStyleResponse {
  keywords: string[];
  // 필요한 다른 응답 필드 추가
}

interface VisionObjectResponse {
  objects: Array<{
    label: string;
    confidence: number;
  }>;
}

// API 클라이언트 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// API 함수
export const LLMService = {
  // 텍스트 프롬프트 생성
  generatePrompt: async (text: string): Promise<LLMResponse> => {
    try {
      const response = await api.post<LLMResponse>("/api/llm/generate-prompt", {
        text,
      });
      return response.data;
    } catch (error) {
      console.error("텍스트 프롬프트 생성 오류:", error);
      throw error;
    }
  },
};

export const VisionService = {
  // 이미지 스타일 추출
  extractStyle: async (imageUrl: string): Promise<VisionStyleResponse> => {
    try {
      const response = await api.post<VisionStyleResponse>(
        "/api/vision/extract-style",
        {
          image_url: imageUrl,
        }
      );
      return response.data;
    } catch (error) {
      console.error("이미지 스타일 추출 오류:", error);
      throw error;
    }
  },

  // 객체 탐지
  detectObjects: async (imageUrl: string): Promise<VisionObjectResponse> => {
    try {
      const response = await api.post<VisionObjectResponse>(
        "/api/vision/detect-objects",
        {
          image_url: imageUrl,
        }
      );
      return response.data;
    } catch (error) {
      console.error("객체 탐지 오류:", error);
      throw error;
    }
  },
};

export default api;
