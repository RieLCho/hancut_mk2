import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  TextField,
  Grid,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { VisionService } from "../services/api";

// 파일 업로드 스타일 컴포넌트
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const ImageStyle = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setKeywords([]);
    setImagePreview(imageUrl);

    try {
      const response = await VisionService.extractStyle(imageUrl);
      setKeywords(response.keywords);
    } catch (err) {
      setError("스타일 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        이미지 스타일 분석
      </Typography>
      <Typography
        variant="body1"
        paragraph
        textAlign="center"
        color="text.secondary"
      >
        인테리어 이미지를 분석하여 스타일 키워드를 추출합니다.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          이미지 URL 입력
        </Typography>
        <Box sx={{ display: "flex", mb: 2 }}>
          <TextField
            label="이미지 URL"
            fullWidth
            value={imageUrl}
            onChange={handleImageUrlChange}
            placeholder="https://example.com/interior-image.jpg"
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleUrlSubmit}
            disabled={loading || !imageUrl}
          >
            분석
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          * 인테리어 이미지 URL을 입력하세요. 이미지는 공개적으로 접근 가능해야
          합니다.
        </Typography>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {imagePreview && keywords.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  분석된 이미지
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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=이미지+로드+실패";
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  스타일 키워드
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      color="primary"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" sx={{ mt: 3 }}>
                  이 키워드들은 이미지에서 감지된 인테리어 스타일을 나타냅니다.
                  텍스트 프롬프트와 함께 사용하면 더 정확한 결과를 얻을 수
                  있습니다.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50", mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          💡 팁
        </Typography>
        <Typography variant="body2">
          - 스타일이 명확하게 드러난 인테리어 이미지를 사용하세요.
          <br />
          - 높은 해상도의 이미지가 더 정확한 결과를 제공합니다.
          <br />- 추출된 키워드를 텍스트 프롬프트에 활용하여 더 구체적인
          인테리어 디자인을 생성할 수 있습니다.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ImageStyle;
