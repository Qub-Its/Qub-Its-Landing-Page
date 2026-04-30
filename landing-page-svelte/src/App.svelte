<script>
  import Header from "./components/Header.svelte";
  import Hero from "./components/Hero.svelte";
  import About from "./components/About.svelte";
  import Services from "./components/Services.svelte";
  import Portfolio from "./components/Portfolio.svelte";
  import Projects from "./components/Projects.svelte";
  import Contact from "./components/Contact.svelte";
  import Footer from "./components/Footer.svelte";
</script>

<div id="app">
  <Header />
  <Hero />
  <About />
  <Services />
  <Portfolio />
  <Projects />
  <Contact />
  <Footer />
</div>

<style>
  #app {
    margin: 0;
    padding: 0;
  }
</style>