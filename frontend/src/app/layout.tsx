import "../styles/globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "../utils/UserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <div
            className="flex flex-col"
            style={{ background: "#EFEFEE", minHeight: "100vh" }}
          >
            <ToastContainer />
            {children}
          </div>
        </body>
      </html>
    </UserProvider>
  );
}
