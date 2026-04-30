<script>
  import { onMount } from 'svelte';

  let projects = [];

  onMount(async () => {
    const response = await fetch('/src/data/projects.json');
    projects = await response.json();
  });
</script>

<section class="projects" id="projects" aria-labelledby="projects-section">
  <div class="container">
    <h2 id="projects-section">Our Projects</h2>
    <div class="cards">
      {#each projects as project}
        <div class="card" role="region" aria-label={project.title}>
          <img src={project.icon} alt={`Icon for ${project.title}`} class="icon" />
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <a href={project.link} class="btn" aria-label={`Learn more about ${project.title}`}>Learn More</a>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .projects {
    padding: 50px 20px;
    background-color: #f9f9f9;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 30px;
  }
  .card {
    padding: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  .card .icon {
    width: 60px;
    height: auto;
    margin-bottom: 15px;
  }
  .card h3 {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: bold;
  }
  .card p {
    font-size: 14px;
    color: #555;
  }
  .btn {
    margin-top: 15px;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  .btn:hover {
    background-color: #0056b3;
  }
</style>