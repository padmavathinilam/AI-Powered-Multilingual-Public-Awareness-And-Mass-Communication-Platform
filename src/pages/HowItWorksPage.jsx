import Navbar from "../components/Navbar.jsx";
import HowItWorks from "../components/HowItWorks.jsx";
import Footer from "../components/Footer.jsx";

function HowItWorksPage() {
  return (
    <>
      <Navbar />

      <main className="how-it-works-page">
        <HowItWorks />
      </main>

      <Footer />
    </>
  );
}

export default HowItWorksPage;