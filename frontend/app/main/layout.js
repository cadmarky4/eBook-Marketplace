import "../globals.css";

import Header from "@/components/layouts/Header.js";
import Footer from "@/components/layouts/Footer.js";

// Fix the import path to use the correct location
import { AuthProvider } from "@/components/layouts/AuthContext";

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					<Header />
					<main>{children}</main>
					<Footer />
				</AuthProvider>
			</body>
		</html>
	);
}
