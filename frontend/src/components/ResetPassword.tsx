"use client";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import Background_turn_top from "./BackgroundTurnTop";
import Background_turn_bottom from "./BackgroundTurnBottom";
import logo_sprite_black from "../../public/images/logo-sprite-black.png";
import AI_text_black from "../../public/images/AI-text-black.png";
import footer_image from "../../public/images/copyright-black.png";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  CONFIRM_NEW_PASSWORD_LABEL,
  E0003,
  E0010,
  NEW_PASSWORD_LABEL,
} from "@/src/utils/message";
import { pattern_password } from "@/src/utils/constants";
import { useSearchParams } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import { changeForgottenPass } from "../utils/ApiService";
type Inputs = {
  newPassword: string;
  confirmNewPassword: string;
  email: string;
};

export default function Page() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmPassword] = useState("");
  const [visibleNewPassword, setVisibleNewPassword] = useState(false);
  const [visibleNewPasswordConfirm, setVisibleNewPasswordConfirm] =
    useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [opacity, setOpacity] = useState("1");
  const errorConnectDB = "psycopg2.OperationalError";
  const [isPopupMessageConnectDB, setIsPopupMessageConnectDB] = useState(false);
  const okModal = () => {
    router.push("/login");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    router.push("/login");
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
      email: "",
    },
  });
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  const processForm: SubmitHandler<Inputs> = async (formData) => {
    try {
      setSpinner(true);
      setOpacity("0.5");

      if (q) {
        const response = await changeForgottenPass(
          formData.newPassword,
          formData.confirmNewPassword,
          q.toString(),
        );
        if (response.data.result.status == "OK") {
          // Redirect reset password complete
          router.push("/reset-complete");
        }
      }

      setSpinner(false);
      setOpacity("1");
    } catch (error: any) {
      if (error?.response.data.result.status == "NG") {
        if ((error?.response?.data?.result?.msg).includes(errorConnectDB)) {
          setIsPopupMessageConnectDB(true);
        } else {
          setSpinner(false);
          setOpacity("1");
          alert(error?.response?.data?.result?.msg);
        }
      }
    }
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
        <div>
          <div id="initial-form" className="general-form">
            <form onSubmit={handleSubmit(processForm)}>
              <div>
                <div>
                  <p className="font-bold text-4xl text-center">
                    Change Password
                  </p>
                </div>
                <div id="text-form" style={{ textAlign: "center" }}>
                  <p>Please enter a new password.</p>
                </div>
                <div className="wrapper">
                  <p>New Password</p>
                  <div className="input-field">
                    <input
                      placeholder="New Password"
                      {...register("newPassword", {
                        required: E0003.replace("{1}", NEW_PASSWORD_LABEL),
                        pattern: {
                          value: pattern_password,
                          message: E0010.replace("{1}", NEW_PASSWORD_LABEL)
                            .replace("{2}", "12")
                            .replace("{3}", "255"),
                        },
                      })}
                      name="newPassword"
                      value={newPassword}
                      id="password"
                      onChange={(e) => setNewPassword(e.target.value)}
                      type={visibleNewPassword ? "text" : "password"}
                    />

                    <span
                      onClick={() => setVisibleNewPassword(!visibleNewPassword)}
                    >
                      {visibleNewPassword ? <ViewIcon /> : <ViewOffIcon />}
                    </span>
                    {errors.newPassword?.message && (
                      <p className="text-sm text-red-400">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="wrapper" style={{ marginTop: "20px" }}>
                  <p>New Password (Confirm)</p>
                  <div className="input-field">
                    <input
                      placeholder="New Password (Confirm)"
                      {...register("confirmNewPassword", {
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
                      name="confirmNewPassword"
                      value={confirmNewPassword}
                      id="confirmNewPassword"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={visibleNewPasswordConfirm ? "text" : "password"}
                    />

                    <span
                      onClick={() =>
                        setVisibleNewPasswordConfirm(!visibleNewPasswordConfirm)
                      }
                    >
                      {visibleNewPasswordConfirm ? (
                        <ViewIcon />
                      ) : (
                        <ViewOffIcon />
                      )}
                    </span>
                    {errors.confirmNewPassword?.message && (
                      <p className="text-sm text-red-400">
                        {errors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-[50px]">
                  <p className="text-[#9c9c9ceb]">
                    ※ 12 or more characters consisting of half-width English
                    uppercase letters, lowercase English letters, and numbers
                  </p>
                  <p className="text-[#9c9c9ceb]">
                    ※ Must not be the same as email address
                  </p>
                </div>
                <div style={{ paddingTop: "15px" }}>
                  <button id="btn" style={{ color: "white" }}>
                    Change
                  </button>
                </div>
                {spinner == true && (
                  <div>
                    <Spinner
                      style={{
                        position: "absolute",
                        left: "40%",
                        top: "42%",
                      }}
                      size="lg"
                    />
                  </div>
                )}
              </div>
            </form>
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
