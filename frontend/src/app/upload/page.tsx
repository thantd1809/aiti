"use client";
import { Icon } from "@chakra-ui/react";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { VscDiffAdded } from "react-icons/vsc";
import { FaRegTrashAlt } from "react-icons/fa";
import {
  Pagination,
  Button,
  CircularProgress,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import Footer from "@/src/components/Footer";

import { E0013 } from "../../utils/message";
import RightMenu from "@/src/components/RightMenu";
import { useUser } from "@/src/utils/UserContext";
import { deleteFile, getFile, uploadFile } from "@/src/utils/ApiService";
import { useRouter } from "next/navigation";

export default function Page() {
  const { user } = useUser();
  const [listFile, setListFile] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [spinner, setSpinner] = useState(true);
  const [opacity, setOpacity] = useState("0.5");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [spinnerPopup, setSpinnerPopup] = useState(false);
  const [paginationNumbers, setPaginationNumber] = useState(1);
  const [isModalReservation, setIsModalReservation] = useState(false);
  const [isModalDelete, setIsModalDelete] = useState(false);
  const [isModalDeleteMessage, setIsModalDeleteMessage] = useState(false);
  const [errorReservation, setErrorReservation] = useState(true);
  const [listCheckAll, setListCheckAll] = useState([] as any[]);
  useState(false); // popup book for embeding success
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});
  const [totalItem, setTotalItem] = useState(Number);
  const router = useRouter();

  const closeModal = () => {
    setIsModalReservation(false);
    setIsModalDelete(false);
    setIsModalDeleteMessage(false);
    setErrorReservation(true);
    setIsPopupMessageConnectDB(false);
  };

  const handlePagination = (pageNumber: any) => {
    setCurrentPage(pageNumber);
    const updatedValue = [...listCheckAll];
    const result = updatedValue.findIndex((a) => a.pageTest === pageNumber);
    if (result >= 0) {
      let filtered = [];
      filtered = listCheckAll.filter((list: any) =>
        list["pageTest"].toString().includes(pageNumber),
      );
      setIsCheckAll(filtered[0]["check"]);
    } else {
      setIsCheckAll(false);
    }
  };

  const loadFileData = async (search: string) => {
    try {
      if (user) {
        const response = await getFile(currentPage, postsPerPage, search);
        if (response.status == 200) {
          // Show pop up
          let listResponse = response?.data?.data;
          setTotalItem(response.data.total);
          setListFile(listResponse);
          setPaginationNumber(Math.ceil(response.data.total / postsPerPage));
          if (listResponse.length == 0) {
            setPaginationNumber(1);
          }
        } else if (response?.data?.result?.status == "NG") {
          if ((response?.data?.result.msg).includes(errorConnectDB)) {
            console.log("load file data");
            setIsPopupMessageConnectDB(true);
          } else {
            alert(response?.data?.result.msg);
          }
        }
        setSpinner(false);
        setOpacity("1");
      }
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFileData(valueSearch.searchQuery || "");
    }
  }, [user, paginationNumbers, currentPage, valueSearch]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      setSpinner(true);
      const res = await uploadFile(formData);
      console.log("Upload success", res.data);
      await loadFileData("");
    } catch (error) {
      console.error(" Upload failed", error);
      setSpinner(false);
    }
    setSpinner(false);
  };

  const handleUpload: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  // delete file upload
  const handleDeleteFile = async () => {
    try {
      if (user) {
        setSpinnerPopup(true);
        const response = await deleteFile(selectedItems);
        if (response?.data?.result?.status == "OK") {
          loadFileData("");
        } else if (response?.data?.result?.status == "NG") {
          if ((response?.data?.result.msg).includes(errorConnectDB)) {
            console.log("delete file");
            setIsPopupMessageConnectDB(true);
          } else {
            alert(response?.data?.result.msg);
          }
        }
        setSpinnerPopup(false);
      }
    } catch (error) {
      alert(error);
    }
  };

  //handle checked in list
  const checkboxHandler = (e: any) => {
    let isSelected = e.target.checked;

    let value = parseInt(e.target.value);

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
  // Select all files on the current page by clicking the selectAll checkbox
  const checkAllHandler = () => {
    setIsCheckAll(!isCheckAll);
    if (isCheckAll) {
      setSelectedItems([]);
    } else {
      const postIds = listFile.map((item: any) => {
        return item["id"];
      });

      setSelectedItems(postIds);
    }
    const updatedValue = [...listCheckAll];
    if (listCheckAll.length <= 0) {
      setListCheckAll([
        ...listCheckAll,
        { pageTest: currentPage, check: !isCheckAll },
      ]);
    } else {
      const result = updatedValue.findIndex((a) => a.pageTest === currentPage);
      if (result >= 0) {
        const nextList = [...listCheckAll];
        nextList[result].check = !isCheckAll;
      } else {
        setListCheckAll([
          ...listCheckAll,
          { pageTest: currentPage, check: !isCheckAll },
        ]);
      }
    }
  };

  // Display the number of records per page by selecting the value in the number of records check box
  const getValueNumberItemPage = (e: any) => {
    let value = e.target.value;
    let numberItem = 10;
    if (value == 10) {
      setPostsPerPage(10);
    } else if (value == 20) {
      setPostsPerPage(20);
      numberItem = 20;
    } else if (value == 30) {
      setPostsPerPage(30);
      numberItem = 30;
    } else if (value == 40) {
      setPostsPerPage(40);
      numberItem = 40;
    }
    setCurrentPage(1);
    setPaginationNumber(Math.ceil(listFile.length / numberItem));
  };
  const displayModalDelete = () => {
    if (selectedItems.length > 0) {
      setIsModalDelete(true);
    } else {
      setIsModalDeleteMessage(true);
    }
  };

  const getState = (childData: boolean) => {
    setOpacity("0.5");
    setSpinner(childData);
  };

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

  const handleFilter = (e: any) => {
    let value = e.target.value;
    debouncedInput("searchQuery", value);
  };

  return (
    <>
      {user ? (
        <div>
          <div style={{ opacity: opacity, background: "#EFEFEE" }}>
            <div>
              <RightMenu stateChild={getState} />
            </div>

            <div
              className="listFileManager"
              style={{
                background: "#EFEFEE",
                marginLeft: "150px",
                marginRight: "150px",
                opacity: opacity,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <p style={{ fontSize: "20px" }}>File Management</p>

                <div
                  style={{
                    display: "table",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  <div>
                    <div className="upload-button">
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        accept=".xls,.xlsx,.pdf,.docx,.txt"
                      />
                      <button
                        disabled={spinner}
                        onClick={handleUpload}
                        style={{
                          background: "white",
                          border: "solid",
                          borderColor: "#FF7C33",
                          borderWidth: "1px",
                          borderRadius: "5px",
                          justifyItems: "center",
                        }}
                      >
                        <span
                          className="flex justify-center items-center"
                          style={{
                            display: "flex",
                            color: "#FF7C33",
                            width: "160px",
                          }}
                        >
                          <Icon
                            style={{
                              justifyItems: "center",
                              top: "12px",
                              marginLeft: "5px",
                              marginRight: "5px",
                            }}
                            className="text-black color-orange"
                            as={VscDiffAdded}
                          />
                          <p style={{ color: "#FF7C33" }}>Upload File</p>
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div
                      className="flex justify-between items-center"
                      style={{ display: "flex", marginLeft: "5px" }}
                    >
                      <div style={{ width: "35%", height: "35px" }}>
                        <input
                          disabled={spinner}
                          onChange={handleFilter}
                          style={{
                            width: "99%",
                            height: "100%",
                            borderColor: "white",
                            borderWidth: "1px",
                            borderRadius: "10px",
                            textIndent: "10px",
                          }}
                          type="text"
                          name="Search Keywords"
                          placeholder="🔍 Search Keywords"
                        />
                      </div>

                      <button
                        onClick={displayModalDelete}
                        style={{
                          border: "solid",
                          borderColor: "#FF7C33",
                          borderWidth: "1px",
                          borderRadius: "5px",
                          width: "100px",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            color: "#FF7C33",
                            marginLeft: "12px",
                          }}
                        >
                          <Icon
                            style={{
                              position: "relative",
                              top: "12px",
                              marginLeft: "5px",
                              marginRight: "5px",
                            }}
                            as={FaRegTrashAlt}
                          />
                          <p style={{ color: "#FD6A11" }}>Delete</p>
                        </span>
                      </button>
                    </div>
                    <div className="border-2 border-solid border-gray-300 rounded-lg overflow-x-hidden overflow-y-auto scroll-container">
                      <div className="max-h-[500px] ">
                        <table className="table-list-files">
                          <thead>
                            <tr className="title" style={{ fontSize: "16px" }}>
                              <th>
                                <input
                                  type="checkbox"
                                  onChange={checkAllHandler}
                                  checked={isCheckAll}
                                />
                              </th>
                              <th className="w-1/2 ml-10 ">
                                <p>Uploaded File</p>
                              </th>
                              <th className="whitespace-nowrap">
                                <p>Status</p>
                              </th>
                            </tr>
                          </thead>

                          <tbody id="list-files">
                            {listFile.map((file: any) => (
                              <tr
                                key={file["id"]}
                                className="item-table"
                                style={{ fontSize: "14px" }}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    value={file["id"]}
                                    onChange={checkboxHandler}
                                    checked={selectedItems.includes(file["id"])}
                                  />
                                </td>
                                <td>
                                  <p>{file["objects_name"]}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  {errorReservation == true && (
                    <Modal
                      isOpen={isModalReservation}
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
                              File deletion confirmation
                            </ModalHeader>

                            <>
                              <ModalFooter>
                                <Button className="btnPopup" onClick={onClose}>
                                  OK
                                </Button>
                              </ModalFooter>
                            </>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                  )}
                  {/* popup confirm book */}

                  {/* popup confirm deletion file */}
                  {selectedItems.length > 0 && (
                    <Modal
                      isOpen={isModalDelete}
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
                              File deletion confirmation
                            </ModalHeader>

                            <ModalBody>
                              <p>
                                Are you sure you want to delete the selected
                                files?
                              </p>
                              {spinnerPopup == true && (
                                <CircularProgress className="absolute left-48 bottom-12" />
                              )}
                            </ModalBody>
                            <ModalFooter>
                              <Button
                                className="btnPopup"
                                onClick={() => {
                                  handleDeleteFile(), onClose();
                                }}
                              >
                                OK
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                  )}

                  {/* popup display message when doesn't choose file and click 'delete' button */}
                  {selectedItems.length == 0 && (
                    <Modal
                      isOpen={isModalDeleteMessage}
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
                  )}
                  {/* popup display message when doesn't choose file and click 'upload file'  button*/}
                  <div
                    style={{
                      width: "100%",
                      height: "5%",
                      marginTop: "5px",
                      justifyContent: "space-between",
                    }}
                    className="inline-flex"
                  >
                    <p className="text-black">Total {totalItem} item</p>

                    {user && (
                      <Pagination
                        showControls
                        total={paginationNumbers}
                        onChange={handlePagination}
                        page={currentPage}
                        size="md"
                        color="warning"
                        className="w-[400px] flex justify-center"
                      />
                    )}
                    {!user && (
                      <Pagination
                        showControls
                        total={0}
                        size="md"
                        color="warning"
                        className="w-[400px] flex justify-center"
                      />
                    )}

                    <select
                      style={{
                        border: "solid 1px",
                        borderRadius: "10px",
                        textIndent: "10px",
                        height: "36px",
                        width: "100px",
                        color: "black",
                        justifyItems: "start",
                      }}
                      onChange={getValueNumberItemPage}
                    >
                      <option value="10" selected>
                        10 / page
                      </option>
                      <option value="20">20/page</option>
                      <option value="30">30/page</option>
                      <option value="40">40/page</option>
                    </select>
                  </div>
                </div>
              </div>
              <Footer></Footer>
            </div>
          </div>
          <div className="spinner">
            {spinner == true && (
              <div className="overlay">
                <Spinner size="lg" />
              </div>
            )}
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
      ) : null}
    </>
  );
}
