import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
} from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import img1 from "../image/image1.png";
import img2 from "../image/image2.png";
import img3 from "../image/image3.png";
import img4 from "../image/image4.png";


interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const features: Feature[] = [
  {
    title: "텍스트 기반 프롬프트 생성",
    description:
      "GPT-4를 활용하여 텍스트 입력으로부터 상세한 인테리어 디자인 프롬프트를 생성합니다.",
    icon: <TextFieldsIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    link: "/text-prompt",
  },
  {
    title: "이미지 기반 스타일 추출",
    description:
      "CLIP 모델을 사용하여 이미지에서 인테리어 스타일을 추출하고 분석합니다.",
    icon: <ImageIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    link: "/image-style",
  },
  {
    title: "객체 탐지",
    description:
      "Faster R-CNN 모델을 사용하여 이미지에서 인테리어 객체를 탐지하고 분류합니다.",
    icon: <SearchIcon sx={{ fontSize: 50, color: "primary.main" }} />,
    link: "/object-detection",
  },
];

const Home: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper  elevation={0} sx={{p: 27, pb:4, mb: 4}}>
        <Typography
            variant="h7"
            color="text.primary"
            paragraph
            textAlign="center"
        >
          HANCUT
        {/*  텍스트와 이미지를 활용하여 인테리어 디자인 프롬프트를 손쉽게
          생성하세요*/}
        </Typography>
        {/*<Typography variant="h3" component="h1" gutterBottom textAlign="center">*/}
        {/*  인테리어 이미지 생성하러 가기*/}
        {/*</Typography>*/}
        <Typography
            variant="h1"
            component={RouterLink}
            to="/step"
            gutterBottom
            textAlign="center"
            sx={{
              display: 'block',
              mx: 'auto',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
        >
          인테리어 이미지 생성하러 가기
        </Typography>

        <Typography
            variant="h7"
            color="text.primary"
            paragraph
            textAlign="center"
        >
          SIGLIP l GPT 4-mini l Dalle 3
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          {/*<Button*/}
          {/*  variant="contained"*/}
          {/*  color="primary"*/}
          {/*  size="large"*/}
          {/*  component={RouterLink}*/}
          {/*  to="/text-prompt"*/}
          {/*>*/}
          {/*  시작하기*/}
          {/*</Button>*/}
        </Box>
      </Paper>

      {/*<Box sx={{ mb: 5 }}>*/}
      {/*  <Typography*/}
      {/*    variant="h4"*/}
      {/*    component="h2"*/}
      {/*    gutterBottom*/}
      {/*    sx={{ mb: 3 }}*/}
      {/*    textAlign="center"*/}
      {/*  >*/}
      {/*    주요 기능*/}
      {/*  </Typography>*/}
      {/*  <Grid container spacing={4}>*/}
      {/*    {features.map((feature, index) => (*/}
      {/*      <Grid item xs={12} md={4} key={index}>*/}
      {/*        <Card*/}
      {/*          sx={{*/}
      {/*            height: "100%",*/}
      {/*            display: "flex",*/}
      {/*            flexDirection: "column",*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          <Box sx={{ pt: 3, display: "flex", justifyContent: "center" }}>*/}
      {/*            {feature.icon}*/}
      {/*          </Box>*/}
      {/*          <CardContent sx={{ flexGrow: 1 }}>*/}
      {/*            <Typography gutterBottom variant="h5" component="h3">*/}
      {/*              {feature.title}*/}
      {/*            </Typography>*/}
      {/*            <Typography>{feature.description}</Typography>*/}
      {/*          </CardContent>*/}
      {/*          <CardActions sx={{ justifyContent: "center", pb: 2 }}>*/}
      {/*            <Button*/}
      {/*              variant="outlined"*/}
      {/*              color="primary"*/}
      {/*              component={RouterLink}*/}
      {/*              to={feature.link}*/}
      {/*            >*/}
      {/*              사용해보기*/}
      {/*            </Button>*/}
      {/*          </CardActions>*/}
      {/*        </Card>*/}
      {/*      </Grid>*/}
      {/*    ))}*/}
      {/*  </Grid>*/}
      {/*</Box>*/}
      <Grid container spacing={4} sx={{ mb: 15 }}>
        {[img1, img2, img3, img4].map((imgSrc, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ overflow: "hidden", boxShadow: 3 }}>
                <Box
                    component="img"
                    src={imgSrc}
                    alt={`인테리어 샘플 ${index + 1}`}
                    sx={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                />
              </Card>

            </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          my: 5,
          p: 4,
          backgroundColor: "primary.light",
          borderRadius: 2,
          color: "white",
        }}
      >
        <Typography variant="h5" gutterBottom>
          HanCut 소개
        </Typography>
        <Typography paragraph>
          HanCut은 인테리어 디자인에 관심이 있는 사용자들을 위한 프롬프트 생성
          도구입니다. 최첨단 AI 기술을 활용하여 사용자가 원하는 인테리어
          스타일을 텍스트나 이미지로 표현하면, 상세한 인테리어 디자인 프롬프트를
          생성해줍니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
