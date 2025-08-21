import Image from "next/image";
import footer_image from "../../public/images/copyright-black.png";
export default function Footer() {
  return (
    <div
      style={{ bottom: 0, width: "100%", marginBottom: 0 }}
      className=" inset-x-0 bottom-0 flex fixed"
    >
      <Image
        style={{ marginLeft: "auto", marginRight: "auto" }}
        src={footer_image}
        alt=""
      />
    </div>
  );
}
