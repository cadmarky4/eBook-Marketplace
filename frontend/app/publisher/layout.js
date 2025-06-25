import "../globals.css";

import PublisherHeader from "@/components/layouts/PublisherHeader.js";
import PublisherFooter from "@/components/layouts/PublisherFooter.js";

// Fix the import path to use the correct location
import { AuthProvider } from "@/components/layouts/AuthContext";

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					<PublisherHeader />
					<main>{children}</main>
					<PublisherFooter />
				</AuthProvider>
			</body>
		</html>
	);
}
