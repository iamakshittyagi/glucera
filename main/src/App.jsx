export default function App() {
  return (
    <div style={styles.page}>
      {/* Space illustration */}
      <div style={styles.spaceBlob}>
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            ...styles.star,
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
          }} />
        ))}

        {/* Planet 1 - teal */}
        <div style={styles.planet1}>
          <div style={styles.planet1Ring} />
        </div>

        {/* Planet 2 - blue */}
        <div style={styles.planet2}>
          <div style={styles.planet2Ring} />
        </div>

        {/* Planet 3 - purple top right */}
        <div style={styles.planet3} />

        {/* Text */}
        <div style={styles.textBox}>
          <h1 style={styles.title}>Good things are on the way</h1>
          <p style={styles.subtitle}>
            Hi there! Our site is undergoing a maintenance right now.<br />
            Please come back later. Thank you for your patience.
          </p>
        </div>
      </div>

      {/* Bottom white area */}
      <div style={styles.bottomArea}>
        {/* Blue puddle */}
        <div style={styles.puddle} />

        {/* Ladder */}
        <div style={styles.ladder}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.ladderRung} />
          ))}
          <div style={styles.ladderLeft} />
          <div style={styles.ladderRight} />
        </div>

        {/* Wrench */}
        <div style={styles.wrench}>
          <div style={styles.wrenchHead} />
          <div style={styles.wrenchHandle} />
        </div>

        {/* Box */}
        <div style={styles.box}>
          <div style={styles.boxTop} />
          <div style={styles.boxStripe} />
        </div>

        {/* Tape */}
        <div style={styles.tape} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
  },
  spaceBlob: {
    background: "linear-gradient(160deg, #3b3f9e 0%, #5c6bc0 40%, #7986cb 70%, #fff 100%)",
    borderRadius: "0 0 60% 60% / 0 0 40% 40%",
    minHeight: "55vh",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    background: "#fff",
    borderRadius: "50%",
    opacity: 0.8,
  },
  planet1: {
    position: "absolute",
    top: "15%",
    left: "5%",
    width: "100px",
    height: "100px",
    background: "linear-gradient(135deg, #4dd0e1, #26c6da)",
    borderRadius: "50%",
  },
  planet1Ring: {
    position: "absolute",
    top: "40%",
    left: "-20%",
    width: "140%",
    height: "20%",
    border: "3px solid #80deea",
    borderRadius: "50%",
    transform: "rotateX(60deg)",
  },
  planet2: {
    position: "absolute",
    top: "40%",
    right: "28%",
    width: "55px",
    height: "55px",
    background: "linear-gradient(135deg, #42a5f5, #1e88e5)",
    borderRadius: "50%",
  },
  planet2Ring: {
    position: "absolute",
    top: "35%",
    left: "-25%",
    width: "150%",
    height: "25%",
    border: "2px solid #90caf9",
    borderRadius: "50%",
    transform: "rotateX(60deg)",
  },
  planet3: {
    position: "absolute",
    top: "-10%",
    right: "-3%",
    width: "160px",
    height: "160px",
    background: "linear-gradient(135deg, #ce93d8, #ab47bc)",
    borderRadius: "50%",
    opacity: 0.7,
  },
  textBox: {
    textAlign: "center",
    zIndex: 2,
    padding: "20px",
    marginTop: "-40px",
  },
  title: {
    color: "#fff",
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "16px",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
  bottomArea: {
    position: "relative",
    height: "45vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  puddle: {
    position: "absolute",
    bottom: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "300px",
    height: "100px",
    background: "linear-gradient(180deg, #7986cb, #5c6bc0)",
    borderRadius: "50%",
    opacity: 0.4,
  },
  ladder: {
    position: "absolute",
    bottom: "15%",
    left: "50%",
    transform: "translateX(-50%) rotate(-5deg)",
    width: "60px",
    height: "200px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
  },
  ladderLeft: {
    position: "absolute",
    left: "5px",
    top: 0,
    width: "8px",
    height: "100%",
    background: "#90caf9",
    borderRadius: "4px",
  },
  ladderRight: {
    position: "absolute",
    right: "5px",
    top: 0,
    width: "8px",
    height: "100%",
    background: "#90caf9",
    borderRadius: "4px",
  },
  ladderRung: {
    width: "50px",
    height: "6px",
    background: "#64b5f6",
    borderRadius: "3px",
    zIndex: 1,
  },
  wrench: {
    position: "absolute",
    bottom: "25%",
    left: "22%",
    transform: "rotate(-30deg)",
  },
  wrenchHead: {
    width: "40px",
    height: "40px",
    border: "8px solid #b0bec5",
    borderRadius: "50%",
    background: "transparent",
  },
  wrenchHandle: {
    width: "10px",
    height: "60px",
    background: "#b0bec5",
    margin: "0 auto",
    borderRadius: "5px",
  },
  box: {
    position: "absolute",
    bottom: "28%",
    right: "22%",
    width: "55px",
    height: "55px",
    background: "#c5cae9",
    borderRadius: "6px",
  },
  boxTop: {
    width: "100%",
    height: "12px",
    background: "#9fa8da",
    borderRadius: "6px 6px 0 0",
  },
  boxStripe: {
    width: "8px",
    height: "43px",
    background: "#9fa8da",
    margin: "0 auto",
  },
  tape: {
    position: "absolute",
    bottom: "22%",
    right: "15%",
    width: "40px",
    height: "40px",
    border: "8px solid #b0bec5",
    borderRadius: "50%",
    background: "transparent",
  },
};