import Navbar from "../components/Navbar.jsx";
import Features from "../components/Features.jsx";
import Footer from "../components/Footer.jsx";

function FeaturesPage() {
  return (
    <>
      <Navbar />

      <main className="features-page">
        <Features />
      </main>

      <Footer />
    </>
  );
}

export default FeaturesPage;