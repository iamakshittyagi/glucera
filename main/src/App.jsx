import maintenanceImg from "./assets/maintenance.webp";
export default function App() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      margin: 0,
      background: "#fff"
    }}>
      <img
        src={maintenanceImg}
        alt="Good things are on the way"
        style={{ width: "100%", maxWidth: "900px" }}
      />
    </div>
  );
}