<script>
    let activeTab = 'core';
    const topRowTabs = ['Core', 'Options', 'Properties', 'Variants'];
    const bottomRowTabs = ['Branding'];
</script>

<div class="section">
    <h2>Products</h2>
    
    <div class="tabs-container">
        <div class="tabs-scroll">
            <div class="tabs">
                {#each topRowTabs as tab}
                    <button 
                        class="tab-button" 
                        class:active={activeTab === tab.toLowerCase()} 
                        on:click={() => activeTab = tab.toLowerCase()}>
                        {tab}
                    </button>
                {/each}
            </div>
            <div class="tabs bottom-row">
                {#each bottomRowTabs as tab}
                    <button 
                        class="tab-button" 
                        class:active={activeTab === tab.toLowerCase()} 
                        on:click={() => activeTab = tab.toLowerCase()}>
                        {tab}
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="tab-content">
        {#if activeTab === 'core'}
            <div class="notion-table">
                <div class="table-row header">
                    <div class="table-cell">Property</div>
                    <div class="table-cell">Value</div>
                </div>
                <div class="table-row">
                    <div class="table-cell">
                        <div class="property-name">Product Name</div>
                    </div>
                    <div class="table-cell">
                        <input type="text" placeholder="Enter product name">
                    </div>
                </div>
                <div class="table-row">
                    <div class="table-cell">
                        <div class="property-name">SKU</div>
                    </div>
                    <div class="table-cell">
                        <input type="text" placeholder="Enter SKU">
                    </div>
                </div>
            </div>
        {:else if activeTab === 'options'}
            <div class="notion-table">
                <div class="table-row">
                    <div class="table-cell">Size Options</div>
                    <div class="table-cell">
                        <input type="text" placeholder="Add size options">
                    </div>
                </div>
                <div class="table-row">
                    <div class="table-cell">Color Options</div>
                    <div class="table-cell">
                        <input type="text" placeholder="Add color options">
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .section {
        padding: 20px;
        width: 100%;
    }
    .tabs-container {
        margin: 16px 0 24px 0;
        width: 100%;
    }
    .tabs-scroll {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;  /* Firefox */
        -ms-overflow-style: none;  /* IE and Edge */
    }
    .tabs-scroll::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
    }
    .tabs {
        display: inline-flex;
        gap: 1px;
        background: #f0f0f0;
        padding: 4px;
        border-radius: 8px;
        margin-bottom: 8px;
        white-space: nowrap;
    }
    .tab-button {
        padding: 6px 12px;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
        color: #4a4a4a;
        transition: all 0.2s;
    }
    .tab-button.active {
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        color: #000;
    }
    .notion-table {
        width: 100%;
        border-spacing: 0;
        margin-top: 8px;
    }
    .table-row {
        display: flex;
        border-bottom: 1px solid #eee;
        min-height: 32px;
    }
    .table-row.header {
        font-weight: 500;
        color: #6b6b6b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .table-cell {
        flex: 1;
        padding: 8px;
        min-width: 150px;
        display: flex;
        align-items: center;
    }
    .property-name {
        font-size: 14px;
        color: #37352f;
    }
    input {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        font-size: 14px;
        background: transparent;
        transition: all 0.2s;
    }
    input:hover {
        background: rgba(55, 53, 47, 0.08);
    }
    input:focus {
        background: white;
        border-color: #37352f33;
        outline: none;
    }
    @media (max-width: 640px) {
        .section {
            padding: 16px;
        }
        .table-cell {
            min-width: 120px;
        }
    }
</style>
