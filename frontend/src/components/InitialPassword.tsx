"use client";
import { Icon } from "@chakra-ui/react";
import { pattern_password } from "../utils/constants";
import { useEffect, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import Background_turn_top from "./BackgroundTurnTop";
import Background_turn_bottom from "./BackgroundTurnBottom";
import Image from "next/image";
import logo_istech from "../../public/images/custom_logo.png";
import AI_text_black from "../../public/images/AI-text-black.png";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import footer_image from "../../public/images/copyright-black.png";
import { TbArrowBack } from "react-icons/tb";
import { signOut } from "next-auth/react";
import {
  CONFIRM_PASSWORD_LABEL,
  E0003,
  E0010,
  E0022,
  I0002,
  INITIAL_PASSWORD_LABEL,
  PASSWORD_LABEL,
} from "@/src/utils/message";
import { getMessageByCode } from "../utils/getMessageByCode";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import { useUser } from "../utils/UserContext";
import { change_password, getUserId } from "../utils/ApiService";

type Inputs = {
  initialPassword: string;
  password: string;
  confirmPassword: string;
};

export default function Initialpassword() {
  const { user } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [visibleInitialPassword, setVisibleInitialPassword] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visiblePasswordConfirm, setVisiblePasswordConfirm] = useState(false);
  const [errorDB, setErrorDB] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const okModal = () => {
    // setSpinner(true)
    router.push("/chat");
  };

  const handleLogout = async () => {
    localStorage.setItem("loginStatus", "false");
    await signOut({ redirect: false });
    router.push("/login");
  };
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      initialPassword: "",
      password: "",
      confirmPassword: "",
    },
  });
  const processForm: SubmitHandler<Inputs> = async (formData) => {
    try {
      if (user) {
        setSpinner(true);
        setOpacity("0.5");
        const data = {
          current_password: initialPassword,
          password: password,
          password_confirm: confirmPassword,
        };

        const response = await change_password(data);

        if (response.data.result.status == "OK") {
          // Update pwd_status into session
          if (user) {
            if (user.pwd_status) {
              // await update({ ...user, pwd_status: true });
            }
          }
          // Show pop up
          setIsModalOpen(true);
        } else if (response.data.result.status == "NG") {
          if (response?.data?.result?.code == "E0004") {
            setErrorDB(
              getMessageByCode(response?.data?.result?.code).replace(
                "{1}",
                INITIAL_PASSWORD_LABEL,
              ),
            );
          } else if ((response?.data?.result.msg).includes(errorConnectDB)) {
            console.log("sumbit innit password");
            setIsPopupMessageConnectDB(true);
          } else {
            alert(response?.data?.result.msg);
          }
        }
        setSpinner(false);
        setOpacity("1");
      }
    } catch (error: any) {
      if (error?.response?.data?.result.code == "E0004") {
        const rawMsg = error?.response?.data?.result?.msg || "";

        const parsedMsg = rawMsg.replace("{1}", "Initial Password ");

        setError("initialPassword", {
          message: parsedMsg,
        });
      } else if (error?.response?.data?.result.code == "E0020") {
        const rawMsg = error?.response?.data?.result?.msg || "";
        const parsedMsg = rawMsg.replace("{1}", "Password Confirm ");
        setError("confirmPassword", {
          message: parsedMsg,
        });
      }
      setSpinner(false);
      setOpacity("1");
    }
  };
  const processError: SubmitErrorHandler<Inputs> = async () => {
    // Clear DB error
    setErrorDB("");
  };
  useEffect(() => {
    // Call fetchUser function when the component mounts
    const fetchUser = async () => {
      try {
        if (user) {
          const response = await getUserId(user.user_id);
          if (response.data.result.status == "OK") {
            setEmail(response.data.data.email);
          } else if (response.data.result.status == "NG") {
            if ((response?.data?.result.msg).includes(errorConnectDB)) {
              console.log("fect user init password");
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
    fetchUser();
  }, [user]);
  return (
    <>
      <div
        style={{
          background: "#EFEFEE",
          backgroundSize: "cover",
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          padding: "70px",
          opacity: opacity,
        }}
      >
        <Background_turn_top />
        <div style={{ marginLeft: "auto", marginRight: "auto" }}>
          <Image
            src={logo_istech}
            alt="picture"
            width={150}
            height={150}
            style={{}}
          />
          <Image
            src={AI_text_black}
            alt="picture"
            width={100}
            height={100}
            style={{
              margin: "auto",
            }}
          />
        </div>
        <Modal
          isOpen={isModalOpen}
          classNames={{
            closeButton: "flex justify-end items-center",
            wrapper: "flex justify-center items-center",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader
                  className="text-black "
                  style={{ marginTop: "25px" }}
                >
                  Changes Completed
                </ModalHeader>
                <ModalBody>
                  <p>{I0002}</p>
                </ModalBody>
                <ModalFooter>
                  <Button className="btnPopup" onClick={okModal}>
                    OK
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        {/* {isModalOpen == true && (<PopupCommon header='Success' content={sucessCodeMessage} textButton='OK' link='/chat' handle='' />)} */}
        {/* {!session && (<PopupSession />)} */}
        <div id="initial-form" className="general-form">
          <form onSubmit={handleSubmit(processForm, processError)}>
            <div>
              <div>
                <p className="font-bold text-2xl text-center">
                  Change initial password
                </p>
              </div>
              <div className="wrapper">
                <p>Initial Password</p>
                <div className="input-field">
                  <input
                    type={visibleInitialPassword ? "text" : "password"}
                    {...register("initialPassword", {
                      required: E0003.replace("{1}", INITIAL_PASSWORD_LABEL),
                    })}
                    name="initialPassword"
                    value={initialPassword}
                    placeholder="Initial Password"
                    onChange={(e) => setInitialPassword(e.target.value)}
                  ></input>

                  <span
                    onClick={() =>
                      setVisibleInitialPassword(!visibleInitialPassword)
                    }
                  >
                    {visibleInitialPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </span>
                  {errors.initialPassword?.message && (
                    <p className="text-sm text-red-400">
                      {errors.initialPassword.message}
                    </p>
                  )}
                  {errorDB && <p className="text-sm text-red-400">{errorDB}</p>}
                </div>
              </div>

              <div className="wrapper">
                <p>Password</p>
                <div className="input-field">
                  <input
                    placeholder="Password"
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
                          if (email) {
                            const usernameFromEmail = email.split("@")[0];
                            return value !== usernameFromEmail || E0022;
                          } else {
                            return true;
                          }
                        },
                      },
                    })}
                    name="password"
                    value={password}
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    type={visiblePassword ? "text" : "password"}
                  />

                  <span onClick={() => setVisiblePassword(!visiblePassword)}>
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
                <p>Password (confirm)</p>
                <div className="input-field">
                  <input
                    placeholder="Password (confirm)"
                    {...register("confirmPassword", {
                      required: E0003.replace("{1}", CONFIRM_PASSWORD_LABEL),
                      pattern: {
                        value: pattern_password,
                        message: E0010.replace("{1}", CONFIRM_PASSWORD_LABEL)
                          .replace("{2}", "12")
                          .replace("{3}", "255"),
                      },
                    })}
                    name="confirmPassword"
                    value={confirmPassword}
                    id="confirmPassword"
                    onChange={(e) => setconfirmPassword(e.target.value)}
                    type={visiblePasswordConfirm ? "text" : "password"}
                  />

                  <span
                    onClick={() =>
                      setVisiblePasswordConfirm(!visiblePasswordConfirm)
                    }
                  >
                    {visiblePasswordConfirm ? <ViewIcon /> : <ViewOffIcon />}
                  </span>
                  {errors.confirmPassword?.message && (
                    <p className="text-sm text-red-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <div
                style={{
                  alignItems: "start",
                  fontSize: "14px",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                }}
              >
                <p style={{ color: "#6C757D" }}>
                  ※ 12 or more characters consisting of half-width English
                  uppercase letters, lowercase English letters, and numbers
                </p>
                <p style={{ color: "#6C757D" }}>
                  ※ Must not be the same as email address
                </p>
              </div>
              <div>
                {/* <Link href={'/forgotpassword'}> */}
                <button id="btn" style={{ color: "white" }}>
                  Change
                </button>
                {/* </Link> */}
              </div>
            </div>
            {/* {spinner == true && (<div><Spinner size="lg"/></div> )} */}
          </form>
          {/* <Button onClick={handleLogin} className="w-[136px] ml-[35%] bg-white"> */}
          {/* <Image src={googlePic} alt="" width={40} height={30}></Image> */}

          <div className="w-[150px] ml-[35%]">
            <button onClick={handleLogout}>
              <div className="linkReturn">
                <Icon
                  className="text-black"
                  style={{
                    color: "#FF7C33",
                    position: "absolute",
                    marginTop: "13px",
                  }}
                  as={TbArrowBack}
                />

                <p
                  style={{
                    color: "#FF7C33",
                    marginLeft: "30px",
                    fontSize: "medium",
                  }}
                >
                  Back to Login
                </p>
              </div>
            </button>
          </div>
        </div>
        <Background_turn_bottom />
        <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
          <Image
            style={{ marginLeft: "auto", marginRight: "auto" }}
            src={footer_image}
            alt=""
          />
        </div>
      </div>
      <div style={{ position: "absolute", top: "36%", left: "49%" }}>
        {spinner == true && (
          <div>
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
