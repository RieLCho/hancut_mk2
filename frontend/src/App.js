import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// 컴포넌트 임포트
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TextPrompt from "./pages/TextPrompt";
import ImageStyle from "./pages/ImageStyle";
import ObjectDetection from "./pages/ObjectDetection";

// 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: "#2e7d32",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.8rem",
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text-prompt" element={<TextPrompt />} />
          <Route path="/image-style" element={<ImageStyle />} />
          <Route path="/object-detection" element={<ObjectDetection />} />
        </Routes>
      </div>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
