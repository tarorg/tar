<script>
    let currentTab = 'Core';
    const tabs = ['Core', 'Options', 'Properties', 'Variants', 'Branding'];
    
    // Array to store preview URLs
    let previewImages = Array(5).fill(null);

    // Handle file upload
    function handleFileUpload(event, index) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImages[index] = e.target.result;
                previewImages = [...previewImages]; // trigger reactivity
            };
            reader.readAsDataURL(file);
        }
    }
</script>

<section class="w-full">
    <div class="tabs-container">
        <nav class="tabs-header" role="tablist">
            {#each tabs as tab}
                <button
                    role="tab"
                    aria-selected={currentTab === tab}
                    class="tab-button"
                    class:active={currentTab === tab}
                    on:click={() => currentTab = tab}
                >
                    {tab}
                </button>
            {/each}
        </nav>

        <div class="tab-content">
            {#if currentTab === 'Core'}
                <div class="tab-panel" role="tabpanel">
                    <div class="upload-boxes">
                        {#each previewImages as preview, i}
                            <div class="upload-box">
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="upload-{i}"
                                    on:change={(e) => handleFileUpload(e, i)}
                                    class="hidden-input"
                                />
                                <label for="upload-{i}" class="upload-label">
                                    {#if preview}
                                        <img src={preview} alt="Preview {i + 1}" class="preview-image" />
                                    {:else}
                                        <span class="upload-icon">+</span>
                                    {/if}
                                </label>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if currentTab === 'Options'}
                <div class="tab-panel" role="tabpanel">Options content here</div>
            {:else if currentTab === 'Properties'}
                <div class="tab-panel" role="tabpanel">Properties content here</div>
            {:else if currentTab === 'Variants'}
                <div class="tab-panel" role="tabpanel">Variants content here</div>
            {:else if currentTab === 'Branding'}
                <div class="tab-panel" role="tabpanel">Branding content here</div>
            {/if}
        </div>
    </div>
</section>

<style>
    .tabs-container {
        width: 100%;
        margin: 1rem 0; /* Reduced from 2rem to 1rem */
        overflow-x: auto; /* Enable horizontal scroll if needed */
    }

    .tabs-header {
        display: flex;
        gap: 0.25rem; /* Reduced from 0.5rem */
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        min-width: min-content; /* Prevents tabs from shrinking too much */
    }

    .tab-button {
        padding: 0.75rem 1rem; /* Reduced horizontal padding from 1.5rem */
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        color: #64748b;
        white-space: nowrap; /* Prevent text wrapping inside buttons */
        font-weight: 400; /* Regular weight for inactive tabs */
        font-size: 1.125rem; /* Increased by 2px from default */
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .tabs-header {
            gap: 0.125rem; /* Reduced from 0.25rem */
        }

        .tab-button {
            padding: 0.5rem 0.75rem;
            font-size: 1rem; /* Increased by 2px from 0.875rem */
        }
    }

    @media (max-width: 480px) {
        .tabs-container {
            margin: 0.5rem 0; /* Reduced from 1rem to 0.5rem */
        }

        .tabs-header {
            gap: 0.125rem;
            justify-content: flex-start;
        }

        .tab-button {
            padding: 0.5rem 0.5rem;
            font-size: 0.875rem; /* Increased by 2px from 0.75rem */
        }
    }

    .tab-button.active {
        color: #0f172a;
        font-weight: 700; /* Bold weight for active tab */
    }

    /* Remove the underline styles */
    .tab-button.active::after {
        display: none; /* Hide the underline */
    }

    .tab-content {
        padding: 1rem 0;
    }

    .tab-panel {
        animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .upload-boxes {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
    }

    .upload-box {
        width: 50px;
        height: 50px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }

    .hidden-input {
        display: none;
    }

    .upload-label {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background: #f8fafc;
        transition: background-color 0.2s;
    }

    .upload-label:hover {
        background: #f1f5f9;
    }

    .upload-icon {
        font-size: 1.5rem;
        color: #94a3b8;
    }

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>
