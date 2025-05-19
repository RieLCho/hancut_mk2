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
    Chip,
    Divider, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import { LLMService } from "../services/api";
import { VisionService } from "../services/api";

const tips = [
    {
        title: "💡 텍스트 입력 팁",
        content: (
            <>
                - 원하는 인테리어 스타일(모던, 북유럽, 빈티지 등)을 명시하세요.<br />
                - 공간 크기와 용도를 구체적으로 써주세요.<br />
                - 선호하는 색상과 재질을 알려주세요.
            </>
        ),
    },
    {
        title: "💡 이미지 스타일 추출 팁",
        content: (
            <>
                - 참고할 이미지가 명확할수록 좋아요.<br />
                - 밝고 잘 보이는 이미지가 스타일 분석에 도움이 됩니다.<br />
                - 여러 장의 이미지를 사용해도 좋아요.
            </>
        ),
    },
    {
        title: "💡 객체 탐지 팁",
        content: (
            <>
                - 이미지 내 주요 가구나 소품이 잘 나오게 찍어주세요.<br />
                - 여러 각도에서 찍은 사진이면 더 정확해요.<br />
                - 인테리어 소품을 강조해서 보여주세요.
            </>
        ),
    },
];
interface DetectedObject {
    label: string;
    confidence: number;
}
const StepComponent = ({
                           step,
                           setStep,
                       }: {
    step: number;
    setStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
    // 텍스트 입력 관련
    const [text, setText] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const [error, setError] = useState<string>("");

    // 이미지 스타일 관련
    const [imageUrl, setImageUrl] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string>("");
    const [keywords, setKeywords] = useState<string[]>([]);

    // 객체 탐지 관련
    const [objectUrl, setObjectUrl] = useState<string>("");
    const [objectPreview, setObjectPreview] = useState<string>("");
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

    // 텍스트 입력 핸들러
    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };
    const handleImageUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
    };
    const handleObjectUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setObjectUrl(e.target.value);
    };

    // 프롬프트 생성 요청
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!text.trim()) {
            setError("텍스트를 입력해주세요.");
            return;
        }

        setLoading(true);
        setError("");
        setPrompt("");

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

    const handleUrlSubmit = async () => {
        if (!objectUrl) {
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
    const handleObjectUrlSubmit = async () => {
        if (!objectUrl) {
            setError("이미지 URL을 입력해주세요.");
            return;
        }

        setLoading(true);
        setError("");
        setDetectedObjects([]);
        setObjectPreview(objectUrl);

        try {
            const response = await VisionService.detectObjects(objectUrl);
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


    // 1단계: 텍스트 입력 UI
    if (step === 0) {
        return (
            <>
                <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        1단계: 텍스트 입력
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        textAlign="left"
                        color="text.secondary"
                    >
                        원하는 인테리어에 대한 설명을 입력하면 상세한 디자인 프롬프트를 생성해 드립니다.
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="예: 20평 아파트의 거실을 북유럽 스타일로 꾸미고 싶어요. 밝은 색상과 심플한 가구를 선호합니다."
                            value={text}
                            onChange={handleTextChange}
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
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {tips[step].title}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {tips[step].content}
                    </Typography>
                </Paper>

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (prompt) setStep(step + 1);
                            else alert("먼저 프롬프트를 생성하세요.");
                        }}
                        disabled={!prompt}
                    >
                        다음 단계
                    </Button>
                </Box>
            </>
        );
    }

    // 2단계: 이미지 스타일 추출 UI
    if (step === 1) {
        return (
            <>
                <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        2단계: 이미지 기반 스타일 추출
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        textAlign="left"
                        color="text.secondary"
                    >
                        인테리어 이미지를 분석하여 스타일 키워드를 추출합니다.
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
                        * 인테리어 이미지 URL을 입력하세요. 이미지는 공개적으로 접근 가능해야 합니다.
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
                                        텍스트 프롬프트와 함께 사용하면 더 정확한 결과를 얻을 수 있습니다.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
                <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {tips[step].title}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {tips[step].content}
                    </Typography>
                </Paper>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setStep(step - 1)}
                        sx={{ mr: 1 }}
                    >
                        이전
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setStep(step + 1);
                            // if (prompt) setStep(step + 1);
                            // else alert("먼저 프롬프트를 생성하세요.");
                        }}
                        // disabled={!prompt}
                    >
                        다음 단계
                    </Button>
                </Box>
            </>
        );
    }

    // 3단계: 객체 탐지 UI
    if (step === 2) {
        return (
            <>
                <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        3단계: 객체 탐지
                    </Typography>
                    <Typography
                        variant="body1"
                        paragraph
                        textAlign="left"
                        color="text.secondary"
                    >
                        인테리어 이미지에서 가구 및 주요 객체를 탐지합니다.
                    </Typography>
                    <Box sx={{ display: "flex", mb: 2 }}>
                        <TextField
                            label="이미지 URL"
                            fullWidth
                            value={objectUrl}
                            onChange={handleObjectUrlChange}
                            placeholder="https://example.com/interior-image.jpg"
                            sx={{ mr: 1 }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleObjectUrlSubmit}
                            disabled={loading || !objectUrl}
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

                {objectPreview && detectedObjects.length > 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        분석된 이미지
                                    </Typography>
                                    <Box
                                        component="img"
                                        src={objectPreview}
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
                <Paper elevation={1} sx={{ p: 3, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle1" gutterBottom>
                        {tips[step].title}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {tips[step].content}
                    </Typography>
                </Paper>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setStep(step - 1)}
                        sx={{ mr: 1 }}
                    >
                        이전
                    </Button>
                    <Button variant="contained" onClick={() => alert("완료!")}>
                        완료
                    </Button>
                </Box>
            </>
        );
    }

    return null;
};

const InteriorProcess = () => {
    const [step, setStep] = useState(0);

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Typography
                variant="h2"
                textAlign="center"
                gutterBottom
                sx={{ mt: 10, mb: 6 }}
            >
                인테리어 이미지 생성 과정
            </Typography>
            <StepComponent step={step} setStep={setStep} />
        </Container>
    );
};

export default InteriorProcess;
