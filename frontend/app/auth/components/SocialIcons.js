import React from "react";
import Image from "next/image";

const socialIcons = [
	{
		alt: "Facebook",
		src: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
	},
	{
		alt: "Google",
		src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png",
	},
	{
		alt: "Instagram",
		src: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
	},
];

const SocialIcons = () => {
	return (
		<div className="social-icons-container">
			{socialIcons.map((icon) => (
				<div key={icon.alt} className="social-icon">
					<Image src={icon.src} alt={icon.alt} width={30} height={30} style={{ objectFit: "contain" }} />
				</div>
			))}
		</div>
	);
};

export default SocialIcons;
