"use client";
import { Icon } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
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
import RightMenu from "@/src/components/RightMenu";
import { BsPersonAdd } from "react-icons/bs";
import { useForm } from "react-hook-form";
import PopupUpdateUser from "@/src/components/PopupUpdateUser";
import PopupCreateUser from "@/src/components/PopupCreateUser";
import Footer from "@/src/components/Footer";
import { E0013, I0003 } from "@/src/utils/message";
import { useUser } from "@/src/utils/UserContext";
import { getUser, deleteUser } from "@/src/utils/ApiService";
import { useRouter } from "next/navigation";

type Inputs = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

export default function Page() {
  const { user } = useUser();
  const [listUserFilter, setListUserFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);

  const [spinner, setSpinner] = useState(true);
  const [spinnerPopup, setSpinnerPopup] = useState(false);
  const [opacity, setOpacity] = useState("0.5");

  const [paginationNumbers, setPaginationNumber] = useState(1);
  const [listCheckAll, setListCheckAll] = useState([] as any[]);

  const [isModalDelete, setIsModalDelete] = useState(false);
  const [isModalAddUser, setIsModalAddUser] = useState(false);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [blur, setBlur] = useState("none");
  const [userId, setUserId] = useState("");
  const [isOpenUpdateUser, setIsOpenUpdateUser] = useState(false);
  const [isModalDeleteUserSuccess, setIsModalDeleteuserSuccess] =
    useState(false);
  const [valueSearch, setValueSearch] = useState<Record<string, string>>({});
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [selectedItems, setSelectedItems] = useState([] as any[]);
  const [totalItem, setTotalItem] = useState(Number);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user]);

  // To search
  useEffect(() => {
    if (user && user.role == 1) {
      loadListUser(valueSearch.searchQuery || "");
    }
  }, [valueSearch, user, paginationNumbers, currentPage]);

  // Load list user
  const loadListUser = async (search: string) => {
    try {
      if (user) {
        const response = await getUser(currentPage, postsPerPage, search);

        if (response.result.status == "OK") {
          response?.data?.users.sort((a: any, b: any) => a.id - b.id);
          let listResponse = response?.data?.users;
          setTotalItem(response?.total);
          setListUserFilter(listResponse);
          setPaginationNumber(Math.ceil(response?.total / postsPerPage));
          if (listResponse.length == 0) {
            setPaginationNumber(1);
          }
        } else if (response?.result?.status == "NG") {
          if ((response?.result.msg).includes(errorConnectDB)) {
            console.log("load list user");
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

  // Close all Modal
  const closeModal = () => {
    setIsOpenUpdateUser(false);
    setIsModalDelete(false);
    setIsModalAddUser(false);
    setIsPopupMessageConnectDB(false);
  };

  const {
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const openUpdateUserPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
    let valueId = e.currentTarget.value;
    setUserId(valueId);
    setIsOpenUpdateUser(true);
  };

  const getState = (childData: boolean) => {
    setOpacity("0.5");
    setSpinner(childData);
  };

  const getStatePopup = (childData: boolean) => {
    setIsOpenUpdateUser(childData);
    setIsModalAddUser(childData);
  };

  const handleDeleteUser = async () => {
    try {
      setSpinnerPopup(true);
      setBlur("1px");
      if (user) {
        const response = await deleteUser(selectedItems);
        if (response?.data?.result?.status == "OK") {
          setSpinnerPopup(false);
          setBlur("0px");
          setIsModalDelete(false);
          setIsModalDeleteuserSuccess(true);
        } else if (response?.data?.result?.status == "NG") {
          if ((response?.data?.result.msg).includes(errorConnectDB)) {
            console.log("delete user");
            setIsPopupMessageConnectDB(true);
          } else {
            alert(response?.data?.result.msg);
          }
        }
      }
    } catch (error) {
      alert(error);
    }
  };

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

  const checkAllHandler = () => {
    setIsCheckAll(!isCheckAll);
    if (isCheckAll) {
      setSelectedItems([]);
    } else {
      const postIds = listUserFilter.map((item: any) => {
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

  const getValueNumberItemPage = (e: any) => {
    let value = e.target.value;
    let numberItem = 10;
    if (value == 10) {
      setPostsPerPage(10);
      numberItem = 10;
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
    setPaginationNumber(Math.ceil(listUserFilter.length / numberItem));
    setCurrentPage(1);
  };

  return (
    <>
      {user ? (
        user.role == 1 ? (
          <div>
            <div style={{ opacity: opacity, background: "#EFEFEE" }}>
              <div>{<RightMenu stateChild={getState} />}</div>

              <div className={`bg-[#EFEFEE] sm:mx-36 mx-3 opacity-${opacity}`}>
                <div className="flex flex-col w-full justify-center">
                  <p className="sm:text-3xl text-xl sm:mb-7 mb-2">
                    User Management
                  </p>

                  <div className="w-full text-center">
                    <div className="mb-2.5 flex w-full justify-between">
                      <div className="sm:w-[35%] w-[50%] h-[35px]">
                        <input
                          disabled={spinner}
                          onChange={handleFilter}
                          className="w-full h-full border-white border-1 rounded-[10px] "
                          style={{ textIndent: "10px" }}
                          type="text"
                          name="Search Keywords"
                          placeholder="🔍 Search Keywords"
                        />
                      </div>
                      <div>
                        <button
                          className="bg-[#FF7C33] rounded-[10px] sm:w-[200px] w-[150px]"
                          onClick={() => setIsModalAddUser(true)}
                          disabled={spinner}
                        >
                          <span className="flex justify-center items-center">
                            <Icon
                              className="w-[25px] h-[40px] text-white mr-2"
                              as={BsPersonAdd}
                            />
                            <p className="text-white text-[14px] sm:text-[16px]">
                              Registering Users
                            </p>
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex ml-1 mb-5">
                      <button
                        onClick={() => {
                          setIsModalDelete(true);
                        }}
                        className="border-solid border-[#FF7C33] rounded-md w-[100px] border-1"
                      >
                        <span
                          className="flex ml-3 items-center"
                          style={{ color: "#FF7C33" }}
                        >
                          <Icon className="top-3 mx-[5px]" as={FaRegTrashAlt} />
                          <p className="text-[#FD6A11] sm:text-base text-sm">
                            Delete
                          </p>
                        </span>
                      </button>
                    </div>
                    <div className="border-2 border-solid border-gray-300 rounded-lg sm:overflow-x-hidden overflow-x-auto overflow-y-auto scroll-container">
                      <div className="max-h-[500px] ">
                        <table className="table-list-files sm:w[100px] w-[150px]">
                          <thead>
                            <tr className="sm:text-[17px] text-[13px]">
                              <th className="w-[3%]">
                                <input
                                  type="checkbox"
                                  onChange={checkAllHandler}
                                  checked={isCheckAll}
                                />
                              </th>
                              <th className="w-[5%] sm:block hidden">
                                <p>Department</p>
                              </th>
                              <th className="w-[100px]">
                                <p>Email address</p>
                              </th>
                              <th className="w-[30%]">
                                <p>Full name</p>
                              </th>
                              <th className="w-[20%] whitespace-nowrap ">
                                <p>Authority</p>
                              </th>
                              <th className="w-[10%] ">
                                <p></p>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {listUserFilter.map((user) => (
                              <tr
                                key={user["id"]}
                                className="item-table sm:text-[17px] text-[13px]"
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    value={user["id"]}
                                    onChange={checkboxHandler}
                                    checked={selectedItems.includes(user["id"])}
                                  />
                                </td>
                                <td className="sm:block hidden">
                                  <p>{user["department"]}</p>
                                </td>
                                <td>
                                  <p className="sm:w-[250px] w-[170px]">
                                    {user["email"]}
                                  </p>
                                </td>
                                <td>
                                  <p>{user["name"]}</p>
                                </td>
                                <td>
                                  {user["role"] == 1 && <p>Administrator</p>}
                                  {user["role"] == 2 && <p>User</p>}
                                </td>
                                <td className="text-right px-[10px] ">
                                  <button
                                    value={user["id"]}
                                    className="border-solid rounded-lg border-1 border-[#fd6a11] my-1 sm:w-[100px] w-[50px]"
                                    onClick={openUpdateUserPopup}
                                    disabled={spinner}
                                  >
                                    <p
                                      className="text-[#FF7C33] sm:text-base text-xs"
                                      style={{
                                        textAlign: "center",
                                      }}
                                    >
                                      Change
                                    </p>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* popup delete user */}
                    <Modal
                      isOpen={isModalDelete}
                      onClose={closeModal}
                      classNames={{
                        closeButton: "flex justify-end items-center",
                        wrapper: "flex justify-center items-center",
                      }}
                    >
                      <ModalContent style={{ filter: `blur(${blur})` }}>
                        {() => (
                          <>
                            <ModalHeader
                              className="text-black "
                              style={{ marginTop: "25px" }}
                            >
                              User deletion confirmation
                            </ModalHeader>

                            <ModalBody>
                              <p>
                                Are you sure you want to delete the selected
                                users?
                              </p>
                              {spinnerPopup == true && (
                                <CircularProgress className="absolute left-48 bottom-12" />
                              )}
                            </ModalBody>
                            <ModalFooter>
                              <Button
                                className="btnPopup"
                                onClick={handleDeleteUser}
                              >
                                OK
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    {/* Popup message error doesn't select items for delete */}
                    {selectedItems.length == 0 && (
                      <Modal
                        isOpen={isModalDelete}
                        onClose={closeModal}
                        classNames={{
                          closeButton: "flex justify-end items-center",
                          wrapper: "flex justify-center items-center",
                        }}
                      >
                        <ModalContent style={{ filter: `blur(${blur})` }}>
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
                                <Button
                                  className="btnPopup"
                                  onClick={closeModal}
                                >
                                  OK
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                    )}

                    {/* popup create new user */}
                    {isModalAddUser == true && (
                      <PopupCreateUser statePopup={getStatePopup} />
                    )}
                    {/* popup update user */}
                    {isOpenUpdateUser == true && (
                      <PopupUpdateUser
                        user_id={userId}
                        statePopup={getStatePopup}
                      />
                    )}
                    {/* Popup delete user success */}
                    <Modal
                      isOpen={isModalDeleteUserSuccess}
                      onClose={closeModal}
                      classNames={{
                        closeButton: "flex justify-end items-center",
                        wrapper: "flex justify-center items-center",
                      }}
                    >
                      <ModalContent style={{ filter: `blur(${blur})` }}>
                        {() => (
                          <>
                            <ModalHeader
                              className="text-black "
                              style={{ marginTop: "25px" }}
                            >
                              Deletion completed
                            </ModalHeader>

                            <ModalBody>
                              <p>{I0003}</p>
                            </ModalBody>
                            <ModalFooter>
                              <Button
                                className="btnPopup"
                                onClick={() => {
                                  window.location.reload();
                                  setSelectedItems([]);
                                }}
                              >
                                OK
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    <div
                      style={{
                        width: "100%",
                        height: "5%",
                        marginTop: "5px",
                        justifyContent: "space-between",
                      }}
                      className="inline-flex"
                    >
                      <p className="text-black">Total {totalItem} items</p>
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
                          10/page
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
                <div>
                  <Spinner size="lg" />
                </div>
              )}
            </div>
            {/* Popup message connect DB error */}
            {isPopupMessageConnectDB == true && (
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
            )}
          </div>
        ) : (
          <p className="flex items-center justify-center font-bold text-3xl">
            {"You don't have permission to access this page"}
          </p>
        )
      ) : null}
    </>
  );
}
