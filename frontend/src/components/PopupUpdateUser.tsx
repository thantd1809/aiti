import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { E0003, E0005, I0002, NAME_LABEL } from "../utils/message";
import { useEffect, useState } from "react";
import { getMessageByCode } from "../utils/getMessageByCode";
import { useUser } from "../utils/UserContext";
import { updateUser, getUserId } from "../utils/ApiService";

type Inputs = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};
export default function PopupUpdateUser(props: {
  user_id: any;
  statePopup: any;
}) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [valueRole, setValueRole] = useState("1");
  const [errorDB, setErrorDB] = useState("");
  const [isModalUpdateUser, setIsModalUpdateUser] = useState(true);
  const [dataUser, setDataUser] = useState([] as any);
  const [isModalUpdateUserSuccess, setIsModalUpdateUserSuccess] =
    useState(false);
  const generally = 2;
  const admin = 1;
  const id = props.user_id;
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [spinnerPopup, setSpinnerPopup] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });
  const closeModal = () => {
    setIsModalUpdateUser(false);
    props.statePopup(false);
  };

  useEffect(() => {
    if (user.user_id) {
      loadDataUser();
    }
  }, [user.user_id]);

  const loadDataUser = async () => {
    try {
      setOpacity("0.5");
      setSpinnerPopup(true);
      const response = await getUserId(id);
      if (response.data.result.status == "OK") {
        setDataUser(response?.data?.data);
        setName(response?.data?.data?.name);
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("load data upadte user");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setOpacity("1");
      setSpinnerPopup(false);
    } catch (error) {
      alert(error);
    }
  };
  const processError: SubmitErrorHandler<Inputs> = async () => {
    // Clear DB error
    setErrorDB("");
  };
  const handleChange = (event: any) => {
    setErrorDB(getMessageByCode(""));
  };
  const handleUpdateUser = async () => {
    try {
      let dataUpdateUser = {
        name: name,
        role: valueRole,
      };
      setSpinnerPopup(true);
      setOpacity("0.5");
      const response = await updateUser(id, dataUpdateUser);
      if (response?.data?.result?.status == "OK") {
        // Show pop up
        setIsModalUpdateUserSuccess(true);
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("handele update user (admin)");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setSpinnerPopup(false);
      setOpacity("1");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalUpdateUser}
        backdrop="blur"
        onClose={closeModal}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                User Modification
              </ModalHeader>

              <ModalBody>
                <div style={{ opacity: opacity }}>
                  <form onSubmit={handleSubmit(handleUpdateUser, processError)}>
                    <div className="mb-[50px]">
                      <div className="wrapper">
                        <p>Email address</p>
                        <div className="input-field">
                          <input
                            placeholder="mail address"
                            disabled
                            name="email"
                            value={dataUser["email"]}
                            id="email"
                          />
                          {errors.email?.message && (
                            <p className="text-sm text-red-400">
                              {errors.email.message}
                            </p>
                          )}
                          {errorDB && (
                            <p className="text-sm text-red-400">{errorDB}</p>
                          )}
                        </div>
                      </div>
                      <div className="wrapper">
                        <p>Full name</p>
                        <div className="input-field">
                          <input
                            placeholder="氏名"
                            {...register("name", {
                              required: E0003.replace("{1}", NAME_LABEL),
                              validate: {
                                checkMaxLeghtByByte: (value) => {
                                  if (name) {
                                    return (
                                      new Blob([value]).size <= 64 ||
                                      E0005.replace("{1}", NAME_LABEL).replace(
                                        "{2}",
                                        "64",
                                      )
                                    );
                                  } else {
                                    return true;
                                  }
                                },
                              },
                            })}
                            name="name"
                            value={name}
                            id="name"
                            onChange={(e) => setName(e.target.value)}
                          />
                          {errors.name?.message && (
                            <p className="text-sm text-red-400">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="wrapper">
                        <p>Role</p>
                        <select
                          onChange={(e) => setValueRole(e.target.value)}
                          style={{
                            color: "black",
                            width: "100%",
                            borderStyle: "solid",
                            borderColor: "#cfc9cb",
                            borderWidth: "1px",
                            borderRadius: "5px",
                          }}
                        >
                          <option
                            value={admin}
                            selected={dataUser["role"] == 1}
                          >
                            Administrator
                          </option>
                          <option
                            value={generally}
                            selected={dataUser["role"] == 2}
                          >
                            General
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="submitBtn">
                      <button type="submit" style={{ color: "white" }}>
                        Edit
                      </button>
                    </div>
                  </form>
                </div>
                {spinnerPopup == true && (
                  <Spinner className="absolute left-[45%] bottom-[17%]" />
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Popup update user success */}
      <Modal
        isOpen={isModalUpdateUserSuccess}
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
                User change complete
              </ModalHeader>

              <ModalBody>
                <p>{I0002}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="btnPopup"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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
      )}
    </>
  );
}
