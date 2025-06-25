"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/auth");
	}, [router]);

	return null;
}
