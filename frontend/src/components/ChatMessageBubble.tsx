import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { emojisplosion } from "emojisplosion";
import { useState, useRef } from "react";
import { SourceBubble, Source } from "./SourceBubble";
import { VStack, HStack, Box, Divider, Spacer, Icon } from "@chakra-ui/react";
import { apiBaseUrl } from "../utils/ApiService";
import { InlineCitation } from "./InlineCitation";
import { SlLike } from "react-icons/sl";
import { SlDislike } from "react-icons/sl";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
export type Message = {
  id: string;
  createdAt?: Date;
  content: string;
  role: "system" | "user" | "assistant" | "function";
  runId?: string;
  feedback_id?: string | undefined; // chat detail id
  talk_evaluation?: number;
  sources?: Source[];
  name?: string;
  function_call?: { name: string };
};
export type Feedback = {
  feedback_id: string | undefined;
  //run_id: string;
  key: string;
  score: number | undefined;
  comment?: string;
};

const filterSources = (sources: Source[]) => {
  const filtered: Source[] = [];
  const urlMap = new Map<string, number>();
  const indexMap = new Map<number, number>();
  sources.forEach((source, i) => {
    const { url } = source;
    const index = urlMap.get(url);
    if (index === undefined) {
      urlMap.set(url, i);
      indexMap.set(i, filtered.length);
      filtered.push(source);
    } else {
      const resolvedIndex = indexMap.get(index);
      if (resolvedIndex !== undefined) {
        indexMap.set(i, resolvedIndex);
      }
    }
  });
  return { filtered, indexMap };
};

const createAnswerElements = (
  content: string,
  filteredSources: Source[],
  sourceIndexMap: Map<number, number>,
  highlighedSourceLinkStates: boolean[],
  setHighlightedSourceLinkStates: React.Dispatch<
    React.SetStateAction<boolean[]>
  >,
) => {
  const matches = Array.from(content.matchAll(/\[\^?(\d+)\^?\]/g));
  const elements: JSX.Element[] = [];
  let prevIndex = 0;

  matches.forEach((match) => {
    const sourceNum = parseInt(match[1], 10);
    const resolvedNum = sourceIndexMap.get(sourceNum) ?? 10;
    if (match.index !== null && resolvedNum < filteredSources.length) {
      elements.push(
        <span
          key={`content:${prevIndex}`}
          dangerouslySetInnerHTML={{
            __html: content.slice(prevIndex, match.index),
          }}
        ></span>,
      );
      elements.push(
        <InlineCitation
          key={`citation:${prevIndex}`}
          source={filteredSources[resolvedNum]}
          sourceNumber={resolvedNum}
          highlighted={highlighedSourceLinkStates[resolvedNum]}
          onMouseEnter={() =>
            setHighlightedSourceLinkStates(
              filteredSources.map((_, i) => i === resolvedNum),
            )
          }
          onMouseLeave={() =>
            setHighlightedSourceLinkStates(filteredSources.map(() => false))
          }
        />,
      );
      prevIndex = (match?.index ?? 0) + match[0].length;
    }
  });
  elements.push(
    <span
      key={`content:${prevIndex}`}
      dangerouslySetInnerHTML={{ __html: content.slice(prevIndex) }}
    ></span>,
  );
  return elements;
};

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  isMostRecent: boolean;
  messageCompleted: boolean;
}) {
  const { role, content, runId } = props.message;
  const isUser = role === "user";
  const [isLoading, setIsLoading] = useState(false);
  const [traceIsLoading, setTraceIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>({
    feedback_id: props.message?.feedback_id,
    key: "user_score",
    score: props.message?.talk_evaluation,
  });
  const [comment, setComment] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("");
  const upButtonRef = useRef(null);
  const downButtonRef = useRef(null);
  const [highLightLike, setHighLightLike] = useState(false);
  const [highLightDisLike, setHighLightDisLike] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);

  const cumulativeOffset = function (element: HTMLElement | null) {
    var top = 0,
      left = 0;
    do {
      top += element?.offsetTop || 0;
      left += element?.offsetLeft || 0;
      element = (element?.offsetParent as HTMLElement) || null;
    } while (element);

    return {
      top: top,
      left: left,
    };
  };

  const sendUserFeedback = async (
    feedback_id: string,
    score: number,
    key: string,
  ) => {
    // let run_id = runId;
    // if (run_id === undefined) {
    //   return;
    // }
    // if (isLoading) {
    //   return;
    // }
    // setIsLoading(true);
    // try {
    //   const response_detail_chat = await axiosAuth.patch(feed_back, {
    //     login_user_id: 54,
    //     score: score,
    //     feedback_id: feedback_id,
    //     comment: "",
    //   });
    //   if (response_detail_chat.data.result.status == "OK") {
    //     setFeedback({ score, key, feedback_id });
    //     score == 1 ? animateButton("upButton") : animateButton("downButton");
    //   } else if (response_detail_chat.data.result.status == "NG") {
    //     if ((response_detail_chat?.data?.result.msg).includes(errorConnectDB)) {
    //       setIsPopupMessageConnectDB(true);
    //     } else {
    //       alert(response_detail_chat?.data?.result.msg);
    //     }
    //   }
    // } catch (error) {
    //   alert(error);
    // }
    // try {
    //   const data = await sendFeedback({
    //     score,
    //     runId: run_id,
    //     key,
    //     feedbackId: feedback?.feedback_id,
    //     comment,
    //     isExplicit: true,
    //   });
    //   if (data.code === 200) {
    //     setFeedback({ run_id, score, key, feedback_id: data.feedbackId });
    //     score == 1 ? animateButton("upButton") : animateButton("downButton");
    //     if (comment) {
    //       setComment("");
    //     }
    //   }
    // } catch (e: any) {
    //   toast.error(e.message);
    // }
    setIsLoading(false);
  };
  const viewTrace = async () => {
    try {
      setTraceIsLoading(true);
      const response = await fetch(apiBaseUrl + "/get_trace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          run_id: runId,
        }),
      });

      const data = await response.json();

      if (data.code === 400) {
        toast.error("Unable to view trace");
        throw new Error("Unable to view trace");
      } else {
        const url = data.replace(/['"]+/g, "");
        window.open(url, "_blank");
        setTraceIsLoading(false);
      }
    } catch (e: any) {
      setTraceIsLoading(false);
      toast.error(e.message);
    }
  };

  const sources = props.message.sources ?? [];
  const { filtered: filteredSources, indexMap: sourceIndexMap } =
    filterSources(sources);

  // Use an array of highlighted states as a state since React
  // complains when creating states in a loop
  const [highlighedSourceLinkStates, setHighlightedSourceLinkStates] = useState(
    filteredSources.map(() => false),
  );
  const answerElements =
    role === "assistant"
      ? createAnswerElements(
          content,
          filteredSources,
          sourceIndexMap,
          highlighedSourceLinkStates,
          setHighlightedSourceLinkStates,
        )
      : [];

  const animateButton = (buttonId: string) => {
    let button: HTMLButtonElement | null;
    if (buttonId === "upButton") {
      button = upButtonRef.current;
    } else if (buttonId === "downButton") {
      button = downButtonRef.current;
    } else {
      return;
    }
    if (!button) return;
    let resolvedButton = button as HTMLButtonElement;
    resolvedButton.classList.add("animate-ping");
    setTimeout(() => {
      resolvedButton.classList.remove("animate-ping");
    }, 500);

    emojisplosion({
      emojiCount: 10,
      uniqueness: 1,
      position() {
        const offset = cumulativeOffset(button);

        return {
          x: offset.left + resolvedButton.clientWidth / 2,
          y: offset.top + resolvedButton.clientHeight / 2,
        };
      },
      emojis: buttonId === "upButton" ? ["👍"] : ["👎"],
    });
  };

  return (
    <VStack align="start" spacing={5} pb={5}>
      {isUser ? (
        <>
          <div className="bg-white rounded-lg overflow-hidden w-full">
            <Box className="h-8 flex items-center justify-start bg-gray-600">
              <svg
                className="h-6 w-6 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Box>

            <Box className="bg-gray-300 px-4 py-2" color="black">
              {content}
            </Box>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg overflow-hidden w-full">
            <Box className="h-8 flex items-center justify-start bg-gray-600">
              <svg
                className="h-6 w-6 text-yellow-500"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <line x1="3" y1="10" x2="3" y2="16" />
                <line x1="21" y1="10" x2="21" y2="16" />
                <path d="M7 9h10v8a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-8a5 5 0 0 1 10 0" />
                <line x1="8" y1="3" x2="9" y2="5" />
                <line x1="16" y1="3" x2="15" y2="5" />
                <line x1="9" y1="18" x2="9" y2="21" />
                <line x1="15" y1="18" x2="15" y2="21" />
              </svg>
            </Box>

            <Box
              className="whitespace-pre-wrap px-4 py-2 bg-gray-300"
              color="black"
            >
              {answerElements}
              <br />
              <br />
              Source:
              {filteredSources.map((source, index) => (
                <Box key={index}>
                  <SourceBubble
                    source={source}
                    highlighted={highlighedSourceLinkStates[index]}
                    onMouseEnter={() =>
                      setHighlightedSourceLinkStates(
                        filteredSources.map((_, i) => i === index),
                      )
                    }
                    onMouseLeave={() =>
                      setHighlightedSourceLinkStates(
                        filteredSources.map(() => false),
                      )
                    }
                    runId={runId}
                  />
                </Box>
              ))}
            </Box>
          </div>
        </>
      )}
      {/* Popup message connect DB error */}
      <Modal
        isOpen={isPopupMessageConnectDB}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                System Error
              </ModalHeader>
              <ModalBody>
                <p>Unable to connect to database</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="btnPopup"
                  onClick={() => setIsPopupMessageConnectDB(false)}
                >
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {props.message.role !== "user" &&
        // props.isMostRecent &&
        props.messageCompleted && (
          <HStack spacing={2}>
            <button
              disabled={feedback !== null && feedback.score === 1}
              className="mr-[10px] "
              onClick={() => {
                sendUserFeedback(
                  String(props.message.feedback_id),
                  1,
                  "user_score",
                );
                animateButton("upButton");
                setFeedbackColor("border-4 border-green-300");
                setHighLightLike(!highLightLike);
                setHighLightDisLike(false);
              }}
            >
              {/* 👍 */}
              <span>
                <Icon
                  style={
                    feedback !== null && feedback.score === 1
                      ? { color: "#FB8C00", background: "#EFEFEE" }
                      : { color: "#BDBDBD", background: "#EFEFEE" }
                  }
                  as={SlLike}
                />
              </span>
            </button>
            <button
              disabled={feedback !== null && feedback.score === 2}
              className="w-[50px]"
              onClick={() => {
                sendUserFeedback(
                  String(props.message.feedback_id),
                  2,
                  "user_score",
                );
                animateButton("downButton");
                setFeedbackColor("border-4 border-red-300");
                setHighLightLike(false);
                setHighLightDisLike(!highLightDisLike);
              }}
            >
              {/* 👎 */}
              <span>
                <Icon
                  style={
                    feedback !== null && feedback.score === 2
                      ? { color: "#FB8C00", background: "#EFEFEE" }
                      : { color: "#BDBDBD", background: "#EFEFEE" }
                  }
                  as={SlDislike}
                />
              </span>
            </button>
            <Spacer />
          </HStack>
        )}

      {!isUser && <Divider mt={4} mb={4} />}
    </VStack>
  );
}
