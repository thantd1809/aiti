"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { marked } from "marked";
import { Renderer } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/gradient-dark.css";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { applyPatch } from "fast-json-patch";
import "react-toastify/dist/ReactToastify.css";
import {
  IconButton,
  InputGroup,
  InputRightElement,
  Spinner,
} from "@chakra-ui/react";
import { ArrowUpIcon } from "@chakra-ui/icons";
import { EmptyState } from "../components/EmptyState";
import { ChatMessageBubble, Message } from "../components/ChatMessageBubble";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { Source } from "./SourceBubble";
import { useRouter } from "next/navigation";
import { apiBaseUrl } from "../utils/ApiService";
import classNames from "classnames";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import "../styles/modal.css";
import { useUser } from "../utils/UserContext";
import { chat } from "../utils/ApiService";
import { toast } from "react-toastify";
import PopupListFileFolder from "./PopupListFileFolder";
import Cookies from "js-cookie";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SelectedItem {
  id: string;
  name: string;
}

export function ChatWindow(props: {
  placeholder?: string;
  titleText?: string;
  chat_id?: string;
  initialMessages?: Array<Message>;
}) {
  const router = useRouter();
  const conversationId = uuidv4();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const { chat_id = null } = props; // Removed unused 'placeholder' variable
  const [messages, setMessages] = useState<Array<Message>>(
    props.initialMessages || [],
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { human: string; ai: string }[]
  >([]);
  const { user } = useUser();
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [stateVoice, setStateVoice] = useState(false);
  const [isOpenListFileFolder, setOpenListFileFolder] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedItem[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<SelectedItem[]>([]);

  const handleConfirmSelect = (
    files: SelectedItem[],
    folders: SelectedItem[],
  ) => {
    setSelectedFiles(files);
    setSelectedFolders(folders);
  };

  const removeFileTag = (id: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const removeFolderTag = (id: string) => {
    setSelectedFolders((prev) => prev.filter((folder) => folder.id !== id));
  };

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user]);

  const storeChatHistory = async (
    chat_id: string | null,
    question: string,
    answer: string,
    sources: Source[] | undefined,
  ) => {
    if (user) {
      // Filter unique items based on the 'url' property for sources
      const uniqueSources = sources?.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.url === item.url),
      );
      if (chat_id) {
        // Add chat detail history from second time
        const response_detail_chat = await chat(
          question,
          chat_id,
          question,
          answer,
          uniqueSources,
        );
        if (response_detail_chat.data.result.status == "OK") {
          setIsLoading(false);
          return;
        }
      } else {
        // Add chat history and detail history for first time
        const response_chat = await chat(
          question,
          "",
          question,
          answer,
          uniqueSources,
        );
        if (response_chat.data.result.status == "OK") {
          if (typeof window !== "undefined") {
            localStorage.setItem("sendMessageStatus", "true");
          }
          router.push(`/chat/${response_chat.data.data.chat_id}`);
          router.refresh();
        }
      }
    }
  };

  const token = Cookies.get("access_token");

  const sendMessage = async (message?: string) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.classList.add("grow");
    }
    if (isLoading) {
      return;
    }
    const messageValue = message ?? input;
    if (messageValue === "") return;
    setInput("");
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Math.random().toString(), content: messageValue, role: "user" },
    ]);
    setIsLoading(true);
    let accumulatedMessage = "";
    let runId: string | undefined = undefined;
    let sources: Source[] | undefined = undefined;
    let messageIndex: number | null = null;

    let renderer = new Renderer();
    renderer.paragraph = (text) => {
      return text + "\n";
    };
    renderer.list = (text) => {
      return `${text}\n\n`;
    };
    renderer.listitem = (text) => {
      return `\n• ${text}`;
    };
    renderer.code = (code, language) => {
      const validLanguage = hljs.getLanguage(language || "")
        ? language
        : "plaintext";
      const highlightedCode = hljs.highlight(
        validLanguage || "plaintext",
        code,
      ).value;
      return `<pre class="highlight bg-gray-700" style="padding: 5px; border-radius: 5px; overflow: auto; overflow-wrap: anywhere; white-space: pre-wrap; max-width: 100%; display: block; line-height: 1.2"><code class="${language}" style="color: #d6e2ef; font-size: 12px; ">${highlightedCode}</code></pre>`;
    };
    marked.setOptions({ renderer });
    try {
      const sourceStepName = "FindDocs";
      let streamedResponse: Record<string, any> = {};
      const file_ids = selectedFiles.map((f) => f.id);
      const folder_ids = selectedFolders.map((f) => f.id);

      await fetchEventSource(apiBaseUrl + "/chat/stream_log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: {
            question: messageValue,
            chat_history: chatHistory,
          },
          config: {
            metadata: {
              conversation_id: conversationId,
            },
          },
          include_names: ["FindDocs"],
          file_ids: file_ids,
          folder_ids: folder_ids,
        }),
        openWhenHidden: true,
        onerror(err) {
          throw err;
        },
        onmessage(msg) {
          if (msg.event === "end") {
            setChatHistory((prevChatHistory) => [
              ...prevChatHistory,
              { human: messageValue, ai: accumulatedMessage },
            ]);
            storeChatHistory(
              chat_id,
              messageValue,
              accumulatedMessage,
              sources,
            );
          }
          if (msg.event === "data" && msg.data) {
            const chunk = JSON.parse(msg.data);
            streamedResponse = applyPatch(
              streamedResponse,
              chunk.ops,
            ).newDocument;
            if (
              Array.isArray(
                streamedResponse?.logs?.[sourceStepName]?.final_output?.output,
              )
            ) {
              sources = streamedResponse.logs[
                sourceStepName
              ].final_output.output.map((doc: Record<string, any>) => ({
                url: doc.metadata.source,
                title: doc.metadata.source.replace(/^.*(\\|\/|\:)/, ""),
              }));
            }
            if (streamedResponse.id !== undefined) {
              runId = streamedResponse.id;
            }
            if (Array.isArray(streamedResponse?.streamed_output)) {
              accumulatedMessage = streamedResponse.streamed_output.join("");
            }
            const parsedResult = marked.parse(accumulatedMessage);
            setMessages((prevMessages) => {
              let newMessages = [...prevMessages];
              if (
                messageIndex === null ||
                newMessages[messageIndex] === undefined
              ) {
                messageIndex = newMessages.length;
                newMessages.push({
                  id: Math.random().toString(),
                  content: parsedResult.trim(),
                  runId: runId,
                  sources: sources,
                  role: "assistant",
                });
              } else if (newMessages[messageIndex] !== undefined) {
                newMessages[messageIndex].content = parsedResult.trim();
                newMessages[messageIndex].runId = runId;
                newMessages[messageIndex].sources = sources;
              }
              return newMessages;
            });
          }
        },
      });
    } catch (e) {
      setMessages((prevMessages) => prevMessages.slice(0, -1));
      setIsLoading(false);
      setInput(messageValue);
      setIsPopupMessageConnectDB(true);
    }
  };

  const sendInitialQuestion = async (question: string) => {
    await sendMessage(question);
  };
  const styleChatbotBox = classNames(
    "flex flex-col-reverse w-full mb-2 overflow-auto",
    {
      ["h-[90%]"]: messages.length > 0,
      [""]: messages.length == 0,
    },
  );

  const startRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("The browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStateVoice(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setStateVoice(false);
    };

    recognition.onerror = (event: any) => {
      toast.error("Voice error: " + event.error);
      setStateVoice(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-center p-8 h-[90%] rounded grow w-full over">
      <div
        className={`${styleChatbotBox} sm:h-[90%] h-[70%] chatbot-container`}
        ref={messageContainerRef}
      >
        {messages.length > 0 ? (
          [...messages]
            .reverse()
            .map((m, index) => (
              <ChatMessageBubble
                key={m.id}
                message={{ ...m }}
                aiEmoji="🦜"
                isMostRecent={index === 0}
                messageCompleted={!isLoading}
              ></ChatMessageBubble>
            ))
        ) : (
          <EmptyState onChoice={sendInitialQuestion} />
        )}
      </div>
      <div className="flex justify-center">
        <Button
          className="my-1 h-8 w-[200px]"
          onClick={() => setOpenListFileFolder(true)}
        >
          📁 Choose Files / Folders
        </Button>
      </div>
      <div className="flex items-center w-full gap-2">
        <div className="flex-grow w-full border-2 border-gray-300 rounded-lg shadow-md p-2 flex flex-wrap items-center gap-1 transition-all focus-within:shadow-lg focus-within:border-blue-400">
          {selectedFiles.map((file) => (
            <div
              key={`file-${file.id}`}
              className="bg-blue-100 text-blue-800 text-sm font-medium pl-2.5 pr-1 py-0.5 rounded-full flex items-center shrink-0"
            >
              <span>{file.name}</span>
              <button
                onClick={() => removeFileTag(file.id)}
                className="ml-1.5 w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center text-blue-800"
              >
                &times;
              </button>
            </div>
          ))}
          {selectedFolders.map((folder) => (
            <div
              key={`folder-${folder.id}`}
              className="bg-green-100 text-green-800 text-sm font-medium pl-2.5 pr-1 py-0.5 rounded-full flex items-center shrink-0"
            >
              <span>{folder.name}</span>
              <button
                onClick={() => removeFolderTag(folder.id)}
                className="ml-1.5 w-4 h-4 rounded-full bg-green-200 hover:bg-green-300 flex items-center justify-center text-green-800"
              >
                &times;
              </button>
            </div>
          ))}

          <AutoResizeTextarea
            isDisabled={isLoading}
            value={input}
            maxRows={3}
            placeholder={
              selectedFiles.length > 0 || selectedFolders.length > 0
                ? ""
                : "Please ask me anything!"
            }
            textColor="black"
            className="flex-grow bg-transparent border-0 focus:outline-none focus:ring-0 p-0 m-0 resize-none self-center min-w-[150px]"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              } else if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                setInput(input + "\n");
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2 pr-1 shrink-0">
          <Button
            onClick={startRecognition}
            color={stateVoice ? "warning" : "danger"}
            radius="full"
            isIconOnly
            className="flex items-center justify-center rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-mic"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </Button>

          <IconButton
            colorScheme="blue"
            rounded="full"
            aria-label="Send"
            icon={isLoading ? <Spinner /> : <ArrowUpIcon />}
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          />
        </div>
      </div>
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
      {isOpenListFileFolder && (
        <PopupListFileFolder
          isOpen={isOpenListFileFolder}
          onClose={() => setOpenListFileFolder(false)}
          onConfirm={handleConfirmSelect}
          initialSelectedFileIds={selectedFiles.map((f) => f.id)}
          initialSelectedFolderIds={selectedFolders.map((f) => f.id)}
        />
      )}
    </div>
  );
}
