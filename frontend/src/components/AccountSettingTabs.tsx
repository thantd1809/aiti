"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { signOut } from "next-auth/react";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tab,
  Tabs,
} from "@nextui-org/react";
import { IoPersonOutline } from "react-icons/io5";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Icon } from "@chakra-ui/react";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { pattern_password } from "../utils/constants";
import { getMessageByCode } from "../utils/getMessageByCode";
import {
  CONFIRM_NEW_PASSWORD_LABEL,
  CURRENT_PASSWORD,
  E0003,
  E0005,
  E0010,
  E0011,
  E0021,
  E0022,
  I0002,
  NAME_LABEL,
  NEW_PASSWORD_LABEL,
} from "../utils/message";
import { useUser } from "../utils/UserContext";
import { updateUser, updatePassWord, getUserId } from "../utils/ApiService";

type InputsName = {
  name: string;
};
type InputsPassword = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function AccountSettingTabs() {
  const router = useRouter();
  const { user } = useUser();
  const [visibleNewPassword, setVisibleNewPassword] = useState(false);
  const [visibleOldPassword, setVisibleOldPassword] = useState(false);
  const [visibleConfirmPassword, setVisibleConfirmPassword] = useState(false);
  const [errorDB, setErrorDB] = useState("");
  const [dataUser, setDataUser] = useState([] as any);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [isModalSuccess, setIsModelSuccess] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const [disable, setDisable] = useState(false);
  const [loginGoogle, setLoginGoogle] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InputsName>({ values: { name: name } });
  const {
    register: register2,
    formState: { errors: errors2 },
    handleSubmit: handleSubmit2,
  } = useForm<InputsPassword>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const handleLogin = async () => {
    await signOut({ redirect: false });

    router.push("/login");
  };
  const handleUpdateUserName = async () => {
    try {
      setSpinner(true);
      setOpacity("0.5");
      setDisable(true);
      let dataUpdateUser = {
        name: name,
        role: user.role,
      };
      const response = await updateUser(user.user_id, dataUpdateUser);
      if (response?.data?.result?.status == "OK") {
        // Show pop up
        setIsModelSuccess(true);
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("update user name");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setSpinner(false);
      setOpacity("1");
      setDisable(false);
    } catch (error) {
      alert(error);
    }
  };
  const handleUpdateUserPassword = async () => {
    try {
      setSpinner(true);
      setOpacity("0.5");
      setDisable(true);
      let dataUpdateUserPassword = {
        current_password: oldPassword,
        password: newPassword,
        password_confirm: confirmPassword,
      };

      const response = await updatePassWord(dataUpdateUserPassword);
      if (response?.data?.result?.status == "OK") {
        setIsModelSuccess(true);
      }
      setSpinner(false);
      setOpacity("1");
      setDisable(false);
    } catch (error: any) {
      const errData = error?.response?.data;

      if (errData?.result?.status === "NG") {
        if (errData?.result?.code === "E0004") {
          setErrorDB(
            getMessageByCode(errData?.result?.msg).replace(
              "{1}",
              CURRENT_PASSWORD,
            ),
          );
        } else if (errData?.result?.code === "E0021") {
          setErrorDB(getMessageByCode(errData?.result?.msg));
        } else if (errData?.result?.code === "E0020") {
          setErrorDB(getMessageByCode(errData?.result?.msg));
        } else if ((errData?.result?.msg || "").includes(errorConnectDB)) {
          setIsPopupMessageConnectDB(true);
        } else {
          alert(errData?.result?.msg);
        }
      }

      setSpinner(false);
      setOpacity("1");
      setDisable(false);
    }
  };
  const processErrorName: SubmitErrorHandler<InputsName> = async () => {
    // Clear DB error
    setErrorDB("");
  };
  const processErrorPassword: SubmitErrorHandler<InputsPassword> = async () => {
    // Clear DB error
    setErrorDB("");
  };
  const loadDataUser = async () => {
    try {
      setOpacity("0.5");
      const response = await getUserId(user.user_id);

      if (response.data.result.status == "OK") {
        setDataUser(response?.data?.data);
        setName(response?.data?.data?.name);
        setEmail(response?.data?.data?.email);
        setLoginGoogle(response?.data?.data?.login_google);
        if (response?.data?.data?.login_google) {
          setDisable(true);
        }
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          console.log("load data user seeting tab");
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
      setOpacity("1");
    } catch (error) {
      alert(error);
    }
  };
  useEffect(() => {
    if (user.user_id) {
      loadDataUser();
    }
  }, [user.user_id]);

  return (
    <>
      <div className="flex flex-col px-4">
        <div className="flex w-full flex-col">
          <Tabs style={{ opacity: opacity }}>
            <Tab
              title={
                <div className="flex sm:justify-between">
                  <span>
                    <Icon as={IoPersonOutline} />
                  </span>

                  <p className="sm:block hidden">Full name</p>
                </div>
              }
            >
              <Card className="sm:w-full">
                <CardBody className="overflow-hidden">
                  <div style={{ opacity: opacity }}>
                    <form
                      onSubmit={handleSubmit(
                        handleUpdateUserName,
                        processErrorName,
                      )}
                    >
                      <p>Full name</p>
                      <div className="relative border-solid border-black">
                        <input
                          className="sm:w-full w-[300px] border border-[#cfc9cb] border-solid rounded-[5px] text-[15px]"
                          placeholder="Full name"
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
                          disabled={disable}
                          value={name}
                          onChange={(e) => setName(e.currentTarget.value)}
                        />
                        {errors.name?.message && (
                          <p className="text-sm text-red-400">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          id="btn"
                          style={{ color: "white", width: "80px" }}
                          disabled={disable}
                        >
                          Change
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
                </CardBody>
              </Card>
            </Tab>
            <Tab
              title={
                <div className="flex sm:justify-between">
                  <span>
                    <Icon as={TfiEmail} />
                  </span>

                  <p className="sm:block hidden"> Email address</p>
                </div>
              }
            >
              <Card>
                <CardBody>
                  <div className="sm:w-full w-[300px]">
                    <div className="wrapper">
                      <p>Email address</p>
                      <div className="input-field">
                        <input
                          placeholder="Email address"
                          disabled
                          value={dataUser["email"]}
                        />
                      </div>
                      <p>Your email address cannot be changed.</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab
              title={
                <div className="flex sm:justify-between">
                  <span>
                    <Icon as={RiLockPasswordLine} />
                  </span>

                  <p className="sm:block hidden">Password</p>
                </div>
              }
            >
              <Card>
                <CardBody>
                  <div style={{ opacity: opacity }}>
                    <form
                      onSubmit={handleSubmit2(
                        handleUpdateUserPassword,
                        processErrorPassword,
                      )}
                    >
                      <div>
                        <div>
                          <p>Current Password</p>
                          <div className="input-field">
                            <input
                              placeholder="Current Password"
                              {...register2("oldPassword", {
                                required: E0003.replace(
                                  "{1}",
                                  CURRENT_PASSWORD,
                                ),
                              })}
                              disabled={disable}
                              name="oldPassword"
                              value={oldPassword}
                              id="oldPassword"
                              onChange={(e) => setOldPassword(e.target.value)}
                              type={visibleOldPassword ? "text" : "password"}
                            />
                            <span
                              onClick={() =>
                                setVisibleOldPassword(!visibleOldPassword)
                              }
                            >
                              {visibleOldPassword ? (
                                <ViewIcon />
                              ) : (
                                <ViewOffIcon />
                              )}
                            </span>
                            {errors2.oldPassword?.message && (
                              <p className="text-sm text-red-400">
                                {errors2.oldPassword.message}
                              </p>
                            )}
                            {errorDB && (
                              <p className="text-sm text-red-400">{errorDB}</p>
                            )}
                          </div>
                        </div>
                        <div className="wrapper">
                          <p>New Password</p>
                          <div className="input-field">
                            <input
                              placeholder="New Password"
                              {...register2("newPassword", {
                                required: E0003.replace(
                                  "{1}",
                                  NEW_PASSWORD_LABEL,
                                ),
                                pattern: {
                                  value: pattern_password,
                                  message: E0010.replace(
                                    "{1}",
                                    NEW_PASSWORD_LABEL,
                                  )
                                    .replace("{2}", "12")
                                    .replace("{3}", "255"),
                                },
                                validate: {
                                  sameAsEmail: (value) => {
                                    if (email) {
                                      const usernameFromEmail =
                                        email.split("@")[0];
                                      return (
                                        value !== usernameFromEmail || E0022
                                      );
                                    } else {
                                      return true;
                                    }
                                  },
                                },
                              })}
                              disabled={disable}
                              name="newPassword"
                              value={newPassword}
                              id="newPassword"
                              onChange={(e) => setNewPassword(e.target.value)}
                              type={visibleNewPassword ? "text" : "password"}
                            />

                            <span
                              onClick={() =>
                                setVisibleNewPassword(!visibleNewPassword)
                              }
                            >
                              {visibleNewPassword ? (
                                <ViewIcon />
                              ) : (
                                <ViewOffIcon />
                              )}
                            </span>
                            {errors2.newPassword?.message && (
                              <p className="text-sm text-red-400">
                                {errors2.newPassword.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="wrapper">
                          <p>New Password (Confirm)</p>
                          <div className="input-field">
                            <input
                              placeholder="New Password (Confirm)"
                              {...register2("confirmPassword", {
                                required: E0003.replace(
                                  "{1}",
                                  CONFIRM_NEW_PASSWORD_LABEL,
                                ),
                                pattern: {
                                  value: pattern_password,
                                  message: E0010.replace(
                                    "{1}",
                                    CONFIRM_NEW_PASSWORD_LABEL,
                                  )
                                    .replace("{2}", "12")
                                    .replace("{3}", "255"),
                                },
                              })}
                              disabled={disable}
                              name="confirmPassword"
                              value={confirmPassword}
                              id="confirmPassword"
                              onChange={(e) =>
                                setconfirmPassword(e.target.value)
                              }
                              type={
                                visibleConfirmPassword ? "text" : "password"
                              }
                            />

                            <span
                              onClick={() =>
                                setVisibleConfirmPassword(
                                  !visibleConfirmPassword,
                                )
                              }
                            >
                              {visibleConfirmPassword ? (
                                <ViewIcon />
                              ) : (
                                <ViewOffIcon />
                              )}
                            </span>
                            {errors2.confirmPassword?.message && (
                              <p className="text-sm text-red-400">
                                {errors2.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ paddingTop: "15px", textAlign: "right" }}>
                        <button
                          type="submit"
                          id="btn"
                          style={{ color: "white", width: "80px" }}
                          disabled={disable}
                        >
                          Change
                        </button>
                      </div>
                      <div>{loginGoogle == true && <p>{E0021}</p>}</div>
                    </form>
                  </div>
                  <div className="spinner">
                    {spinner == true && (
                      <div>
                        <Spinner size="lg" />
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
      <Modal
        isOpen={isModalSuccess}
        classNames={{
          closeButton: "flex justify-end items-center",
          wrapper: "flex justify-center items-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-black" style={{ marginTop: "25px" }}>
                Editing completed
              </ModalHeader>
              <ModalBody>
                <p>{I0002}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="btnPopup"
                  onClick={() => setIsModelSuccess(false)}
                >
                  OK
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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
}
