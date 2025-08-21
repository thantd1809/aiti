import "react-toastify/dist/ReactToastify.css";
import { Box } from "@chakra-ui/react";
import { sendFeedback } from "../utils/sendFeedback";

export type Source = {
  url: string;
  title: string;
};

export function SourceBubble({
  source,
  onMouseEnter,
  onMouseLeave,
  runId,
}: {
  source: Source;
  highlighted: boolean;
  onMouseEnter: () => any;
  onMouseLeave: () => any;
  runId?: string;
}) {
  return (
    <Box
      // onClick={async () => {
      //   window.open(source.url, "_blank");
      //   if (runId) {
      //     await sendFeedback({
      //       key: "user_click",
      //       runId,
      //       value: source.url,
      //       isExplicit: false,
      //     });
      //   }
      // }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      cursor={"pointer"}
      overflow={"hidden"}
      fontSize="sm"
      fontWeight={"medium"}
    >
      # {source.title}
    </Box>
  );
}
