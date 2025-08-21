"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "next-auth/jwt";
import Cookies from "js-cookie";
import { useUser } from "@/src/utils/UserContext";
import { Spinner } from "@nextui-org/react";

export default function AuthRedirect() {
  const { login } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch("/api/auth/token");
      const data = await res.json();
      const { access_token, refresh_token } = data;

      if (access_token && refresh_token) {
        Cookies.set("access_token", access_token, { expires: 1 });
        Cookies.set("refresh_token", refresh_token, { expires: 7 });

        login(access_token, refresh_token);
        router.push("/chat");
      } else {
        router.push("/login");
      }
    };

    fetchToken();
  }, []);

  return (
    <div className="spinner">
      <div>
        <Spinner size="lg" />
      </div>
    </div>
  );
}
