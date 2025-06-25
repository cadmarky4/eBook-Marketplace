import React from "react";

export const CategoryTab = React.memo(({ category, isActive, onClick }) => (
	<button onClick={onClick} className={`category-tab ${isActive ? "active" : ""}`}>
		{category}
	</button>
));

CategoryTab.displayName = "CategoryTab";
