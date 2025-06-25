import React from "react";

export default function Loading() {
	return (
		<div className="loading-container">
			<div className="text-center">
				<div className="spinner" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
				<p className="loading-text">Loading books...</p>
			</div>
		</div>
	);
}
