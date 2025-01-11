<script>
  const icons = {
    console: 'icons/rectangle-horizontal.svg',
    ai: 'icons/square.svg',
    tasks: 'icons/triangle.svg',
    a: 'icons/circle.svg'
  };
</script>

<nav class="bottom-navbar">
  <a href="/console">
    <img src={icons.console} alt="console" />
  </a>
  <a href="/ai">
    <img src={icons.ai} alt="ai" />
  </a>
  <a href="/tasks">
    <img src={icons.tasks} alt="tasks" />
  </a>
  <a href="/a">
    <img src={icons.a} alt="a" />
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