"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import moment from "moment";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@chakra-ui/react";
import { FaRegTrashAlt } from "react-icons/fa";
import Link from "next/link";
import {
  Button,
  CircularProgress,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { AiOutlineFileAdd } from "react-icons/ai";
import { E0013 } from "../utils/message";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../utils/UserContext";
import { chatHistory, deleteChats, instance } from "../utils/ApiService";

interface ListHistoryProps {
  openList: boolean;
  setOpenList: React.Dispatch<React.SetStateAction<boolean>>;
}
export const dynamic = "force-dynamic";
const ListHistory: React.FC<ListHistoryProps> = ({ openList, setOpenList }) => {
  const currentPath = usePathname();
  const [listHistory, setListHistory] = useState<any[]>([]);
  // Modal display message doesn't chosse record
  const [isModalMessage, setIsModalMessage] = useState(false);
  // Modal display message delete records success
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});
  const [listCheckAll, setListCheckAll] = useState([] as any[]);
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const { user } = useUser();
  // To check if having a new conversation, add title to the list history
  const [sendMessageStatus, setSendMessageStatus] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSendMessageStatus(localStorage.getItem("sendMessageStatus"));
    }
  }, []);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [hasMore, setHasMore] = useState(true); // To check if having more data to load
  const [loading, setLoading] = useState(false); // Logo loading when scroll down
  const [page, setPage] = useState(2);

  // To search
  useEffect(() => {
    if (user) {
      getListHistory(valueSearch.searchQuery || "");
    }
  }, [valueSearch]);

  // Get sendMessageStatus automatically from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = localStorage.getItem("sendMessageStatus");
      setSendMessageStatus((prevStatus) =>
        prevStatus !== currentStatus ? currentStatus : prevStatus,
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Get new list when sendMessageStatus is true
  useEffect(() => {
    if (sendMessageStatus === "true") {
      getListHistory("");
      if (typeof window !== "undefined") {
        localStorage.setItem("sendMessageStatus", "false");
      }
    }
  }, [sendMessageStatus]);

  // Get list history when user log in
  useEffect(() => {
    if (user) {
      setSpinner(true);
      getListHistory("");
    }
  }, [user]);

  // Get list history when user srolldown(load more if hasMore is true)
  useEffect(() => {
    if (hasMore) {
      fetchChats(page);
    }
  }, [page, user]);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current || loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;

      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setLoading(true);
        setTimeout(() => {
          setPage((prev) => prev + 1);
          setLoading(false);
        }, 1000);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [loading, hasMore]);

  // function get list history chat of user login, and get search value
  const getListHistory = async (search: string) => {
    try {
      if (!user) return;
      setSpinner(true);
      const response = await chatHistory(search);
      if (response.data.result.status !== "OK") {
        if (response?.data?.result?.msg?.includes(errorConnectDB)) {
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result?.msg);
        }
        setSpinner(false);
        return;
      }
      let listResponse = response.data.data.map((obj: any) => ({
        ...obj,
        create_at: moment(obj.create_at),
      }));
      listResponse = listResponse.sort((a: any, b: any) =>
        b.create_at.diff(a.create_at),
      );
      setListHistory(listResponse);
      setPage(1);
      setHasMore(true);
      setSpinner(false);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      alert("Failed to acquire data.");
      setSpinner(false);
    }
  };

  // Saves the value of checked records
  const checkboxHandler = (e: any) => {
    let isSelected = e.target.checked;

    let value = e.target.value;

    if (isSelected) {
      setSelectedItems([...selectedItems, value]);
    } else {
      setSelectedItems((prevData) => {
        return prevData.filter((id) => {
          return id !== value;
        });
      });
    }
  };

  const checkAllHandler = () => {
    setIsCheckAll(!isCheckAll);
    if (isCheckAll) {
      setSelectedItems([]);
    } else {
      const postIds = listHistory.map((item: any) => {
        return item["chat_id"];
      });
      setSelectedItems(postIds);
    }
    const updatedValue = [...listCheckAll];
    if (listCheckAll.length <= 0) {
      setListCheckAll([...listCheckAll, { check: !isCheckAll }]);
    } else {
      const result = updatedValue.findIndex((a) => a.page === listHistory);
      if (result >= 0) {
        const nextList = [...listCheckAll];
        nextList[result].check = !isCheckAll;
      } else {
        setListCheckAll([...listCheckAll, { check: !isCheckAll }]);
      }
    }
  };

  const handleDeleteChat = async () => {
    try {
      if (user) {
        setSpinner(true);
        const response = await deleteChats(selectedItems);
        if (response.data.result.status == "OK") {
          closeModalDeleteSuccess();
          setIsCheckAll(false);
          toast.success("Delete success", {
            className: "custom-toast",
            closeButton: false,
            autoClose: 1000,
          });
        } else if (response?.data?.result?.status == "NG") {
          if ((response?.data?.result.msg).includes(errorConnectDB)) {
            setIsPopupMessageConnectDB(true);
          } else {
            alert(response?.data?.result.msg);
          }
        }
        setOpenModal(false);
        setSpinner(false);
      }
    } catch (error) {
      alert(error);
    }
  };

  // Close Modal when Modal message delete is displayed
  const closeModal = () => {
    setOpenModal(false);
    setIsModalMessage(false);
    setIsPopupMessageConnectDB(false);
  };

  // Diplay popup when click delete button
  const openPopup = () => {
    if (selectedItems.length < 1) {
      setIsModalMessage(true);
    } else {
      setOpenModal(true);
    }
  };

  // Close popup delete success & reload page
  const closeModalDeleteSuccess = () => {
    let id = currentPath.split("/");
    const result = selectedItems.findIndex((a) => a == parseInt(id[2]));
    if (result >= 0) {
      router.push("/chat");
    }
    setSelectedItems([]);
    getListHistory("");
    setPage(1);
  };

  const openListHistory = () => {
    setOpenList(!openList);
  };

  // Group chats with the same time
  const groupedChats = useMemo(() => {
    const groups: Record<string, any[]> = {};

    for (const chat of listHistory) {
      const chatDate = moment(chat.create_at);
      const now = moment();
      const diffDays = now.diff(chatDate, "days");
      const diffMonths = now.diff(chatDate, "months");
      const year = chatDate.year();

      let dateKey = "";

      if (diffDays === 0) {
        dateKey = "Today";
      } else if (diffDays === 1) {
        dateKey = "Yesterday";
      } else if (diffDays <= 3) {
        dateKey = "3 days ago";
      } else if (diffDays <= 7) {
        dateKey = "7 days ago";
      } else if (diffMonths < 1) {
        dateKey = "1 month ago";
      } else {
        dateKey = String(year);
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(chat);
    }
    if (groups["Today"]?.length >= 10 && hasMore) {
      return {
        Today: groups["Today"],
      };
    }

    return groups;
  }, [listHistory, hasMore]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch chats when sroll down
  const fetchChats = async (pageNumber: number) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const res = await instance.get(`/chat?page=${pageNumber}&limit=10`);
      const { data, total } = res.data;

      const processedData = data.map((chat: any) => ({
        ...chat,
        create_at: moment(chat.create_at),
      }));

      setListHistory((prev) => {
        const chatIds = new Set(prev.map((c) => c.chat_id));
        const newData = processedData.filter(
          (c: any) => !chatIds.has(c.chat_id),
        );
        return [...prev, ...newData];
      });

      if ((pageNumber - 1) * 10 + processedData.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedChats = [...listHistory].sort((a, b) =>
    moment(b.create_at).diff(moment(a.create_at)),
  );

  // Set timeout for search input
  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedInput = useCallback(
    debounce((key: string, val: string) => {
      setValueSearch((prev) =>
        typeof prev === "object" ? { ...prev, [key]: val } : { [key]: val },
      );
    }, 1000),
    [],
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    debouncedInput("searchQuery", query);
  };

  return (
    openList && (
      <div
        className="px-4 pt-1 md:pt-8 pb-4 bg-light flex justify-between flex-col"
        style={{
          background: "black",
          minHeight: "100vh",
        }}
      >
        <div className="flex flex-col">
          <div className="flex justify-end md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-align-justify-icon lucide-align-justify"
              onClick={openListHistory}
            >
              <path d="M3 12h18" />
              <path d="M3 18h18" />
              <path d="M3 6h18" />
            </svg>
          </div>
          <div className="flex flex-col-reverse items-start mx-5">
            <div className="form_history_list">
              <div>
                <button
                  style={{
                    background: "#FF7C33",
                    borderRadius: "20px",
                    position: "relative",
                  }}
                  onClick={() => {
                    router.push("/chat");
                    getListHistory("");

                    if (
                      typeof window !== "undefined" &&
                      window.innerWidth < 768
                    ) {
                      openListHistory();
                    }
                  }}
                >
                  <span style={{ display: "flex", justifyContent: "center" }}>
                    <Icon
                      style={{
                        width: "25px",
                        height: "40px",
                        color: "white",
                      }}
                      as={AiOutlineFileAdd}
                    />
                    <p style={{ color: "white", fontWeight: "bold" }}>
                      Start a new conversation
                    </p>
                  </span>
                </button>
              </div>
              <div
                style={{
                  backgroundColor: "#6C757D",
                  borderStyle: "solid",
                  borderColor: "white",
                  borderWidth: "1px",
                  borderRadius: "20px",
                  textIndent: "10px",
                }}
              >
                <input
                  onChange={handleSearch}
                  className="textSearch"
                  type="text"
                  name="Search Keywords"
                  placeholder="🔍Search keywords"
                />
              </div>
              <div
                className="flex items-center gap-4 justify-start"
                style={{ fontSize: "14px" }}
              >
                <button
                  onClick={openPopup}
                  style={{
                    color: "#FF7C33",
                    border: "1px solid #FF7C33",
                    borderRadius: "20px",
                    width: "80px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "transparent",
                  }}
                >
                  <Icon style={{ color: "#FF7C33" }} as={FaRegTrashAlt} />
                  <span>Delete</span>
                </button>
                <th className=" w-[5%] ">
                  <input
                    type="checkbox"
                    onChange={checkAllHandler}
                    checked={isCheckAll}
                  />
                </th>
              </div>

              <div
                ref={chatContainerRef}
                className="list_chat_container border-2 border-orange-500 rounded-lg bg-gray-950"
              >
                {Object.keys(groupedChats).map((category) => (
                  <div key={category} className="mb-6">
                    <h2 className="text-orange-400 font-bold mb-3 text-sm">
                      {category}
                    </h2>
                    <ul>
                      {groupedChats[category].map((chat: any) => (
                        <li
                          key={chat.chat_id}
                          className="item-list-chat rounded-sm bg-gray-700 p-2 mb-2 flex items-center"
                        >
                          <input
                            type="checkbox"
                            value={chat.chat_id}
                            onChange={checkboxHandler}
                            checked={selectedItems.includes(String(chat.chat_id))}
                            className="mr-2"
                          />
                          <Link
                            href={`/chat/${chat.chat_id}`}
                            className="text-orange-500 font-bold no-underline text-sm"
                            onClick={() => {
                              setOpenList(false);
                            }}
                          >
                            {chat.talk_title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-center items-center mt-2">
                    <ClipLoader color="#f97316" size={40} />
                  </div>
                )}

                {sortedChats.length === 0 && (
                  <p className="text-white text-center">
                    There is no chat history
                  </p>
                )}
              </div>
              {/* popup display message when doesn't choose records */}

              <Modal
                isOpen={isModalMessage}
                onClose={closeModal}
                classNames={{
                  closeButton: "flex justify-end items-center",
                  wrapper: "flex justify-center items-center",
                }}
              >
                <ModalContent>
                  {() => (
                    <>
                      <ModalHeader
                        className="text-black "
                        style={{ marginTop: "25px" }}
                      >
                        Message
                      </ModalHeader>

                      <ModalBody>
                        <p>{E0013}</p>
                      </ModalBody>
                      <ModalFooter>
                        <Button className="btnPopup" onClick={closeModal}>
                          OK
                        </Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </div>
            {/* Popup confirm delete chat */}
            {openModal == true && (
              <Modal
                isOpen={openModal}
                onClose={closeModal}
                classNames={{
                  closeButton: "flex justify-end items-center",
                  wrapper: "flex justify-center items-center",
                }}
              >
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader
                        className="text-black"
                        style={{ marginTop: "25px" }}
                      >
                        Confirm conversation deletion
                      </ModalHeader>
                      <ModalBody>
                        <p>
                          Are you sure you want to delete the selected
                          conversation?
                        </p>
                        {spinner == true && (
                          <CircularProgress className="absolute left-48 bottom-12" />
                        )}
                      </ModalBody>
                      <ModalFooter>
                        <Button className="btnPopup" onClick={handleDeleteChat}>
                          OK
                        </Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
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
                    <ModalHeader
                      className="text-black"
                      style={{ marginTop: "25px" }}
                    >
                      System Error
                    </ModalHeader>
                    <ModalBody>
                      <p>Unable to connect to database</p>
                    </ModalBody>
                    <ModalFooter>
                      <Button className="btnPopup" onClick={closeModal}>
                        OK
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </div>
        </div>
      </div>
    )
  );
};

export default ListHistory;
