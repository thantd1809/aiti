"use client";
import { Icon } from "@chakra-ui/react";
import { pattern_email } from "../utils/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Background_turn_top from "./BackgroundTurnTop";
import Background_turn_bottom from "./BackgroundTurnBottom";
import logo_sprite_black from "../../public/images/logo-sprite-black.png";
import AI_text_black from "../../public/images/AI-text-black.png";
import footer_image from "../../public/images/copyright-black.png";
import Image from "next/image";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { TbArrowBack } from "react-icons/tb";
import { E0003, E0004, E0005, EMAIL_LABEL } from "@/src/utils/message";
import { getMessageByCode } from "@/src/utils/getMessageByCode";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import Link from "next/link";
import { sendResetLink } from "../utils/ApiService";

type Inputs = {
  email: string;
};

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorDB, setErrorDB] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      email: "",
    },
  });

  const closeModal = () => {
    router.push("/login");
    setIsModalOpen(false);
  };

  const handleLogin = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const processForm: SubmitHandler<Inputs> = async (formData) => {
    try {
      setSpinner(true);
      setOpacity("0.5");
      const data = {
        email: formData.email,
      };
      const response = await sendResetLink(data);

      if (response?.data?.result?.status == "OK") {
        // Show pop up
        setIsModalOpen(true);
      } else if (response?.data?.result?.code == "E0021") {
        setSpinner(false);
        setOpacity("1");
        setErrorDB(getMessageByCode(response?.data?.result?.code));
      } else if (response?.data?.result?.code == "") {
        setSpinner(false);
        setOpacity("1");
        setErrorDB(
          getMessageByCode(response?.data?.result?.code).replace(
            "{1}",
            EMAIL_LABEL,
          ),
        );
        if ((response?.data?.result?.msg).includes(errorConnectDB)) {
          console.log("reset link");
          setIsPopupMessageConnectDB(true);
        }
      }
      setSpinner(false);
      setOpacity("1");
    } catch (error: any) {
      if (error.response?.data?.result?.code == "E0021") {
        setSpinner(false);
        setOpacity("1");
        setErrorDB(getMessageByCode(error.response?.data?.result?.msg));
      } else if (error.response?.data?.result?.code == "E0004") {
        setSpinner(false);
        setOpacity("1");
        setErrorDB(
          getMessageByCode(error.response?.data?.result?.msg).replace(
            "{1}",
            EMAIL_LABEL,
          ),
        );
      }
    }
  };
  const processError: SubmitErrorHandler<Inputs> = async () => {
    // Clear DB error
    setErrorDB("");
  };
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
            src={logo_sprite_black}
            alt="picture"
            width={250}
            height={250}
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
        <div id="forgot-password-form" className="general-form">
          <form onSubmit={handleSubmit(processForm, processError)}>
            <div>
              <div>
                <p className="font-bold text-4xl text-center">
                  Change Password
                </p>
              </div>
              <div id="text-form" style={{ textAlign: "center" }}>
                <p>
                  {
                    "Enter your registered email address and click the `Send` button."
                  }
                </p>
                <p>
                  Clicking this will send you an email with instructions to
                  reset your password.
                </p>
              </div>
              <div className="wrapper">
                <p>Email address</p>
                <div className="input-field">
                  <input
                    placeholder="Email address"
                    {...register("email", {
                      required: E0003.replace("{1}", EMAIL_LABEL),
                      maxLength: {
                        value: 255,
                        message: E0005.replace("{1}", EMAIL_LABEL).replace(
                          "{2}",
                          "255",
                        ),
                      },
                      pattern: {
                        value: pattern_email,
                        message: E0004.replace("{1}", EMAIL_LABEL),
                      },
                    })}
                    name="email"
                    value={email}
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                  />
                  {errors.email?.message && (
                    <p className="text-sm text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                  {errorDB && <p className="text-sm text-red-400">{errorDB}</p>}
                </div>
              </div>
              <div style={{ paddingTop: "15px" }}>
                <button id="btn" style={{ color: "white" }}>
                  Send
                </button>
              </div>
              {spinner == true && (
                <div>
                  <Spinner
                    style={{ position: "absolute", left: "40%", top: "42%" }}
                    size="lg"
                  />
                </div>
              )}
            </div>
          </form>
          {/* <div style={{ marginLeft: "29%" }}> */}
          <div className="w-[150px] ml-[35%]">
            <Link href="/login" onClick={handleLogin}>
              <div className="linkReturn">
                <Icon
                  className="text-black"
                  style={{
                    color: "#FF7C33",
                    position: "absolute",
                    marginTop: "5px",
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
            </Link>
          </div>
          {/* </div> */}
        </div>
        <Modal
          isOpen={isModalOpen}
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
                  Sent
                </ModalHeader>
                <ModalBody>
                  <p>
                    {
                      "An email has been sent to the address you provided. Please click the link in the email to change your password."
                    }
                  </p>
                  <p>
                    {
                      "If you can't find the email, check your junk, spam or other folders."
                    }
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button className="btnPopup" onPress={onClose}>
                    OK
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
        <Background_turn_bottom />
        <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
          <Image
            style={{ marginLeft: "auto", marginRight: "auto" }}
            src={footer_image}
            alt=""
          />
        </div>
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
