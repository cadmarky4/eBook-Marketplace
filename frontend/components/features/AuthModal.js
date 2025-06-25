import React from "react";

const Modal = ({ isOpen, onClose, children, size = "md" }) => {
	if (!isOpen) return null;

	return (
		<div
			className="modal-overlay"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.5)",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				zIndex: 1050,
			}}
		>
			<div
				className={`modal-dialog modal-${size}`}
				style={{
					margin: "1.75rem",
					maxWidth: size === "sm" ? "300px" : "500px",
					width: "100%",
				}}
			>
				<div
					className="modal-content border-0 shadow-lg"
					style={{
						borderRadius: "20px",
						overflow: "hidden",
						backgroundColor: "#ffffff",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
};

export const ModalHeader = ({ onClose, children, style = {} }) => (
	<div className="modal-header border-0 pb-0" style={{ ...style, padding: "1rem" }}>
		{children}
		{onClose && (
			<button
				type="button"
				className="btn-close"
				onClick={onClose}
				style={{
					filter: "none",
					color: "#000",
					fontSize: "1.2rem",
					opacity: "0.7",
					background: "transparent",
					border: "none",
					cursor: "pointer",
				}}
			>
				×
			</button>
		)}
	</div>
);

export const ModalBody = ({ children, style = {} }) => (
	<div className="modal-body text-center p-4" style={style}>
		{children}
	</div>
);

export default Modal;
