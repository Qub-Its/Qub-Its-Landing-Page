<script>
  import { onMount } from 'svelte';

  // Proyectos cargados dinámicamente
  let projects = [];

  onMount(async () => {
    const response = await fetch('/src/data/portfolio.json');
    projects = await response.json();
  });
</script>

<section class="portfolio" id="portfolio" aria-labelledby="portfolio-section">
  <div class="container">
    <h2 id="portfolio-section">Our Work</h2>
    <div class="grid">
      {#each projects as project}
        <div class="card" role="region" aria-label={project.title}>
          <img src={project.image} alt={`Image of ${project.title}`} />
          <div class="info">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <a href={project.link} target="_blank" aria-label={`Learn more about ${project.title}`}>Learn More</a>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .portfolio {
    padding: 50px 20px;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 30px;
  }
  .card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  .card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  .info {
    padding: 20px;
  }
  .info h3 {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: bold;
  }
  .info p {
    font-size: 14px;
    color: #555;
  }
  .info a {
    display: inline-block;
    margin-top: 10px;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  .info a:hover {
    background: #0056b3;
  }
</style>