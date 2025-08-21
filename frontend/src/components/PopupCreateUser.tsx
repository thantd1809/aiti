import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { pattern_email, pattern_password } from "../utils/constants";
import { getMessageByCode } from "../utils/getMessageByCode";
import {
  CONFIRM_PASSWORD_LABEL,
  E0003,
  E0004,
  E0005,
  E0010,
  E0011,
  E0012,
  E0022,
  EMAIL_LABEL,
  I0001,
  NAME_LABEL,
  PASSWORD_LABEL,
} from "../utils/message";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { registUser, sendActiveUser, getAllDepart } from "../utils/ApiService";

type Inputs = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};
export default function PopupCreateUser(props: { statePopup: any }) {
  const [isModalAddUser, setIsModalAddUser] = useState(true);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visiblePasswordConfirm, setVisiblePasswordConfirm] = useState(false);
  const [valueEmail, setValueEmail] = useState("");
  const [valueName, setValueName] = useState("");
  const [valuePassword, setValuePassword] = useState("");
  const [valueConfirmPassword, setvalueConfirmPassword] = useState("");
  const [valueRole, setValueRole] = useState("2"); //一般:2 , 管理者:1
  const [valueDepart, setValueDepart] = useState("");
  const [isModalCreateSuccess, setIsModalCreateSuccess] = useState(false);
  const [isModalCreateUserError, setIsModalCreateUserError] = useState(false);
  const [isModalActiveUser, setIsModalActiveUser] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [errorDB, setErrorDB] = useState("");
  const [departList, setDepartList] = useState([] as any[]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    getDepart();
  }, []);

  const closeModal = () => {
    setIsModalAddUser(false);
    props.statePopup(false);
  };

  const getDepart = async () => {
    try {
      const response = await getAllDepart();
      if (response?.status == 200) {
        setDepartList(response.data.data.departs);
      } else {
        alert(response.data.result.msg);
      }
    } catch (error) {
      alert(error);
    }
  };

  const hanldeCreateUser: SubmitHandler<Inputs> = async (e: any) => {
    try {
      let dataCreateUser = {
        email: valueEmail,
        password: valuePassword,
        name: valueName,
        role: valueRole,
        department_id: valueDepart,
      };
      setSpinner(true);
      setOpacity("0.5");
      const response = await registUser(dataCreateUser);

      if (response?.data?.result?.status == "OK") {
        // Show pop up
        setIsModalCreateSuccess(true);
      } else if (response?.data?.result?.status == "NG") {
        if (response?.data?.result?.code == "E0012") {
          setIsModalCreateUserError(true);
        } else if (response?.data?.result?.code == "E0023") {
        } else if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("create user");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setSpinner(false);
      setOpacity("1");
    } catch (error: any) {
      if (error.response.data.result.code == "E0023") {
        setErrorDB(getMessageByCode(error.response?.data?.result?.msg));
        setIsModalActiveUser(true);
      }
      if (error.response.data.result.code == "E0012") {
        setIsModalCreateUserError(true);
      } else {
        alert(error);
      }
      setSpinner(false);
      setOpacity("1");
    }
  };

  // function reactive email user
  const hanldeActiveUser = async () => {
    try {
      const response = await sendActiveUser(valueEmail);
      if (response?.data?.result?.status == "OK") {
        // Show pop up
        setIsModalCreateSuccess(true);
        // window.location.reload();
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("active user");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalAddUser}
        backdrop="blur"
        onClose={closeModal}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex pb-[100px] justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                User Registration
              </ModalHeader>

              <ModalBody>
                <div style={{ opacity: opacity }}>
                  <form onSubmit={handleSubmit(hanldeCreateUser)}>
                    <div className="mb-[50px]">
                      <div className="wrapper">
                        <p>Email</p>
                        <div className="input-field">
                          <input
                            placeholder="Email"
                            {...register("email", {
                              required: E0003.replace("{1}", EMAIL_LABEL),
                              maxLength: {
                                value: 255,
                                message: E0005.replace(
                                  "{1}",
                                  EMAIL_LABEL,
                                ).replace("{2}", "255"),
                              },
                              pattern: {
                                value: pattern_email,
                                message: E0004.replace("{1}", EMAIL_LABEL),
                              },
                            })}
                            value={valueEmail}
                            id="email"
                            onChange={(e) => {
                              setValueEmail(e.target.value);
                            }}
                          />
                          {errors.email?.message && (
                            <p className="text-sm text-red-400">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="wrapper">
                        <p>Full Name</p>
                        <div className="input-field">
                          <input
                            placeholder="Full Name"
                            {...register("name", {
                              required: E0003.replace("{1}", NAME_LABEL),
                              validate: {
                                checkMaxLeghtByByte: (value) => {
                                  if (valueName) {
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
                            value={valueName}
                            id="name"
                            onChange={(e) => setValueName(e.target.value)}
                          />
                          {errors.name?.message && (
                            <p className="text-sm text-red-400">
                              {errors.name.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="wrapper">
                        <p>Password</p>
                        <div className="input-field">
                          <input
                            placeholder="Password"
                            type={visiblePassword ? "text" : "password"}
                            {...register("password", {
                              required: E0003.replace("{1}", PASSWORD_LABEL),
                              pattern: {
                                value: pattern_password,
                                message: E0010.replace("{1}", PASSWORD_LABEL)
                                  .replace("{2}", "12")
                                  .replace("{3}", "255"),
                              },
                              validate: {
                                sameAsEmail: (value) => {
                                  if (valueEmail) {
                                    const usernameFromEmail =
                                      valueEmail.split("@")[0];
                                    return value !== usernameFromEmail || E0022;
                                  } else {
                                    return true;
                                  }
                                },
                                checkMaxLeghtByByte: (value) => {
                                  if (valuePassword) {
                                    return (
                                      new Blob([value]).size <= 255 ||
                                      E0005.replace(
                                        "{1}",
                                        PASSWORD_LABEL,
                                      ).replace("{2}", "255")
                                    );
                                  } else {
                                    return true;
                                  }
                                },
                              },
                            })}
                            name="password"
                            value={valuePassword}
                            id="password"
                            onChange={(e) => setValuePassword(e.target.value)}
                          />
                          <span
                            onClick={() => setVisiblePassword(!visiblePassword)}
                          >
                            {visiblePassword ? <ViewIcon /> : <ViewOffIcon />}
                          </span>
                          {errors.password?.message && (
                            <p className="text-sm text-red-400">
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="wrapper">
                        <p>Confirm Password</p>
                        <div className="input-field">
                          <input
                            type={visiblePasswordConfirm ? "text" : "password"}
                            placeholder="Confirm Password"
                            {...register("confirmPassword", {
                              required: E0003.replace(
                                "{1}",
                                CONFIRM_PASSWORD_LABEL,
                              ),
                              pattern: {
                                value: pattern_password,
                                message: E0010.replace(
                                  "{1}",
                                  CONFIRM_PASSWORD_LABEL,
                                )
                                  .replace("{2}", "12")
                                  .replace("{3}", "255"),
                              },
                              validate: {
                                sameAsConfirmation: (value) =>
                                  value === watch("password") || E0011,
                                sameAsEmail: (value) => {
                                  if (valueEmail) {
                                    const usernameFromEmail =
                                      valueEmail.split("@")[0];
                                    return value !== usernameFromEmail || E0022;
                                  } else {
                                    return true;
                                  }
                                },
                                checkMaxLeghtByByte: (value) => {
                                  if (valueConfirmPassword) {
                                    return (
                                      new Blob([value]).size <= 255 ||
                                      E0005.replace(
                                        "{1}",
                                        CONFIRM_PASSWORD_LABEL,
                                      ).replace("{2}", "255")
                                    );
                                  } else {
                                    return true;
                                  }
                                },
                              },
                            })}
                            name="confirmPassword"
                            value={valueConfirmPassword}
                            id="confirmPassword"
                            onChange={(e) =>
                              setvalueConfirmPassword(e.target.value)
                            }
                          />
                          <span
                            onClick={() =>
                              setVisiblePasswordConfirm(!visiblePasswordConfirm)
                            }
                          >
                            {visiblePasswordConfirm ? (
                              <ViewIcon />
                            ) : (
                              <ViewOffIcon />
                            )}
                          </span>
                          {errors.confirmPassword?.message && (
                            <p className="text-sm text-red-400">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="wrapper">
                        <p>Role</p>
                        <select
                          style={{
                            color: "black",
                            width: "100%",
                            borderStyle: "solid",
                            borderColor: "#cfc9cb",
                            borderWidth: "1px",
                            borderRadius: "5px",
                          }}
                          onChange={(e) => setValueRole(e.target.value)}
                        >
                          <option value="2" selected>
                            User
                          </option>
                          <option value="1">Admin</option>
                        </select>
                      </div>
                      <div className="wrapper">
                        <p>Department</p>
                        <select
                          style={{
                            color: "black",
                            width: "100%",
                            borderStyle: "solid",
                            borderColor: "#cfc9cb",
                            borderWidth: "1px",
                            borderRadius: "5px",
                          }}
                          value={valueDepart}
                          onChange={(e) => setValueDepart(e.target.value)}
                        >
                          {departList.map((depart) => (
                            <option key={depart.id} value={depart.id}>
                              {depart.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="submitBtn">
                      <button type="submit" style={{ color: "white" }}>
                        Register
                      </button>
                    </div>
                  </form>
                </div>
                <div className="spinner">
                  {spinner == true && (
                    <div>
                      <Spinner size="lg" />
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* User creation success popup */}
      <Modal
        isOpen={isModalCreateSuccess}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Registration Successful
              </ModalHeader>
              <ModalBody>
                <p>{I0001}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="btnPopup"
                  onClick={() => window.location.reload()}
                >
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Popup active user */}
      <Modal
        isOpen={isModalActiveUser}
        onClose={() => setIsModalActiveUser(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader
                className="text-black "
                style={{ marginTop: "25px" }}
              >
                Confirmation
              </ModalHeader>

              <ModalBody>
                <p>{errorDB}</p>
                {/* <p>Do you want to reactivate ?</p> */}
              </ModalBody>
              <ModalFooter>
                <Button className="btnPopup" onClick={hanldeActiveUser}>
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Duplicate email error popup */}
      <Modal
        isOpen={isModalCreateUserError}
        onClose={() => setIsModalCreateUserError(false)}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Error
              </ModalHeader>
              <ModalBody>
                <p>{E0012}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="btnPopup"
                  onClick={() => setIsModalCreateUserError(false)}
                >
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Database connection error popup */}
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
                <p>Unable to connect to the database</p>
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
}
