import React, { useState, ChangeEvent } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Divider,
} from "@mui/material";
import { VisionService } from "../services/api";

interface DetectedObject {
  name: string;
  confidence: number;
}

const ObjectDetection: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setDetectedObjects([]);
    setImagePreview(imageUrl);

    try {
      const response = await VisionService.detectObjects(imageUrl);
      setDetectedObjects(response.objects);
    } catch (err) {
      setError("객체 탐지 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 신뢰도를 퍼센트로 변환
  const confidenceToPercent = (confidence: number): number => {
    return Math.round(confidence * 100);
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        인테리어 객체 탐지
      </Typography>
      <Typography
        variant="body1"
        paragraph
        textAlign="center"
        color="text.secondary"
      >
        인테리어 이미지에서 가구 및 주요 객체를 탐지합니다.
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
            탐지
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

      {imagePreview && detectedObjects.length > 0 && (
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
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  탐지된 객체
                </Typography>
                <TableContainer>
                  <Table aria-label="탐지된 객체 테이블">
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
                            {object.name}
                          </TableCell>
                          <TableCell align="right">
                            {confidenceToPercent(object.confidence)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {imagePreview && detectedObjects.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          이미지에서 인테리어 객체를 찾을 수 없습니다. 다른 이미지를
          시도해보세요.
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50", mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          💡 팁
        </Typography>
        <Typography variant="body2">
          - 가구와 인테리어 소품이 잘 보이는 이미지를 사용하세요.
          <br />
          - 높은 해상도의 이미지가 더 정확한 탐지 결과를 제공합니다.
          <br />- 탐지된 객체를 참고하여 텍스트 프롬프트에 구체적인 가구 배치를
          명시할 수 있습니다.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ObjectDetection;
