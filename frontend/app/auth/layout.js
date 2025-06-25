import "../globals.css";
import { AuthProvider } from "@/components/layouts/AuthContext";

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					<main>{children}</main>
				</AuthProvider>
			</body>
		</html>
	);
}
