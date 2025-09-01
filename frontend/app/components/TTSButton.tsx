import { Button } from "@mui/material";

export default function TTSButton({
  index,
  answer,
  isPlayStarted,
  isPlayEnded,
  playingIndex,
  read,
  abortTTS,
}: {
  index: number,
  answer: string,
  isPlayStarted: boolean,
  isPlayEnded: boolean,
  playingIndex: number | null,
  read: (index: number, text: string) => void,
  abortTTS: () => void,
}) {
  const disabled = (playingIndex != null && playingIndex != index) || (playingIndex == index && isPlayStarted == false)
  return (
    <Button
      aria-label="play"
      disabled={disabled}
      disableRipple
      onClick={(e) => playingIndex == index ? abortTTS() : read(index, answer)}
      sx={{
        color: "#FFFFFF",
        padding: "10px 15px",
        borderRadius: "15px",
        background: "linear-gradient(to top, #064BB0 0%, #007DEA 100%)",
        "&:hover": {
          color: "#B1D4FF",
        },
        "&:disabled": {
          color: "#B1D4FF",
          background: "linear-gradient(to top, #064BB0CC 0%, #007DEACC 100%)",
        },
      }}
    >
    {playingIndex == index && isPlayStarted == false ?
      <svg width="17.59" height="22.02" viewBox="0 0 19 23" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.83594 11.0195C2.83601 14.6581 5.795 17.6172 9.43359 17.6172C13.0721 17.617 16.0312 14.658 16.0312 11.0195H18.2305C18.2304 15.4981 14.8644 19.1958 10.5332 19.7402V22.0156H8.33398V19.7402C4.00262 19.1959 0.636789 15.4971 0.636719 11.0195H2.83594ZM9.45703 0C11.8694 1.22078e-05 13.8318 1.98325 13.832 4.4209V11.0195C13.8318 13.4451 11.8592 15.418 9.43359 15.418C7.00813 15.4178 5.03541 13.445 5.03516 11.0195V4.4209C5.03676 3.29078 5.47291 2.20449 6.25293 1.38672C7.03316 0.568824 8.0985 0.0820832 9.22754 0.0273438C9.30276 0.00958859 9.37974 0.000464393 9.45703 0Z" fill="currentColor"/>
      </svg> :
    playingIndex == index && isPlayStarted == true ?
      <svg width="21.35" height="22.02" viewBox="0 0 23 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_459_75)">
      <path d="M5.07715 12.0225C5.07738 15.6618 8.03736 18.6211 11.6768 18.6211C12.3069 18.6201 12.934 18.5288 13.5381 18.3496L15.2412 20.0527C14.4582 20.4035 13.6275 20.6366 12.7764 20.7451V23.0205H10.5771V20.7451C6.24371 20.2007 2.87815 16.501 2.87793 12.0225H5.07715ZM11.7002 1C14.1132 1.00021 16.0762 2.98452 16.0762 5.42285V12.0225C16.0727 12.8047 15.8565 13.5711 15.4512 14.2402L17.0449 15.835C17.844 14.7241 18.2752 13.3909 18.2764 12.0225H20.4756C20.4744 13.974 19.8185 15.8684 18.6133 17.4033L22.3535 21.1436L20.7979 22.6982L1 2.90039L2.55566 1.3457L7.27734 6.06738V5.42285C7.27884 4.29221 7.71469 3.20482 8.49512 2.38672C9.27548 1.56879 10.3406 1.08214 11.4697 1.02734C11.5456 1.00975 11.6232 1 11.7002 1ZM11.6025 16.415C10.4636 16.3951 9.37674 15.9334 8.57129 15.1279C7.76587 14.3224 7.30494 13.2356 7.28516 12.0967L11.6025 16.415Z" fill="currentColor"/>
      </g>
      <defs>
      <clipPath id="clip0_459_75">
      <rect width="23" height="23" fill="currentColor" transform="translate(0 0.5)"/>
      </clipPath>
      </defs>
      </svg> :
      <svg width="17.59" height="22.02" viewBox="0 0 19 23" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.83594 11.0195C2.83601 14.6581 5.795 17.6172 9.43359 17.6172C13.0721 17.617 16.0312 14.658 16.0312 11.0195H18.2305C18.2304 15.4981 14.8644 19.1958 10.5332 19.7402V22.0156H8.33398V19.7402C4.00262 19.1959 0.636789 15.4971 0.636719 11.0195H2.83594ZM9.45703 0C11.8694 1.22078e-05 13.8318 1.98325 13.832 4.4209V11.0195C13.8318 13.4451 11.8592 15.418 9.43359 15.418C7.00813 15.4178 5.03541 13.445 5.03516 11.0195V4.4209C5.03676 3.29078 5.47291 2.20449 6.25293 1.38672C7.03316 0.568824 8.0985 0.0820832 9.22754 0.0273438C9.30276 0.00958859 9.37974 0.000464393 9.45703 0Z" fill="currentColor"/>
      </svg>
    }
      <span style={{
        fontWeight: "500",
        fontSize: "16px",
        lineHeight: "150%",
        letterSpacing: "-0.2px",
        marginLeft: "10px"
      }}>
      {playingIndex == index && isPlayStarted == false ?
        "GENERATING" :
      playingIndex == index && isPlayStarted == true ?
        "STOP PLAYING" :
        "HEAR ME SPEAK"
      }
      </span>
    </Button>
  );
}