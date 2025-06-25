"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page serves as a redirect to the main page of the application.
 * It is used to ensure that users are redirected to the main content
 * when they access the root URL.
 */

export default function Page() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/main");
	}, [router]);

	return null;
}
