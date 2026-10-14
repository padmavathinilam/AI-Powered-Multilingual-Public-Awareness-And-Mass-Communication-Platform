import { Link } from "react-router-dom";

function CTA() {
  return (
    <section className="cta-section">

      <div className="cta-content">

        <span>
          GET STARTED
        </span>

        <h2>
          Make Public Communication
          <br />
          Smarter With AI
        </h2>

        <p>
          Create multilingual awareness campaigns
          and reach your audience more effectively.
        </p>

        <Link
          to="/register"
          className="cta-button"
        >
          Start Building
        </Link>

      </div>

    </section>
  );
}

export default CTA;