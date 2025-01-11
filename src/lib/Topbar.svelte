<script>
  let searchTerm = '';
  let isDropdownOpen = false;
  let selectedIcon = '🎮';

  const menuItems = [
    { icon: '🌌', text: 'Space' },
    { icon: '🎈', text: 'Sales' },
    { icon: '📦', text: 'Products' },
    { icon: '🥁', text: 'Posts' },
    { icon: '🔗', text: 'Links' },
    { icon: '〰️', text: 'Path' },
    { icon: '📈', text: 'Analytics' },
    { icon: '⚙️', text: 'Settings' }
  ];

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function selectItem(icon) {
    selectedIcon = icon;
    isDropdownOpen = false;
  }
</script>

<div class="topbar-container">
  <div class="topbar">
    <button class="icon" on:click={toggleDropdown}>{selectedIcon}</button>
    <input type="text" placeholder="Search..." bind:value={searchTerm} class="search-bar"/>
  </div>
  
  {#if isDropdownOpen}
    <div class="dropdown">
      {#each menuItems as item}
        <div class="dropdown-item" on:click={() => selectItem(item.icon)}>
          {item.icon} {item.text}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .topbar-container {
    font-family: 'General Sans', sans-serif;
    position: fixed;
    width: 100%;
    max-width: 100vw;
    left: 0;
    right: 0;
    top: 0;
    margin: 0;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    z-index: 1000;
  }

  .topbar {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background-color: white;
    width: 100%;
    box-sizing: border-box;
    gap: 16px;
  }

  .icon {
    font-size: 24px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .icon:hover {
    background-color: #f5f5f5;
    transform: scale(1.05);
  }

  .search-bar {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    background-color: #f5f5f5;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .search-bar:focus {
    outline: none;
    background-color: #f0f0f0;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }

  @media (max-width: 600px) {
    .topbar {
      padding: 10px;
    }

    .icon {
      font-size: 20px;
    }
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border: none;
    border-top: 1px solid #f0f0f0;
    z-index: 1000;
    width: 100%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    display: block;
  }

  .dropdown-item {
    padding: 14px 20px;
    border-bottom: 1px solid #f5f5f5;
    transition: all 0.2s ease;
  }

  .dropdown-item:hover {
    background-color: #f8f8f8;
    cursor: pointer;
    padding-left: 24px;
  }
</style>