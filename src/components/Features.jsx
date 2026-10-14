function Features() {
  const features = [
    {
      icon: "🌐",
      title: "Multilingual",
      description:
        "Create and deliver public awareness messages in multiple languages, including regional languages."
    },

    {
      icon: "🤖",
      title: "AI-Powered Content",
      description:
        "Use artificial intelligence to generate clear, informative and engaging awareness content."
    },

    {
      icon: "📢",
      title: "Multi-Channel Communication",
      description:
        "Reach people through different communication channels such as SMS, email, notifications and web."
    },

    {
      icon: "📊",
      title: "Campaign Analytics",
      description:
        "Track campaign delivery, audience engagement and communication performance using analytics."
    },

    {
      icon: "🎯",
      title: "Audience Segmentation",
      description:
        "Target specific groups based on location, language, age group and other audience characteristics."
    },

    {
      icon: "⚡",
      title: "Real-Time Delivery",
      description:
        "Deliver important public awareness messages quickly during emergencies and important events."
    }
  ];

  return (
    <section id="features" className="features">

      {/* Section Heading */}

      <div className="section-heading">

        <span>FEATURES</span>

        <h2>
          Everything You Need for
          <br />
          Smarter Public Communication
        </h2>

        <p>
          Powerful AI-driven features for creating,
          managing and delivering public awareness
          campaigns.
        </p>

      </div>


      {/* Feature Cards */}

      <div className="feature-grid">

        {features.map((feature, index) => (

          <div
            className="feature-card"
            key={index}
          >

            <div className="feature-icon">
              {feature.icon}
            </div>

            <h3>
              {feature.title}
            </h3>

            <p>
              {feature.description}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}

export default Features;