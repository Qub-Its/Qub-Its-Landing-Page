<script>
  import { theme } from '../store/theme';
</script>

<nav class="navbar fixed-top">
  <div class="container">
    <a href="/" class="navbar-brand">
      <img src="/images/logo.png" alt="Logo" class="logo" />
    </a>
    <button on:click={() => theme.update(t => t === 'light' ? 'dark' : 'light')} class="toggle-btn py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700">
      Toggle Theme
    </button>
  </div>
</nav>

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #fff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>