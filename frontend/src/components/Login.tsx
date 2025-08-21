"use client";

import { Icon } from "@chakra-ui/react";
import Link from "next/link";
import backgroundImage from "../../public/images/bg-img-bird.png";
import { pattern_email } from "../utils/constants";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import Background_turn_top from "./BackgroundTurnTop";
import Background_turn_bottom from "./BackgroundTurnBottom";
import logo_sprite from "../../public/images/logo-istech.png";
import AI_text from "../../public/images/AI-text.png";
import Image from "next/image";
import {
  E0003,
  E0004,
  E0005,
  EMAIL_LABEL,
  PASSWORD_LABEL,
} from "../utils/message";
import { getMessageByCode } from "../utils/getMessageByCode";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import Footer from "./Footer";
import {
  loginacc,
  checkContinueGoogle,
  continueGoogle,
} from "../utils/ApiService";
import { useUser } from "../utils/UserContext";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const router = useRouter();
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [visible, setVisible] = useState(false);
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    other: "",
  });
  const { login, logout } = useUser();

  // Handler function to handle form submission for "Login" button
  const handleLoginSubmit = async (event: any) => {
    event.preventDefault(); // Prevent default form submission
    const validEmail = validateEmail(formData.email);
    const validPassword = validatePassword(formData.password);
    if (validEmail && validPassword) {
      loadDataUser();
    }
  };

  // Handler function to handle form submission for "Continue Google" button
  const handleGoogleSubmit = async (event: any) => {
    event.preventDefault(); // Prevent default form submission
    const res = await signIn("google", { callbackUrl: "/auth-redirect" });
  };

  // Handler function to handle changes in form fields
  const handleChange = (event: any) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear validation errors when the input field changes
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  // Function to validate email format
  const validateEmail = (email: string) => {
    // Validate email
    if (!email) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: getMessageByCode(E0003.replace("{1}", EMAIL_LABEL)),
      }));
      return false;
    } else if (email.length > 255) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: getMessageByCode(
          E0005.replace("{1}", EMAIL_LABEL).replace("{2}", "255"),
        ),
      }));
      return false;
    } else if (!validatePatternEmail(email)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: getMessageByCode(E0004.replace("{1}", EMAIL_LABEL)),
      }));
      return false;
    }
    return true;
  };
  const validatePassword = (password: string) => {
    // Validate password
    if (!password) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: getMessageByCode(E0003.replace("{1}", PASSWORD_LABEL)),
      }));
      return false;
    }
    return true;
  };
  // Function to validate email format
  const validatePatternEmail = (email: string) => {
    // const emailPattern = pattern_email;
    return pattern_email.test(email);
  };

  const loadDataUser = async () => {
    try {
      setSpinner(true);
      setOpacity("0.5");
      const response = await loginacc({
        email: formData.email,
        password: formData.password,
      });
      if (response.data.result.status == "OK") {
        const { access_token, refresh_token } = response.data?.data;
        login(access_token, refresh_token);
        if (response.data.data.pwd_status === true) {
          // goto chat screen
          router.push("/chat");
          setSpinner(false);
          setOpacity("1");
          // router.push("/upload");
        } else if (response.data.data.pwd_status === false) {
          router.push("/initial-password");
          setSpinner(false);
          setOpacity("1");
        }
      } else if (response?.data?.result?.status == "NG") {
        if ((response?.data?.result.msg).includes(errorConnectDB)) {
          setIsPopupMessageConnectDB(true);
        } else {
          alert(response?.data?.result.msg);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          other: getMessageByCode(error.response?.data?.result?.msg),
        }));
        setSpinner(false);
        setOpacity("1");
      }
    }
  };

  const handleResetPassword = () => {
    setSpinner(true);
    setOpacity("0.5");
  };
  return (
    <>
      <main
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          opacity: opacity,
          position: "relative",
        }}
      >
        {/* <Background_turn_top /> */}
        {/* <div> */}
        <Image
          src={logo_sprite}
          alt="picture"
          width={35}
          height={35}
          style={{
            top: "20px",
            left: "20px",
            position: "absolute",
          }}
        />

        <form className="pointer-events-auto bg-white/75 px-0 py-4 sm:p-8 rounded-[10px] min-w-[350px]">
          <div>
            <div>
              <p className="font-bold text-2xl sm:text-4xl text-center">
                Log in
              </p>
            </div>
            {errors.other && (
              <p className="text-sm text-red-400 sm:px-0 px-4">
                {errors.other}
              </p>
            )}
            <div>
              <p className="sm:px-0 px-4">Email address</p>
              <div className="input-field sm:px-0 px-4">
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  placeholder="Email address"
                  disabled={spinner}
                  onChange={handleChange}
                ></input>
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            </div>
            <div>
              <p className="sm:px-0 px-4">Password</p>
              <div className="input-field sm:px-0 px-4">
                <input
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  id="password"
                  onChange={handleChange}
                  type={visible ? "text" : "password"}
                  disabled={spinner}
                />

                <span
                  className="sm:px-0 px-4"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <ViewIcon /> : <ViewOffIcon />}
                </span>
                {errors.password && (
                  <p className="text-sm text-red-400 sm:px-0 px-4">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>
            <div id="forgot-password">
              <Link
                style={{ color: "#FF7C33" }}
                href="/reset-link"
                onClick={handleResetPassword}
                aria-disabled="true"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="sm:px-0 px-4">
              <button id="btn" onClick={handleLoginSubmit} disabled={spinner}>
                Log in
              </button>
            </div>
            <div className="border-solid border-orange-400 sm:px-0 px-4">
              <button
                id="google-email-btn"
                disabled={spinner}
                onClick={handleGoogleSubmit}
                style={{ opacity: spinner ? "0.5" : "1", cursor: "pointer" }}
                className="flex items-center justify-center gap-2 "
              >
                <Icon className="text-black color-orange" as={FaGoogle} />
                <p style={{ color: "#FF7C33", textAlign: "center" }}>
                  Sign in with Google
                </p>
              </button>
            </div>
          </div>
        </form>
        {/* <Background_turn_bottom /> */}
        <div className="absolute bottom-[0px]">
          <Footer></Footer>
        </div>
      </main>
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
