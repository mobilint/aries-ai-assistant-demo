import { Grid2, Button, Typography } from "@mui/material";
import MobilintIncPanel from "./MobilintIncPanel";
import { DialogType } from "./type";
import MobilintButton from "./MobilintButton";
import { useState } from "react";
import MobilintModal from "./MobilintModal";
import Image from "next/image";

export default function Sidebar({
  dialog,
  reset,
  disabled,
  history,
  historyIndex,
  setHistoryIndex,
}: {
  dialog: DialogType,
  reset: () => void,
  disabled: boolean,
  history: DialogType[],
  historyIndex: number | null,
  setHistoryIndex: (i: number | null) => void,
}) {
  const [llmOpen, setLlmOpen] = useState<boolean>(false);
  const [mlaOpen, setMlaOpen] = useState<boolean>(false);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  
  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent="space-between"
      alignItems="stretch"
      sx={{
        padding: "26px 16px 20px 24px",
      }}
    >
      <Grid2
        container
        direction="column"
        justifyContent="space-between"
        alignItems="stretch"
      >
        <MobilintIncPanel onReset={reset} resetDisabled={disabled || dialog.length == 0} />
        <div style={{marginTop: "46px"}}></div>
        <Grid2
          container
          direction="column"
          justifyContent="stretch"
          rowSpacing={"3px"}
        >
          <MobilintButton
            text={dialog.length > 0 ? "Current Chat" : "Start New Chat"}
            iconSrc="/startnewchat_white.svg"
            width={25}
            height={25}
            onClick={() => setHistoryIndex(null)}
            isActive={historyIndex == null && !llmOpen && !mlaOpen && !contactOpen}
          />
          <MobilintButton
            text="Mobilint LLM"
            iconSrc="/mobilint_white.svg"
            width={25}
            height={25}
            onClick={() => setLlmOpen(true)}
            isActive={llmOpen}
          />
          <MobilintButton
            text="Mobilint MLA100"
            iconSrc="/mla_white.svg"
            width={25}
            height={25}
            onClick={() => setMlaOpen(true)}
            isActive={mlaOpen}
          />
        </Grid2>
      </Grid2>
      <Grid2
        container
        direction="column"
        justifyContent={"stretch"}
        rowSpacing={"20px"}
      >
        <MobilintButton
          text="Contact us"
          iconSrc="/contact.svg"
          width={20}
          height={17}
          onClick={() => setContactOpen(true)}
          isActive={contactOpen}
          isPointColor
        />
        <Typography
          sx={{
            fontWeight: "regular",
            fontSize: "16px",
            lineHeight: "150%",
            letterSpacing: "-0.2px",
            textAlign: "center",
            width: "100%",
            color: "#868686",
          }}
        >
          © 2025 Mobilint, Inc. All rights reserved
        </Typography>
      </Grid2>
      <MobilintModal
        title="Mobilint's LLM technology?"
        open={llmOpen}
        onClose={() => setLlmOpen(false)}
        onReset={reset}
      >
        <Typography
          textAlign={"left"}
          sx={{
            fontWeight: "regular",
            fontSize: "16px",
            lineHeight: "150%",
            letterSpacing: "-1%",
            color: "#303843",
          }}
        >
          Mobilint’s LLM technology is an optimized solution based on our AI semiconductor, ARIES, enabling the execution of large language models in on-premise or edge environments.
          <br /><br />
          This allows for real-time natural language processing and generative AI capabilities without relying on the cloud.
        </Typography>
      </MobilintModal>
      <MobilintModal
        title="Mobilint MLA100"
        open={mlaOpen}
        onClose={() => setMlaOpen(false)}
        onReset={reset}
      >
        <Image
          src="/MLA100_01.png"
          width={350}
          height={165}
          alt="MLA100"
          style={{margin: "22px 0px"}}
        />
        <Typography
          textAlign={"left"}
          sx={{
            fontWeight: "600",
            fontSize: "20px",
            lineHeight: "150%",
            letterSpacing: "-1%",
            color: "#303843",
            margin: "22px 0px",
            width: "100%",
          }}
        >
          Scalable AI Accelerator Card for Powerful On-Premises Inference
        </Typography>
        <Typography
          textAlign={"left"}
          sx={{
            fontWeight: "regular",
            fontSize: "16px",
            lineHeight: "150%",
            letterSpacing: "-1%",
            color: "#303843",
          }}
        >
          MLA100 is the world's leading AI accelerator PCIe card for edge computing. It delivers outstanding AI performance with low energy consumption that overcomes the limitations of existing processors and unleashes full potential of AI technologies.
          <br /><br />
          MLA100 supports various computation structures with DNN-based architectural blocks and seamlessly maintains individual models without requiring further modification. Empower yourself with MLA100 to accelerate the implementation of AI algorithms in your solution TODAY.
        </Typography>
      </MobilintModal>
      <MobilintModal
        title="Excited about the Future of AI?"
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onReset={reset}
      >
        <Grid2 container
          direction="column"
          alignItems={"center"}
        >
          <Image
            src="/contact_us_qr.png"
            alt="contact@mobilint.com"
            width={172}
            height={172}
            style={{margin: "22px 0px"}}
          />
          <Typography
            textAlign={"center"}
            sx={{
              fontWeight: "regular",
              fontSize: "16px",
              lineHeight: "150%",
              letterSpacing: "-1%",
              color: "#303843",
            }}
          >
            If you would like to assess your AI infrastructure needs and determine solution fit,
            <br />
            feel free to reach out to us at <span style={{fontWeight: "bold"}}>contact@mobilint.com</span>.
          </Typography>
        </Grid2>
      </MobilintModal>
    </Grid2>
  )
}