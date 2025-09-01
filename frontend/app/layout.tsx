import type { Metadata } from "next";
import CssBaseline from "@mui/material/CssBaseline";

export const metadata: Metadata = {
  title: "Mobilint, Inc. ARIES LLM Demo",
  description: "Mobilint, Inc. ARIES LLM Demo",
};

const globals = `
/* total width */
::-webkit-scrollbar {
  background-color: #fff;
  width: 16px;
}

/* background of the scrollbar except button or resizer */
::-webkit-scrollbar-track {
  background-color: #fff;
}

/* scrollbar itself */
::-webkit-scrollbar-thumb {
  background-color: #babac0;
  border-radius: 16px;
  border: 4px solid #fff;
}

/* set button(top and bottom of the scrollbar) */
::-webkit-scrollbar-button {
  display:none;
}

@font-face {
    font-family: Pretendard;
    src: url(/fonts/Pretendard-Bold.eot);
    src: url(/fonts/Pretendard-Bold.eot?#iefix) format(embedded-opentype),
        url(/fonts/Pretendard-Bold.woff2) format(woff2),
        url(/fonts/Pretendard-Bold.woff) format(woff),
        url(/fonts/Pretendard-Bold.ttf) format(truetype),
        url(/fonts/Pretendard-Bold.svg#Pretendard-Bold) format(svg);
    font-weight: bold;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: Pretendard;
    src: url(/fonts/Pretendard-ExtraBold.eot);
    src: url(/fonts/Pretendard-ExtraBold.eot?#iefix) format(embedded-opentype),
        url(/fonts/Pretendard-ExtraBold.woff2) format(woff2),
        url(/fonts/Pretendard-ExtraBold.woff) format(woff),
        url(/fonts/Pretendard-ExtraBold.ttf) format(truetype),
        url(/fonts/Pretendard-ExtraBold.svg#Pretendard-ExtraBold) format(svg);
    font-weight: bold;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: Pretendard;
    src: url(/fonts/Pretendard-Regular.eot);
    src: url(/fonts/Pretendard-Regular.eot?#iefix) format(embedded-opentype),
        url(/fonts/Pretendard-Regular.woff2) format(woff2),
        url(/fonts/Pretendard-Regular.woff) format(woff),
        url(/fonts/Pretendard-Regular.ttf) format(truetype),
        url(/fonts/Pretendard-Regular.svg#Pretendard-Regular) format(svg);
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: Pretendard;
    src: url(/fonts/Pretendard-Medium.eot);
    src: url(/fonts/Pretendard-Medium.eot?#iefix) format(embedded-opentype),
        url(/fonts/Pretendard-Medium.woff2) format(woff2),
        url(/fonts/Pretendard-Medium.woff) format(woff),
        url(/fonts/Pretendard-Medium.ttf) format(truetype),
        url(/fonts/Pretendard-Medium.svg#Pretendard-Medium) format(svg);
    font-weight: 500;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: Pretendard;
    src: url(/fonts/Pretendard-SemiBold.eot);
    src: url(/fonts/Pretendard-SemiBold.eot?#iefix) format(embedded-opentype),
        url(/fonts/Pretendard-SemiBold.woff2) format(woff2),
        url(/fonts/Pretendard-SemiBold.woff) format(woff),
        url(/fonts/Pretendard-SemiBold.ttf) format(truetype),
        url(/fonts/Pretendard-SemiBold.svg#Pretendard-SemiBold) format(svg);
    font-weight: 600;
    font-style: normal;
    font-display: swap;
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <CssBaseline />
        <style>
        {globals}
        </style>
      </head>
      <body style={{backgroundColor: "#F6F6F6"}}>
        {children}
      </body>
    </html>
  );
}
