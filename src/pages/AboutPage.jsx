import Navbar from "../components/Navbar.jsx";
import About from "../components/About.jsx";
import Footer from "../components/Footer.jsx";

function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <About />
      </main>

      <Footer />
    </>
  );
}

export default AboutPage;