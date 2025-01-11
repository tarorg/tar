<script>
  const icons = {
    home: 'icons/rectangle-horizontal.svg',
    search: 'icons/square.svg',
    user: 'icons/triangle.svg',
    settings: 'icons/circle.svg'
  };
</script>

<nav class="bottom-navbar">
  <a href="/">
    <img src={icons.home} alt="Home" />
  </a>
  <a href="/search">
    <img src={icons.search} alt="Search" />
  </a>
  <a href="/profile">
    <img src={icons.user} alt="Profile" />
  </a>
  <a href="/settings">
    <img src={icons.settings} alt="Settings" />
  </a>
</nav>

<style>
  .bottom-navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: white;
    display: flex;
    justify-content: space-around;
    padding: 12px 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    border-top: 1px solid #eaeaea;
  }

  .bottom-navbar a {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #333;
    text-decoration: none;
  }

  .bottom-navbar img {
    width: 24px;
    height: 24px;
  }
</style>