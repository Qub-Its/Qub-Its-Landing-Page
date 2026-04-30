<script>
  export let title = "We are Qub-its inc.";
  export let subtitle = "All the tech help you need in a single place.";
  export let ctaText = "I need Tech Help!";
</script>

<section class="hero" style="background-image: url('/images/hero-6-img.jpg')" aria-label="Hero section">
  <div class="overlay" aria-hidden="true"></div>
  <div class="content">
    <h1>{title}</h1>
    <p>{subtitle}</p>
    <a href="#contact" class="btn" role="button" aria-label="Contact us">{ctaText}</a>
  </div>
</section>

<style>
  .hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60vh;
    background-size: cover;
    background-position: center;
    color: white;
    text-align: center;
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }
  .content {
    position: relative;
  }
  .btn {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
</style>