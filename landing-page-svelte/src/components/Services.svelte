<script>
  export let services = [
    {
      icon: "ri-lightbulb-flash-fill",
      title: "Creative Solution Designs",
      description:
        "Our team of experts in different areas will always evaluate, define and offer the most creative and effective solutions.",
    },
    {
      icon: "ri-window-2-fill",
      title: "Web Development",
      description:
        "Anyone can code. Only a few will take the time to understand YOUR real needs and design a strategy that will solve the problem in the long term.",
    },
    {
      icon: "ri-award-fill",
      title: "Effective Communication",
      description:
        "Constant communication is key. Working together, your team and ours will achieve impressive results in record time.",
    },
    {
      icon: "ri-award-fill",
      title: "Save Time & Money",
      description:
        "We offer you the best value vs. price relationship. Top Quality software solutions at price rates that make you go wow.",
    },
  ];
</script>

<section class="services" id="service" aria-labelledby="services-heading">
  <div class="container">
    <h2 id="services-heading">Our Services</h2>
    <div class="cards">
      {#each services as service}
        <div class="card" role="region" aria-label={service.title}>
          <i class={service.icon} aria-hidden="true"></i>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .services {
    padding: 50px 20px;
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
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  .card i {
    font-size: 32px;
    color: #007bff;
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
</style>