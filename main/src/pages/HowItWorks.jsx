import React from "react";
import Navbar from "../components/Navbar";
import "./HowItWorks.css";
import CBMIcon from "../assets/Icons/GLUCERACBM.png";
import AIBotIcon from "../assets/Icons/GLUCERAAIBOT.png";
import TimeIcon from "../assets/Icons/GLUCERATIME.png";
import SOSIcon from "../assets/Icons/GLUCERASOS.png";
import FoodIcon from "../assets/Icons/GLUCERAFOOD.png";
import GraphIcon from "../assets/Icons/GLUCERAGRAPH.png";

const steps = [
  { number: "01", icon: CBMIcon,    title: "Upload Your CGM Data", desc: "Export your continuous glucose monitor data as a CSV file. Glucera reads your glucose history, meal times, insulin doses, and exercise patterns." },
  { number: "02", icon: AIBotIcon,  title: "AI Analyses Your Patterns", desc: "Our model studies your personal trends and time-of-day patterns, how your body responds to insulin, exercise, and meals then predicts the results based on that." },
  { number: "03", icon: TimeIcon,   title: "Predicts a Crash Before It Happens", desc: "Glucera forecasts hypoglycaemic episodes minutes before they occur, giving you and your caregiver time to act - not just react." },
  { number: "04", icon: SOSIcon,    title: "Sends an Instant SOS Alert", desc: "When risk is high, Glucera sends a real-time push notification to your caregiver's phone, even at 2am, so help is always on the way." },
  { number: "05", icon: FoodIcon,   title: "Tells You Exactly What to Eat", desc: "Glucera gives you advices \"Have 3 glucose tablets or a glass of juice now.\" in order to assist you with your daily sugar spikes and improve your life style better, day by day." },
  { number: "06", icon: GraphIcon,  title: "Learns and Reports Over Time", desc: "Weekly graphical reports show your patterns, crash history, and improvements — ready to share with your doctor." },
];

const faqs = [
  {
    q: "Does Glucera replace my CGM device?",
    a: "No. Glucera works alongside your existing CGM. You export the data from your device and upload it to Glucera for AI-powered predictions.",
  },
  {
    q: "How does it know if a glucose rise is from food or a real spike?",
    a: "If glucose rises by 20mg/dL or more within a short window and a meal was logged, Glucera classifies it as a food or exercise spike and does not trigger an alert.",
  },
  {
    q: "How does the caregiver receive alerts?",
    a: "Your caregiver visits glucera.vercel.app/caregiver on their phone and registers once. From then on, they receive instant push notifications whenever the risk level is high.",
  },
  {
    q: "Is my data stored or shared?",
    a: "No. Your CSV data is safe with us and never sent to any server without your consent.",
  },
];

export default function HowItWorks() {
  return (
    <div className="hiw-page">
      <Navbar />
      <div className="hiw-container">

        {/* Hero */}
        <div className="hiw-hero">
          <p className="hiw-eyebrow">· How It Works ·</p>
          <h1 className="hiw-title">Predict. Alert. Protect.</h1>
          <p className="hiw-sub">
            Glucera goes beyond glucose readings :- factoring in medication schedules,
            lifestyle patterns, and time-of-day trends to predict hypoglycaemic episodes
            before they happen.
          </p>
           Remember, help is always on the way and you do not walk alone in this journey.
        </div>

        {/* Steps */}
        <div className="hiw-steps">
          {steps.map((s, i) => (
            <div className="hiw-step-card" key={i}>
              <div className="hiw-step-left">
                <span className="hiw-step-number">{s.number}</span>
                <div className="hiw-step-line" />
              </div>
              <div className="hiw-step-right">
                <img className="hiw-step-icon" src={s.icon} alt={s.title} />
                <h3 className="hiw-step-title">{s.title}</h3>
                <p className="hiw-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Smart detection callout */}
        <div className="hiw-callout">
          <div className="hiw-callout-icon">🍽️</div>
          <div>
            <h3 className="hiw-callout-title">Smart Food & Exercise Detection</h3>
            <p className="hiw-callout-desc">
              Glucera automatically detects when you've eaten or exercised by identifying
              glucose spikes of 20mg/dL or more. It won't alert you for normal rises —
              only genuine predicted crashes trigger the SOS.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="hiw-faq-section">
          <h2 className="hiw-faq-title">Frequently Asked Questions</h2>
          <div className="hiw-faqs">
            {faqs.map((f, i) => (
              <div className="hiw-faq-card" key={i}>
                <p className="hiw-faq-q">{f.q}</p>
                <p className="hiw-faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}