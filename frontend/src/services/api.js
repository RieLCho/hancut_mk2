import axios from "axios";

// API 클라이언트 인스턴스 생성
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// API 함수
export const LLMService = {
  // 텍스트 프롬프트 생성
  generatePrompt: async (text) => {
    try {
      const response = await api.post("/api/llm/generate-prompt", { text });
      return response.data;
    } catch (error) {
      console.error("텍스트 프롬프트 생성 오류:", error);
      throw error;
    }
  },
};

export const VisionService = {
  // 이미지 스타일 추출
  extractStyle: async (imageUrl) => {
    try {
      const response = await api.post("/api/vision/extract-style", {
        image_url: imageUrl,
      });
      return response.data;
    } catch (error) {
      console.error("이미지 스타일 추출 오류:", error);
      throw error;
    }
  },

  // 객체 탐지
  detectObjects: async (imageUrl) => {
    try {
      const response = await api.post("/api/vision/detect-objects", {
        image_url: imageUrl,
      });
      return response.data;
    } catch (error) {
      console.error("객체 탐지 오류:", error);
      throw error;
    }
  },
};

export default api;
