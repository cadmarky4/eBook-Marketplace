"use client";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import "./subscription.css";

const SubscriptionPage = () => {
	const [billingCycle, setBillingCycle] = useState("yearly");
	const [selectedPlan, setSelectedPlan] = useState("premium");

	const plans = [
		{
			id: "basic",
			name: "Basic",
			price: 150,
			features: ["Access to 1000+ e-books", "Offline reading", "Basic customer support"],
			badge: null,
		},
		{
			id: "standard",
			name: "Standard",
			price: 250,
			features: ["Access to 5000+ e-books", "Offline reading", "Priority customer support"],
			badge: "Popular",
		},
		{
			id: "premium",
			name: "Premium",
			price: 500,
			features: ["Access to all e-books", "Offline reading", "Exclusive content", "24/7 customer support"],
			badge: "Best Value",
		},
	];

	const getPrice = (price) => {
		if (billingCycle === "monthly") return price;
		return Math.round(price * 12 * 0.85); // 15% discount for yearly
	};

	const getLabel = () => (billingCycle === "monthly" ? "/mo" : "/yr");

	return (
		<>
			<Head>
				<title>Subscription</title>
			</Head>

			<div className="subscription-container">
				<div className="subscription-header">
					<h1 className="subscription-title">Choose Your Plan</h1>
					<p className="subscription-subtitle">Unlock unlimited reading with our flexible subscription options</p>
				</div>

				<nav className="billing-toggle" aria-label="Billing cycle selection">
					<button className={`billing-btn ${billingCycle === "monthly" ? "selected" : ""}`} onClick={() => setBillingCycle("monthly")}>
						Monthly
					</button>
					<button className={`billing-btn ${billingCycle === "yearly" ? "selected" : ""}`} onClick={() => setBillingCycle("yearly")}>
						Yearly
					</button>
				</nav>

				<div className="plans">
					{plans.map(({ id, name, price, features, badge }) => {
						const isSelected = selectedPlan === id;
						return (
							<article key={id} onClick={() => setSelectedPlan(id)} className={`plan-card ${id === "premium" ? "premium" : ""} ${isSelected ? "selected" : ""}`}>
								<div className="plan-header">
									<span>{name}</span>
									{badge && <span className={`badge ${id === "premium" ? "premium" : ""}`}>{badge}</span>}
								</div>
								<div className="plan-price">
									₱{getPrice(price)}
									<span style={{ fontWeight: 400, fontSize: "1rem", marginLeft: 4 }}>{getLabel()}</span>
								</div>
								<ul className="features">
									{features.map((feature, i) => (
										<li key={i}>
											<i className="bi bi-check-lg"></i>
											{feature}
										</li>
									))}
								</ul>
								{isSelected && <div className="selected-plan-overlay" />}
							</article>
						);
					})}
				</div>

				<div className="btn-group">
					<button className="subscription-btn free-trial" onClick={() => alert("Starting 7-day free trial")}>
						7-Day Free Trial
					</button>
					<Link
						href={{
							pathname: "/payment",
							query: { plan: selectedPlan, cycle: billingCycle },
						}}
					>
						<button className="subscription-btn purchase">Purchase</button>
					</Link>
				</div>

				<section className="faq-section">
					<h3 className="faq-title">Frequently Asked Questions</h3>

					<div className="faq-item">
						<i className="bi bi-calendar-event faq-icon"></i>
						<div className="faq-content">
							<strong>When will I be billed?</strong>
							<p>You&apos;ll be billed immediately upon subscribing and then on a monthly or annual basis depending on your selected plan.</p>
						</div>
					</div>

					<div className="faq-item">
						<i className="bi bi-x-circle faq-icon" style={{ color: "#e03131" }}></i>
						<div className="faq-content">
							<strong>Can I cancel anytime?</strong>
							<p>Yes! You can cancel anytime in your account settings. You&apos;ll retain access until the end of your billing period.</p>
						</div>
					</div>

					<div className="faq-item">
						<i className="bi bi-arrow-repeat faq-icon"></i>
						<div className="faq-content">
							<strong>Will I be charged automatically?</strong>
							<p>Yes. All plans auto-renew, but we&apos;ll notify you in advance before any renewal.</p>
						</div>
					</div>

					<div className="faq-item">
						<i className="bi bi-receipt faq-icon"></i>
						<div className="faq-content">
							<strong>Do you provide receipts?</strong>
							<p>Receipts are automatically emailed to you after every successful payment.</p>
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default SubscriptionPage;
