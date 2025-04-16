import React, { useState, FormEvent, ChangeEvent } from "react";
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
  Grid,
  CardMedia,
} from "@mui/material";
import { LLMService } from "../services/api";

const TextPrompt: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setPrompt("");
    setImageUrl("");
    setImageError("");

    try {
      const response = await LLMService.generatePrompt(text);
      setPrompt(response.prompt);
    } catch (err) {
      setError("프롬프트 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) {
      setImageError("생성된 프롬프트가 없습니다.");
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageUrl("");

    try {
      const response = await LLMService.generateImage(prompt);
      setImageUrl(response.image_url);
    } catch (err) {
      setImageError("이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        텍스트 기반 인테리어 프롬프트 생성
      </Typography>
      <Typography
        variant="body1"
        paragraph
        textAlign="center"
        color="text.secondary"
      >
        원하는 인테리어에 대한 설명을 입력하면 상세한 디자인 프롬프트를 생성해
        드립니다.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="인테리어 설명"
            multiline
            rows={4}
            fullWidth
            value={text}
            onChange={handleTextChange}
            placeholder="예: 20평 아파트의 거실을 북유럽 스타일로 꾸미고 싶어요. 밝은 색상과 심플한 가구를 선호합니다."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "프롬프트 생성하기"
              )}
            </Button>
          </Box>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {prompt && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  생성된 프롬프트
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {prompt}
                </Typography>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleGenerateImage}
                    disabled={imageLoading}
                  >
                    {imageLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "DALL-E 3 이미지 생성하기"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {imageError && (
            <Grid item xs={12}>
              <Alert severity="error">{imageError}</Alert>
            </Grid>
          )}

          {imageUrl && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    DALL-E 3 생성 이미지
                  </Typography>
                </CardContent>
                <CardMedia
                  component="img"
                  image={imageUrl}
                  alt="Generated interior design"
                  sx={{
                    width: "100%",
                    maxHeight: "600px",
                    objectFit: "contain",
                  }}
                />
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50" }}>
        <Typography variant="subtitle1" gutterBottom>
          💡 팁
        </Typography>
        <Typography variant="body2">
          - 원하는 인테리어 스타일(모던, 북유럽, 빈티지 등)을 명시하세요.
          <br />
          - 공간의 크기와 용도를 설명해주세요.
          <br />
          - 선호하는 색상, 재질, 가구 스타일을 포함하면 더 구체적인 프롬프트가
          생성됩니다.
          <br />- 피하고 싶은 요소들도 언급하면 도움이 됩니다.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TextPrompt;
