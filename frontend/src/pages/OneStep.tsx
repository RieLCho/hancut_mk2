import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  CardMedia,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { LLMService, VisionService } from "../services/api";

// 단계 정의
const steps = [
  "텍스트 입력",
  "이미지 분석",
  "프롬프트 생성",
  "이미지 생성",
];

// 타입 정의
interface DetectedObject {
  label: string;
  confidence: number;
}

const OneStep: React.FC = () => {
  // 전역 상태
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // 텍스트 입력 관련 상태
  const [textInput, setTextInput] = useState<string>("");

  // 이미지 관련 상태
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  // 프롬프트 관련 상태
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  // 최종 이미지 관련 상태
  const [finalImageUrl, setFinalImageUrl] = useState<string>("");

  // 텍스트 입력 핸들러
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  // 이미지 URL 입력 핸들러
  const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  // 텍스트 입력 제출 핸들러
  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !imageUrl.trim()) {
      setError("텍스트나 이미지 URL을 입력해주세요.");
      return;
    }
    
    setError("");
    handleNext();
  };

  // 이미지 분석 핸들러
  const handleImageSubmit = async () => {
    if (!imageUrl) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setImagePreview(imageUrl);
    setKeywords([]);
    setDetectedObjects([]);

    try {
      // 이미지 스타일 추출
      const styleResponse = await VisionService.extractStyle(imageUrl);
      setKeywords(styleResponse.keywords);

      // 객체 탐지
      const objectResponse = await VisionService.detectObjects(imageUrl);
      setDetectedObjects(objectResponse.objects);

      // 두 작업이 모두 성공적으로 완료되면 다음 단계로
      handleNext();
    } catch (err) {
      setError("이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 프롬프트 생성 핸들러
  const handleGeneratePrompt = async () => {
    setLoading(true);
    setError("");
    setGeneratedPrompt("");

    try {
      // 텍스트와 이미지 분석 데이터를 구조적으로 통합하여 프롬프트 생성
      let combinedText = "";
      
      // 기본 설명 추가
      if (textInput.trim()) {
        combinedText += `사용자 요청: ${textInput}\n\n`;
      } else {
        combinedText += "인테리어 디자인 이미지를 생성해주세요.\n\n";
      }
      
      // 이미지 분석 결과 추가
      if (keywords.length > 0 || detectedObjects.length > 0) {
        combinedText += "이미지 분석 결과:\n";
        
        // 스타일 키워드 추가
        if (keywords.length > 0) {
          combinedText += `- 스타일 키워드: ${keywords.join(", ")}\n`;
        }
        
        // 탐지된 객체 추가 (상위 5개만 포함, 신뢰도가 높은 순으로)
        if (detectedObjects.length > 0) {
          // 신뢰도 순으로 정렬
          const sortedObjects = [...detectedObjects].sort((a, b) => b.confidence - a.confidence);
          const topObjects = sortedObjects.slice(0, 5); // 상위 5개만 사용
          
          const objectsList = topObjects
            .map(obj => `${obj.label}(${Math.round(obj.confidence * 100)}%)`)
            .join(", ");
          combinedText += `- 주요 인테리어 객체: ${objectsList}\n`;
        }
      }
      
      // 추가적인 지시사항
      combinedText += `\n다음 사항을 고려하여 고품질 인테리어 이미지 생성용 DALL-E 프롬프트를 작성해주세요:
1. 포토리얼리스틱한 인테리어 이미지를 위한 명확한 설명
2. 공간감과 원근감이 잘 표현되도록 구체적인 가구 배치 설명
3. 조명, 색상 팔레트, 재질 등 세부 사항 포함
4. 전체적인 분위기와 스타일을 강조`;
      
      // 프롬프트 생성 API 호출
      const response = await LLMService.generatePrompt(combinedText);
      setGeneratedPrompt(response.prompt);
      
      // 다음 단계로
      handleNext();
    } catch (err) {
      setError("프롬프트 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 생성 핸들러
  const handleGenerateImage = async () => {
    if (!generatedPrompt) {
      setError("생성된 프롬프트가 없습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setFinalImageUrl("");

    try {
      const response = await LLMService.generateImage(generatedPrompt);
      setFinalImageUrl(response.image_url);
      handleNext();
    } catch (err) {
      setError("이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로 이동 핸들러
  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  // 이전 단계로 이동 핸들러
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  // 처음으로 돌아가기 핸들러
  const handleReset = () => {
    setActiveStep(0);
    setTextInput("");
    setImageUrl("");
    setImagePreview("");
    setKeywords([]);
    setDetectedObjects([]);
    setGeneratedPrompt("");
    setFinalImageUrl("");
    setError("");
  };

  // 신뢰도를 퍼센트로 변환
  const confidenceToPercent = (confidence: number): number => {
    return Math.round(confidence * 100);
  };

  // 현재 단계에 대한 컨텐츠 렌더링
  const getStepContent = (step: number) => {
    switch (step) {
      case 0: // 텍스트 입력 단계
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              원스텝 인테리어 생성 시작
            </Typography>
            <form onSubmit={handleTextSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  1. 인테리어 설명 입력
                </Typography>
                <TextField
                  label="원하는 인테리어 설명"
                  multiline
                  rows={4}
                  fullWidth
                  value={textInput}
                  onChange={handleTextChange}
                  placeholder="예: 20평 아파트의 거실을 북유럽 스타일로 꾸미고 싶어요. 밝은 색상과 심플한 가구를 선호합니다."
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  * 구체적인 공간, 스타일, 색상 등을 설명할수록 더 정확한 결과를 얻을 수 있습니다.
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  2. 참고 이미지 URL 입력 (선택사항)
                </Typography>
                <Box sx={{ display: "flex", mb: 2 }}>
                  <TextField
                    label="참고 이미지 URL"
                    fullWidth
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/interior-image.jpg"
                    sx={{ mr: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  * 텍스트와 함께 참고 이미지를 제공하면 더 정확한 결과를 얻을 수 있습니다.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || (!textInput.trim() && !imageUrl.trim())}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "다음 단계로"
                  )}
                </Button>
              </Box>
            </form>
          </Paper>
        );
      case 1: // 이미지 분석 단계
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              이미지 분석 및 특성 추출
            </Typography>
            {imageUrl ? (
              <>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          참고 이미지
                        </Typography>
                        <Box
                          component="img"
                          src={imagePreview}
                          alt="인테리어 이미지"
                          sx={{
                            width: "100%",
                            height: "auto",
                            borderRadius: 1,
                            mb: 2,
                          }}
                          onError={(
                            e: React.SyntheticEvent<HTMLImageElement, Event>
                          ) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src =
                              "https://via.placeholder.com/400x300?text=이미지+로드+실패";
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          이미지 분석 과정
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          참고 이미지를 분석하여:
                        </Typography>
                        <Box sx={{ ml: 2, mb: 1 }}>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            1. 인테리어 스타일 키워드를 추출합니다.
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            2. 이미지 내 인테리어 객체를 탐지합니다.
                          </Typography>
                          <Typography variant="body2" component="div">
                            3. 이 정보를 텍스트 설명과 결합하여 더 정확한 프롬프트를 생성합니다.
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mt: 3 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleImageSubmit}
                            disabled={loading || !imageUrl}
                            fullWidth
                          >
                            {loading ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              "이미지 분석 시작하기"
                            )}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  참고 이미지가 없습니다
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  이미지 URL을 입력하지 않았습니다. 텍스트 설명만 사용하여 계속 진행합니다.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  size="large"
                >
                  다음 단계로 진행
                </Button>
              </Box>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button onClick={handleBack} variant="outlined">이전 단계로</Button>
            </Box>
          </Paper>
        );
      case 2: // 이미지 분석 결과 및 프롬프트 생성 단계
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              통합 분석 결과
            </Typography>
            
            {/* 사용자 입력 요약 */}
            <Card sx={{ mb: 3, bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  사용자 입력 요약
                </Typography>
                {textInput && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      텍스트 설명:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {textInput}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            {/* 이미지 분석 결과 */}
            <Grid container spacing={3}>
              {/* 스타일 키워드 */}
              {keywords.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        추출된 스타일 키워드
                      </Typography>
                      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap" }}>
                        {keywords.map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            color="primary"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        이 키워드들은 참고 이미지에서 감지된 인테리어 스타일을 나타냅니다.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* 탐지된 객체 */}
              {detectedObjects.length > 0 && (
                <Grid item xs={12} md={keywords.length > 0 ? 6 : 12}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom color="primary">
                        탐지된 인테리어 객체
                      </Typography>
                      <TableContainer>
                        <Table aria-label="탐지된 객체 테이블" size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>객체</TableCell>
                              <TableCell align="right">신뢰도</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detectedObjects.map((object, index) => (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {object.label}
                                </TableCell>
                                <TableCell align="right">
                                  {confidenceToPercent(object.confidence)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        이 객체들은 참고 이미지에서 감지된 가구 및 인테리어 요소입니다.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* 통합 프롬프트 생성 섹션 */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                인공지능 프롬프트 생성
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: "80%", mx: "auto" }}>
                입력한 텍스트와 이미지 분석 결과를 바탕으로 DALL-E 3에 최적화된 고품질 인테리어 디자인 프롬프트를 생성합니다.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGeneratePrompt}
                disabled={loading}
                size="large"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "AI 프롬프트 생성하기"
                )}
              </Button>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button onClick={handleBack} variant="outlined">이전 단계로</Button>
            </Box>
          </Paper>
        );
      case 3: // 프롬프트 확인 및 이미지 생성 단계
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              AI 최적화 프롬프트
            </Typography>
            <Card sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  DALL-E 3 최적화 프롬프트:
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ whiteSpace: "pre-wrap", p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}
                >
                  {generatedPrompt}
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                인테리어 디자인 이미지 생성
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: "80%", mx: "auto" }}>
                위의 AI 최적화 프롬프트를 바탕으로 DALL-E 3가 고품질 인테리어 이미지를 생성합니다. 
                사용자의 텍스트 설명과 참고 이미지의 특성이 모두 반영됩니다.
              </Typography>
              
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateImage}
                  disabled={loading || !generatedPrompt}
                  size="large"
                  sx={{ px: 4, py: 1 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "DALL-E 3로 이미지 생성하기"
                  )}
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                * 이미지 생성에는 약 10-15초 정도 소요됩니다.
              </Typography>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button onClick={handleBack} variant="outlined">이전 단계로</Button>
            </Box>
          </Paper>
        );
      case 4: // 최종 이미지 결과 단계
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
              완성된 인테리어 디자인 이미지
            </Typography>
            
            <Box sx={{ position: "relative", mb: 3 }}>
              <Card elevation={4}>
                <CardMedia
                  component="img"
                  image={finalImageUrl}
                  alt="Generated interior design"
                  sx={{
                    width: "100%",
                    maxHeight: "600px",
                    objectFit: "contain",
                  }}
                />
              </Card>
              <Box sx={{ 
                position: "absolute", 
                bottom: 10, 
                right: 10, 
                bgcolor: "rgba(0,0,0,0.6)", 
                color: "white",
                px: 2,
                py: 0.5,
                borderRadius: 1
              }}>
                DALL-E 3 Generated
              </Box>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                프로세스 요약
              </Typography>
              <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
                <Typography variant="body2" component="div">
                  1. 사용자 텍스트 입력 {textInput ? "✓" : "✗"}
                </Typography>
                <Typography variant="body2" component="div">
                  2. 참고 이미지 분석 {imageUrl ? "✓" : "✗"}
                  {imageUrl && (
                    <>
                      {keywords.length > 0 && <Typography variant="body2" sx={{ ml: 2 }}>- 스타일 키워드 {keywords.length}개 추출</Typography>}
                      {detectedObjects.length > 0 && <Typography variant="body2" sx={{ ml: 2 }}>- 인테리어 객체 {detectedObjects.length}개 탐지</Typography>}
                    </>
                  )}
                </Typography>
                <Typography variant="body2" component="div">
                  3. AI 프롬프트 생성 및 최적화 ✓
                </Typography>
                <Typography variant="body2" component="div">
                  4. DALL-E 3 이미지 생성 ✓
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleReset}
                size="large"
              >
                새로운 디자인 시작하기
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.open(finalImageUrl, '_blank')}
              >
                이미지 새 탭에서 보기
              </Button>
            </Box>
          </Paper>
        );
      default:
        return "알 수 없는 단계";
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        올인원 인테리어 디자인 생성기
      </Typography>
      <Typography
        variant="body1"
        paragraph
        textAlign="center"
        color="text.secondary"
      >
        텍스트 설명과 참고 이미지를 통합 분석하여 AI가 맞춤형 인테리어 디자인 이미지를 생성합니다.
        스타일 분석, 객체 탐지, 프롬프트 최적화까지 한 번에 해결해 드립니다.
      </Typography>

      <Box sx={{ width: "100%", mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}

      <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50", mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          💡 팁
        </Typography>
        <Typography variant="body2">
          - 원하는 인테리어 스타일(모던, 북유럽, 빈티지 등)을 명시하세요.
          <br />
          - 공간의 크기와 용도를 설명해주세요.
          <br />
          - 선호하는 색상, 재질, 가구 스타일을 포함하면 더 구체적인 결과를 얻을 수 있습니다.
          <br />- 참고 이미지를 제공하면 스타일 분석과 객체 탐지를 통해 더 맞춤화된
          디자인을 생성합니다.
        </Typography>
      </Paper>
    </Container>
  );
};

export default OneStep;