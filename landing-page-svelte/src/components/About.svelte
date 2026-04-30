<script>
  export let title = "About Us";
  export let subtitle = "We are what you need.";
  export let vision = "To be the leading innovator for software solutions that drive successful business outcomes.";
  export let mission = "To deliver outstanding software solutions to our customers, enabling them to achieve their goals and create competitive advantages.";
</script>

<section class="about" id="about" aria-labelledby="about-heading">
  <div class="container">
    <h2 id="about-heading">{title}</h2>
    <div class="content">
      <div class="image">
        <img src="/images/aboutme.jpg" alt="A representation of teamwork and innovation" />
      </div>
      <div class="text">
        <h3>{subtitle}</h3>
        <p>{vision}</p>
        <p>{mission}</p>
        <a href="#contact" class="btn" aria-label="Contact us about our vision and mission">Contact Us</a>
      </div>
    </div>
  </div>
</section>

<style>
  .about {
    padding: 50px 20px;
    background-color: #f9f9f9;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  h2 {
    text-align: center;
    margin-bottom: 20px;
  }
  .content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
  }
  .image img {
    max-width: 100%;
    border-radius: 8px;
  }
  .text {
    flex: 1;
  }
  .btn {
    display: inline-block;
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
</style>