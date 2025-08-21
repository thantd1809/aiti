"use client";
import { useRouter } from "next/navigation";
import Background_turn_top from "./BackgroundTurnTop";
import Background_turn_bottom from "./BackgroundTurnBottom";
import logo_sprite_black from "../../public/images/logo-sprite-black.png";
import AI_text_black from "../../public/images/AI-text-black.png";
import footer_image from "../../public/images/copyright-black.png";
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function Page() {
  const router = useRouter();

  const handleLogin = async (event: any) => {
    event.preventDefault();
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
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
      {/* <form className="mt-[100px] w-[700px] h-[300px]" style={{background:'rgba(253, 253, 253, 0.9)'}}> */}
      <div
        style={{ background: "rgba(253, 253, 253, 0.9)" }}
        className="mt-[100px] w-[700px] h-[250px] rounded-[30px]"
      >
        <div className="mt-[50px] text-center">
          <p className="font-bold text-4xl w-[600px] ml-[55px]">
            Your password change has been completed.
          </p>

          <p>You can now log into your account using your new password.</p>

          <div
            style={{ paddingTop: "15px", marginLeft: "22%", width: "400px" }}
          >
            <button id="btn" style={{ color: "white" }} onClick={handleLogin}>
              Log in
            </button>
          </div>
        </div>
      </div>
      {/* </form> */}
      <Background_turn_bottom />
      <div style={{ position: "fixed", bottom: 0, width: "100%" }}>
        <Image
          style={{ marginLeft: "auto", marginRight: "auto" }}
          src={footer_image}
          alt=""
        />
      </div>
    </div>
  );
}
