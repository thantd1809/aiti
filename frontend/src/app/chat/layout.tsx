"use client";

import React, { useState } from "react";

import ChatLayout from "@/src/components/ChatLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChatLayout>{children}</ChatLayout>
    </>
  );
}
