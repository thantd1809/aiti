"use client";
import { Icon } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VscFiles } from "react-icons/vsc";
import { FaRegTrashAlt, FaFileUpload, FaShareSquare } from "react-icons/fa";
import {
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
import {
  deleteFile,
  deleteFolder,
  uploadFile,
  getFolderAndFile,
  createFolder,
  getUser,
  getDepartment,
  getSharedFileFolder,
  getAccessControl,
  editAccessControl,
} from "@/src/utils/ApiService";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Page() {
  type FileItem = {
    id: string;
    name: string;
    created_at: string;
  };
  type ListFileType = {
    folders: FileItem[];
    files: FileItem[];
  };
  const [listFile, setListFile] = useState<ListFileType>({
    folders: [],
    files: [],
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useUser();
  const [spinner, setSpinner] = useState(true);
  const [opacity, setOpacity] = useState("0.5");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [spinnerPopup, setSpinnerPopup] = useState(false);
  const [isModalReservation, setIsModalReservation] = useState(false);
  const [isModalDelete, setIsModalDelete] = useState(false);
  const [isModalDeleteMessage, setIsModalDeleteMessage] = useState(false);
  const [errorReservation, setErrorReservation] = useState(true);
  const [listCheckAll, setListCheckAll] = useState([] as any[]);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});
  const [listParent, setListParent] = useState([] as any[]); // List parent folder
  const [folderName, setFolderName] = useState(""); // Name of folder to create
  const [currentFolderId, setCurrentFolderId] = useState(""); // Current folder ID to create file or folder
  const [isOpenCreateFolder, setIsOpenCreateFolder] = useState(false);
  const [isOpenShare, setIsOpenShare] = useState(false);
  const [listUser, setListUser] = useState([] as any[]);
  const [listDepartment, setListDepartment] = useState([] as any[]);
  const [listSelectedUsers, setlistSelectedUsers] = useState([] as any[]);
  const [listSelectedDeparts, setlistSelectedDeparts] = useState([] as any[]);
  const [listAccessUser, setListAccessUser] = useState([] as any[]);
  const [listAccessDepart, setListAccessDepart] = useState([] as any[]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null); // Save file ID when click right mouse on file
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); //  Save folder ID when click right mouse on file
  const [activeTab, setActiveTab] = useState<"my" | "shared" | null>("my"); // To active tab(color) my drive or shared drive when click on it
  const inputRef = useRef<HTMLInputElement>(null); // To show mouse cursor when opening create folder box
  //Handle click right mouse on blank space
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Handle click right mouse on item (file, folder)
  const [itemMenu, setItemMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    item: any | null;
  }>({ x: 0, y: 0, visible: false, item: null });

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const folderIdFromUrl = searchParams.get("folder_id");
      getMyDoc(folderIdFromUrl || "");
      getUserList();
      getDepartmentList();
    }
  }, [user, valueSearch]);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }

      if (itemMenu.visible) {
        setItemMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible || itemMenu.visible) {
      document.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [contextMenu.visible, itemMenu.visible]);

  useEffect(() => {
    if (isOpenShare) {
    }
  }, [isOpenShare]);

  // To focus on input text when open popup create folder
  useEffect(() => {
    if (isOpenCreateFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpenCreateFolder]);

  const closeModal = () => {
    setIsModalReservation(false);
    setIsModalDelete(false);
    setIsModalDeleteMessage(false);
    setErrorReservation(true);
    setIsPopupMessageConnectDB(false);
    setIsOpenCreateFolder(false);
  };

  const getUserList = async () => {
    try {
      if (user) {
        const response = await getUser(1, 100, "");
        if (response.result.status == "OK") {
          setListUser(response.data.users);
        } else {
          setIsPopupMessageConnectDB(true);
        }
      }
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  };

  const getDepartmentList = async () => {
    try {
      if (user) {
        const response = await getDepartment(1, 100, "");
        if (response.result.status == "OK") {
          setListDepartment(response.data.departs);
        } else {
          setIsPopupMessageConnectDB(true);
        }
      }
    } catch (error) {
      console.error("Error fetching department list:", error);
    }
  };

  const getMyDoc = async (folder_id: string) => {
    try {
      if (user) {
        const response = await getFolderAndFile(folder_id || "");
        if (response.status == 200) {
          setSelectedItems([]); // Reset checkbox
          setListParent(response.data.data.parent);
          setListFile(response.data.data.children);
          setCurrentFolderId(folder_id);

          //So that when reloading the page it is still in the old folder
          const url = folder_id
            ? `${pathname}?folder_id=${folder_id}`
            : pathname;
          router.push(url);
        } else {
          setIsPopupMessageConnectDB(true);
        }
        setSpinner(false);
        setOpacity("1");
      }
    } catch (error) {
      alert(error);
    }
  };

  const getSharedDoc = async (folder_id: string) => {
    try {
      if (user) {
        const response = await getSharedFileFolder(folder_id);
        if (response.status == 200) {
          setSelectedItems([]); // Reset checkbox
          setListParent(response.data.data.parent);
          setListFile(response.data.data.children);
          setCurrentFolderId(folder_id);
        } else {
          setIsPopupMessageConnectDB(true);
        }
        setSpinner(false);
        setOpacity("1");
      }
    } catch (error) {
      alert(error);
    }
  };

  const getListAccessControl = async (file_id: string, folder_id: string) => {
    try {
      if (user) {
        const response = await getAccessControl(file_id, folder_id);

        if (response?.status == 200) {
          setListAccessUser(
            response.data.data.users.map((u: any) => u.user_id),
          );
          setListAccessDepart(
            response.data.data.departments.map((d: any) => d.department_id),
          );
        } else {
          setIsPopupMessageConnectDB(true);
        }
      }
    } catch (error) {
      console.error("Error fetching access control:", error);
    }
  };

  const handleEditAccessControl = async (
    file_id: string | null,
    folder_id: string | null,
  ) => {
    try {
      let data = {
        user_ids: listSelectedUsers,
        depart_ids: listSelectedDeparts,
        file_id: file_id,
        folder_id: folder_id,
      };

      const response = await editAccessControl(data);
      if (response?.status == 200) {
        toast.success(response.data.result.msg, {
          className: "custom-toast",
          closeButton: false,
          autoClose: 1000,
        });
      } else {
        toast.error(response?.data.result.msg, {
          className: "custom-toast",
          closeButton: false,
          autoClose: 1000,
        });
      }
    } catch (error) {
      console.error("Failed to update access control:", error);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    // formData.append("folder_id", currentFolderId || null);

    const data = {
      file: file,
      folder_id: currentFolderId === "" ? null : currentFolderId,
    };
    try {
      setSpinner(true);
      const res = await uploadFile(data);
      await getMyDoc(currentFolderId || "");
    } catch (error) {
      console.error(" Upload failed", error);
      setSpinner(false);
    }
    setSpinner(false);
  };

  const handleUpload = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  // delete file upload
  const handleDeleteFile = async () => {
    try {
      if (user) {
        setSpinnerPopup(true);

        const fileIds: string[] = [];
        const folderIds: string[] = [];

        selectedItems.forEach((key) => {
          const dashIndex = key.indexOf("-");
          const type = key.slice(0, dashIndex);
          const id = key.slice(dashIndex + 1);

          if (type === "file") {
            fileIds.push(id);
          } else if (type === "folder") {
            folderIds.push(id);
          }
        });

        if (fileIds.length > 0) {
          const resFile = await deleteFile(fileIds);
          if (resFile?.data?.result?.status !== "OK") {
            throw new Error(
              resFile?.data?.result?.msg || "Failed to delete files",
            );
          }
        }

        if (folderIds.length > 0) {
          const resFolder = await deleteFolder(folderIds);
          if (resFolder?.data?.result?.status !== "OK") {
            throw new Error(
              resFolder?.data?.result?.msg || "Failed to delete folders",
            );
          }
        }

        setSelectedItems([]);
        await getMyDoc(currentFolderId || "");
      }
    } catch (error: any) {
      if (
        error.message &&
        typeof error.message === "string" &&
        error.message.includes(errorConnectDB)
      ) {
        setIsPopupMessageConnectDB(true);
      } else {
        toast.error(error.message || "Delete failed", {
          className: "custom-toast",
          closeButton: false,
          autoClose: 1000,
        });
      }
    } finally {
      setSpinnerPopup(false);
    }
  };

  const handleCreateFolder = () => {
    try {
      if (user) {
        setSpinnerPopup(true);
        let folderId = currentFolderId === "" ? null : currentFolderId;
        const response = createFolder(folderName, folderId);

        response
          .then((res) => {
            if (res.data.result.status == "OK") {
              setSpinnerPopup(false);
              getMyDoc(currentFolderId);
            } else if (res.data.result.status == "NG") {
              if (res.data.result.msg.includes(errorConnectDB)) {
                setIsPopupMessageConnectDB(true);
              } else {
                alert(res.data.result.msg);
              }
            }
          })
          .catch((error) => {
            console.error("Error creating folder:", error);
            setSpinnerPopup(false);
          });
      }
    } catch (error) {
      alert(error);
    }
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

  const allItemKeys = [
    ...listFile.folders.map((f) => `folder-${f.id}`),
    ...listFile.files.map((f) => `file-${f.id}`),
  ];
  const isAllSelected =
    allItemKeys.length > 0 &&
    allItemKeys.every((id) => selectedItems.includes(id));

  return (
    <>
      {user ? (
        <div>
          <div style={{ opacity: opacity, background: "#EFEFEE" }}>
            <div>
              <RightMenu stateChild={getState} />
            </div>
            <div
              className="bg-[#EFEFEE] sm:mx-[150px] mx-1"
              style={{ opacity }}
            >
              <p style={{ fontSize: "20px" }}>File Management</p>

              <div className="table text-center w-full">
                <div className="flex justify-between items-center ml-1">
                  <div className="flex justify-start">
                    {/* Search  */}
                    <div className="sm:w-[500px] w-[250px] h-9 mt-[2px]">
                      <input
                        disabled={spinner}
                        onChange={handleFilter}
                        className="w-[99%] h-full border border-white rounded-[10px] indent-[10px] text-[14px]"
                        type="text"
                        name="Search Keywords"
                        placeholder="🔍 Search Keywords"
                      />
                    </div>
                    {/* Button Create Folder */}
                    <div className="block ml-[10px] sm:w-32 w-10">
                      <button
                        disabled={spinner}
                        className="bg-white border border-[#FF7C33] rounded-[5px] justify-items-center"
                        onClick={() => setIsOpenCreateFolder(true)}
                      >
                        <span className="flex justify-center items-center text-[#FF7C33] w-[160px]">
                          <Icon
                            className="text-black color-orange flex justify-center top-3 ml-1 mr-1"
                            as={VscFiles}
                          />
                          <p className="text-[#FF7C33] text-sm sm:block hidden">
                            Create Folder
                          </p>
                        </span>
                      </button>
                    </div>
                    {/* Button upload file */}
                    <div className="block ml-[10px] sm:w-28 w-10">
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleUploadFile}
                        accept=".xls,.xlsx,.pdf,.docx,.txt"
                      />
                      <button
                        disabled={spinner}
                        onClick={handleUpload}
                        className="bg-white border border-[#FF7C33] rounded-[5px] justify-items-center"
                      >
                        <span className="flex w-40 text-[#FF7C33] justify-center items-center">
                          <Icon
                            className="text-black color-orange flex justify-center top-3 ml-1 mr-1"
                            as={FaFileUpload}
                          />
                          <p className="text-[#FF7C33] text-sm sm:block hidden">
                            Upload File
                          </p>
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* Button delete file */}
                  <div className="block ml-[10px] sm:w-28 w-10">
                    <button
                      disabled={spinner}
                      onClick={displayModalDelete}
                      className="bg-white border border-[#FF7C33] rounded-[5px] justify-items-center"
                    >
                      <span className="flex w-40 text-[#FF7C33] justify-center items-center">
                        <Icon
                          className="text-black color-orange flex justify-center top-3 ml-1 mr-1"
                          as={FaRegTrashAlt}
                        />
                        <p className="text-[#FF7C33] text-sm sm:block hidden">
                          Delete
                        </p>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex border-2 border-solid border-gray-500 rounded-lg overflow-hidden h-[600px] mt-4">
                  {/*folder tree */}
                  <div className="w-1/3 bg-white p-2 overflow-y-auto text-black">
                    <h2 className="text-lg font-bold mb-2">Documents</h2>
                    <div className="flex flex-col gap-2 text-sm">
                      <p
                        className={`cursor-pointer py-1 rounded-md transition-colors duration-300 ${
                          activeTab === "my"
                            ? "bg-slate-400 text-white"
                            : "hover:bg-slate-200"
                        }`}
                        onClick={() => {
                          setActiveTab("my");
                          getMyDoc("");
                        }}
                      >
                        My Documents
                      </p>

                      <p
                        className={`cursor-pointer py-1 rounded-md transition-colors duration-300 ${
                          activeTab === "shared"
                            ? "bg-slate-400 text-white"
                            : "hover:bg-slate-200"
                        }`}
                        onClick={() => {
                          setActiveTab("shared");
                          getSharedDoc("");
                        }}
                      >
                        Shared Documents
                      </p>
                    </div>
                  </div>
                  <div className="w-2/3 flex flex-col text-black">
                    {/* path */}
                    <div className="bg-gray-500 text-white h-12 px-4 flex items-center text-sm">
                      <div className="flex gap-1 text-blue-200">
                        <span
                          key="root"
                          className="hover:underline cursor-pointer"
                          onClick={() => {
                            activeTab === "my"
                              ? getMyDoc("")
                              : getSharedDoc("");
                          }}
                        >
                          {activeTab === "my"
                            ? "My Documents"
                            : "Shared Documents"}
                          {listParent.length > 0 && <span> &gt; </span>}
                        </span>

                        {listParent.map((item, index) => {
                          return (
                            <span
                              key={item.id}
                              onClick={() => {
                                activeTab === "my"
                                  ? getMyDoc(item.id)
                                  : getSharedDoc(item.id);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              {item.name}
                              {index < listParent.length - 1 && (
                                <span> &gt; </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* context menu */}
                    <div
                      className="flex-1 overflow-y-auto px-2"
                      onContextMenu={(e) => {
                        handleContextMenu(e);
                        setItemMenu((prev) => ({
                          ...prev,
                          visible: false,
                        }));
                      }}
                    >
                      {contextMenu.visible && (
                        <ul
                          className="absolute bg-white border border-gray-300 shadow-md z-50 rounded-md text-sm min-w-[160px] py-1"
                          style={{
                            top: contextMenu.y,
                            left: contextMenu.x,
                          }}
                        >
                          <li
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
                            onClick={() => setIsOpenCreateFolder(true)}
                          >
                            <Icon className="text-gray-700" as={VscFiles} />
                            Create Folder
                          </li>
                          <li
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
                            onClick={handleUpload}
                          >
                            <Icon className="text-gray-700" as={FaFileUpload} />
                            Upload File
                          </li>
                        </ul>
                      )}

                      <table className="w-full text-sm">
                        <thead className="bg-gray-300 text-gray-700 sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-2 py-2">
                              {activeTab === "my" && (
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  checked={isAllSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const allItems = [
                                        ...listFile.folders.map(
                                          (f) => `folder-${f.id}`,
                                        ),
                                        ...listFile.files.map(
                                          (f) => `file-${f.id}`,
                                        ),
                                      ];
                                      setSelectedItems(allItems);
                                    } else {
                                      setSelectedItems([]);
                                    }
                                  }}
                                />
                              )}
                              Name
                            </th>
                            <th className="text-left px-2 py-2 flex justify-center">
                              Created at
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {listFile.folders.length === 0 &&
                          listFile.files.length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="text-center text-gray-500 py-4"
                              >
                                This folder is empty
                              </td>
                            </tr>
                          ) : (
                            [
                              ...listFile.folders.map((folder) => ({
                                ...folder,
                                type: "folder",
                              })),
                              ...listFile.files.map((file) => ({
                                ...file,
                                type: "file",
                              })),
                            ]
                              .sort((a, b) => (a.type === "folder" ? -1 : 1))
                              .map((item: any) => (
                                <tr
                                  key={`${item.type}-${item.id}`} //This is to avoid duplicate folder errors because the folder id can be the same as the file.
                                  className="hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    if (item.type === "folder") {
                                      if (activeTab === "my") {
                                        getMyDoc(item.id.toString());
                                      } else {
                                        getSharedDoc(item.id.toString());
                                      }
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedFolderId(
                                      item.type === "folder" ? item.id : null,
                                    );
                                    setSelectedFileId(
                                      item.type === "file" ? item.id : null,
                                    );

                                    if (item.type === "folder") {
                                      getListAccessControl(
                                        "",
                                        item.id.toString(),
                                      );
                                    } else {
                                      getListAccessControl(
                                        item.id.toString(),
                                        "",
                                      );
                                    }

                                    setContextMenu((prev) => ({
                                      ...prev,
                                      visible: false,
                                    }));
                                    setItemMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      visible: true,
                                      item,
                                    });
                                  }}
                                >
                                  <td className="px-2 py-2 flex items-center">
                                    {activeTab === "my" && (
                                      <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={selectedItems.includes(
                                          `${item.type}-${item.id}`,
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const itemKey = `${item.type}-${item.id}`;
                                          if (e.target.checked) {
                                            setSelectedItems((prev) => [
                                              ...prev,
                                              itemKey,
                                            ]);
                                          } else {
                                            setSelectedItems((prev) =>
                                              prev.filter(
                                                (id) => id !== itemKey,
                                              ),
                                            );
                                          }
                                        }}
                                      />
                                    )}
                                    <img
                                      src={
                                        item.type === "folder"
                                          ? "/images/folder.256x204.png"
                                          : item.name.endsWith(".xlsx")
                                          ? "/images/xlsx.png"
                                          : item.name.endsWith(".pdf")
                                          ? "/images/pdf.png"
                                          : item.name.endsWith(".txt")
                                          ? "/images/docx.png"
                                          : item.name.endsWith(".pptx")
                                          ? "/images/pptx.png"
                                          : item.name.endsWith(".sql")
                                          ? "/images/sql.png"
                                          : item.name.endsWith(".csv")
                                          ? "/images/csv.png"
                                          : item.name.endsWith(".docx") ||
                                            item.name.endsWith(".doc")
                                          ? "/images/docx.png"
                                          : "/images/file_89266.png"
                                      }
                                      alt="icon"
                                      className={`inline-block mr-2 ${
                                        item.type === "folder"
                                          ? "w-4 h-3"
                                          : "w-4 h-4"
                                      }`}
                                    />
                                    {item.name}
                                  </td>

                                  <td className="px-2 py-2">
                                    {(() => {
                                      const d = new Date(item.created_at);
                                      const pad = (n: any) =>
                                        n.toString().padStart(2, "0");
                                      return `${pad(d.getDate())}/${pad(
                                        d.getMonth() + 1,
                                      )}/${d.getFullYear()} ${pad(
                                        d.getHours(),
                                      )}:${pad(d.getMinutes())}`;
                                    })()}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Context menu for file and folder */}
                {itemMenu.visible && (
                  <ul
                    className="absolute bg-white border border-gray-300 shadow-lg z-50 rounded-md text-sm min-w-[140px] py-1"
                    style={{ top: itemMenu.y, left: itemMenu.x }}
                    onClick={() => setItemMenu({ ...itemMenu, visible: false })}
                  >
                    <li
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemMenu({ ...itemMenu, visible: false });
                        setIsOpenShare(true);
                        setlistSelectedUsers([...listAccessUser]);
                        setlistSelectedDeparts([...listAccessDepart]);
                      }}
                    >
                      <Icon className="text-gray-700" as={FaShareSquare} />
                      Share
                    </li>
                  </ul>
                )}
                {/* Create Folder */}
                {isOpenCreateFolder == true && (
                  <Modal
                    isOpen={isOpenCreateFolder}
                    onClose={closeModal}
                    classNames={{
                      closeButton: "flex justify-end items-center",
                      wrapper: "flex justify-center items-center",
                    }}
                  >
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="text-black mt-6">
                            New Folder
                          </ModalHeader>

                          <ModalBody>
                            <input
                              ref={inputRef}
                              className="border border-gray-500 rounded-lg text-black p-2"
                              onChange={(e) => {
                                setFolderName(e.target.value);
                              }}
                              type="text"
                              placeholder="Please input folder name"
                            />

                            {spinnerPopup == true && (
                              <CircularProgress className="absolute left-48 bottom-12" />
                            )}
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              className="btnPopup"
                              onClick={() => {
                                handleCreateFolder();
                                onClose();
                              }}
                              disabled={folderName.trim().length === 0}
                            >
                              OK
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                )}
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
                          <ModalHeader className="text-black mt-6">
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
                {/*popup shared file or folder*/}
                {isOpenShare && (
                  <Modal
                    isOpen={isOpenShare}
                    onClose={() => {
                      setIsOpenShare(false);
                      setlistSelectedUsers([]);
                      setlistSelectedDeparts([]);
                    }}
                    classNames={{
                      closeButton: "flex justify-end items-center h-2",
                      wrapper: "flex justify-center items-center",
                    }}
                  >
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="text-black mt-1 justify-center">
                            Share File / Folder
                          </ModalHeader>

                          <ModalBody>
                            <div className="flex gap-4">
                              {/* User Section */}
                              <div className="w-1/2 border rounded-lg p-1">
                                <h3 className="text-center font-medium text-base mb-1 text-black">
                                  User
                                </h3>
                                <div className="h-40 overflow-y-auto text-black px-4">
                                  {listUser.length > 0 ? (
                                    listUser.map((user, index) => (
                                      <label
                                        key={index}
                                        className="flex items-center gap-2 py-1 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={listSelectedUsers.includes(
                                            user.id,
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setlistSelectedUsers((prev) => [
                                                ...prev,
                                                user.id,
                                              ]);
                                            } else {
                                              setlistSelectedUsers((prev) =>
                                                prev.filter(
                                                  (id) => id !== user.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />

                                        <span className="text-sm">
                                          {user.name}
                                        </span>
                                      </label>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 text-center">
                                      No users available
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Department Section */}
                              <div className="w-1/2 border rounded-lg p-1">
                                <h3 className="text-center font-medium text-base mb-1 text-black">
                                  Department
                                </h3>
                                <div className="h-40 overflow-y-auto text-black px-4">
                                  {listDepartment.length > 0 ? (
                                    listDepartment.map((dept, index) => (
                                      <label
                                        key={index}
                                        className="flex items-center gap-2 py-1 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={listSelectedDeparts.includes(
                                            dept.id,
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setlistSelectedDeparts((prev) => [
                                                ...prev,
                                                dept.id,
                                              ]);
                                            } else {
                                              setlistSelectedDeparts((prev) =>
                                                prev.filter(
                                                  (id) => id !== dept.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                        <span className="text-sm">
                                          {dept.name}
                                        </span>
                                      </label>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 text-center">
                                      No departments available
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </ModalBody>

                          <ModalFooter>
                            <Button
                              className="btnPopup"
                              onClick={() => {
                                // handleShareFileFolder();
                                handleEditAccessControl(
                                  selectedFileId,
                                  selectedFolderId,
                                );
                                onClose();
                                setlistSelectedDeparts([]);
                                setlistSelectedUsers([]);
                              }}
                            >
                              Share
                            </Button>
                            <Button className="btnPopup" onClick={onClose}>
                              Cancel
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                )}

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
                          <ModalHeader className="text-black mt-6">
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
                          <ModalHeader className="text-black mt-6">
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
                  <ModalHeader className="text-black mt-6">
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
