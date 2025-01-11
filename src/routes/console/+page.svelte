<script>
    import BottomNavbar from '$lib/BottomNavbar.svelte';
    import Topbar from '$lib/Topbar.svelte';
    import { selectedNav } from '$lib/stores/navigationStore';
    import SpaceSection from '$lib/components/sections/Space.svelte';
    import SalesSection from '$lib/components/sections/Sales.svelte';
    import ProductsSection from '$lib/components/sections/Products.svelte';
    import PostsSection from '$lib/components/sections/Posts.svelte';
    import LinksSection from '$lib/components/sections/Links.svelte';
    import PathSection from '$lib/components/sections/Path.svelte';
    import AnalyticsSection from '$lib/components/sections/Analytics.svelte';
    import SettingsSection from '$lib/components/sections/Settings.svelte';
    
    let currentSection;
    
    selectedNav.subscribe(value => {
        currentSection = value || '🎮';
    });
</script>

<Topbar />

<div class="content">
    {#if currentSection === '🌌'}
        <SpaceSection />
    {:else if currentSection === '🎈'}
        <SalesSection />
    {:else if currentSection === '📦'}
        <ProductsSection />
    {:else if currentSection === '🥁'}
        <PostsSection />
    {:else if currentSection === '🔗'}
        <LinksSection />
    {:else if currentSection === '〰️'}
        <PathSection />
    {:else if currentSection === '📈'}
        <AnalyticsSection />
    {:else if currentSection === '⚙️'}
        <SettingsSection />
    {:else}
        <div class="section">
            <h2>Console Home</h2>
            <p>Welcome to your dashboard</p>
        </div>
    {/if}
</div>

<BottomNavbar />

<style>
    .content {
        padding: 80px 20px 70px 20px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .section {
        padding: 20px;
    }

    h2 {
        font-size: 24px;
        margin-bottom: 16px;
    }

    p {
        color: #666;
    }
</style>