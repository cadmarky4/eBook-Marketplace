"use client";

import React, { useState } from "react";
import LogIn from "./components/LogIn";
import SignUp from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";

export default function Auth() {
	const [authMode, setAuthMode] = useState("login");

	const renderAuthComponent = () => {
		switch (authMode) {
			case "login":
				return <LogIn onModeChange={setAuthMode} />;
			case "register":
				return <SignUp onModeChange={setAuthMode} />;
			case "forgot-password":
				return <ForgotPassword onModeChange={setAuthMode} />;
			default:
				return <LogIn onModeChange={setAuthMode} />;
		}
	};

	return <div className="auth-container">{renderAuthComponent()}</div>;
}
