"use client";
import { ChatWindow } from "@/src/components/ChatWindow";
import { useEffect, useState } from "react";
import { Message } from "@/src/components/ChatMessageBubble";
import NotFoundPage from "@/src/components/NotFoundPage";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useUser } from "@/src/utils/UserContext";
import { chatId } from "@/src/utils/ApiService";

export default function Page(props: any) {
  const [initialMessages, setInitialMessages] = useState<Array<Message>>([]);
  const [loadChat, setLoadChat] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const { user } = useUser();

  useEffect(
    function () {
      async function fetchData() {
        try {
          if (user && props?.params?.chat_id) {
            const response_detail_chat = await chatId(props?.params?.chat_id);
            if (response_detail_chat.data.result.status == "OK") {
              if (response_detail_chat.data?.data?.length <= 0) {
                setLoadChat(true);
              }
              let newMessages: Array<Message> = [];
              response_detail_chat.data?.data?.map((item: any) => {
                newMessages?.push({
                  id: Math.random().toString(),
                  content: item.question,
                  role: "user",
                });
                newMessages?.push({
                  id: Math.random().toString(),
                  content: item.answer,
                  feedback_id: item.chat_detail_id,
                  talk_evaluation: item.talk_evaluation,
                  sources: JSON.parse(item.ref_file),
                  role: "assistant",
                });
              });
              setInitialMessages(newMessages);
            } else if (response_detail_chat.data.result.status == "NG") {
              if (
                !(response_detail_chat?.data?.result.msg).includes(
                  errorConnectDB,
                )
              ) {
                alert(response_detail_chat?.data?.result.msg);
              }
            }
          }
        } catch (error) {
          setLoadChat(true);
        }
      }

      fetchData();
    },
    [user, props?.params?.chat_id],
  );

  return (
    <>
      {initialMessages.length > 0 && (
        <ChatWindow
          placeholder="Please ask me anything!"
          chat_id={props?.params?.chat_id}
          initialMessages={initialMessages}
        ></ChatWindow>
      )}
      {loadChat == true && <NotFoundPage></NotFoundPage>}
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
    </>
  );
  // return <p>Post:{props.params.chat_id}</p>
}
