"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SignUp from "./components/SignUp";

export default function Auth() {
	const [authMode, setAuthMode] = useState("login");
	const router = useRouter();

	const handleSignUpSuccess = () => {
		router.push("/publisher");
	};

	const renderAuthComponent = () => {
		switch (authMode) {
			case "register":
				return <SignUp onModeChange={setAuthMode} onSuccess={handleSignUpSuccess} />;
			default:
				return <SignUp onModeChange={setAuthMode} onSuccess={handleSignUpSuccess} />;
		}
	};

	return <div className="auth-container">{renderAuthComponent()}</div>;
}
