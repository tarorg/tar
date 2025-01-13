<script>
    let currentTab = 'Core';
    const tabs = ['Core', 'Options', 'Variants', 'Properties', 'Branding'];
    
    let previewImages = Array(5).fill(null);

    let productTitle = "";
    let productDescription = '';
    let descriptionLoading = false;

    function handleFileUpload(event, index) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImages[index] = e.target.result;
                previewImages = [...previewImages];
            };
            reader.readAsDataURL(file);
        }
    }

    function autoResize(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    async function generateDescription() {
        if (!productTitle.trim() && !productDescription.trim()) return;
        
        descriptionLoading = true;
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Generate a compelling product description for without any additional comments: ${productTitle}. Current description: ${productDescription}`
                })
            });

            if (!response.ok) throw new Error('Failed to generate description');
            
            const data = await response.json();
            const cleanedDescription = data.message.replace(/Here is[^:]*:/, '').replace(/[^a-zA-Z0-9\s]/g, '').split(' ').slice(0, 500).join(' ');
            productDescription = cleanedDescription;
            autoResize({ target: document.querySelector('.description-input') });
        } catch (error) {
            console.error('Failed to generate description:', error);
        } finally {
            descriptionLoading = false;
        }
    }

    // Add new state for options
    let optionsInput = '';
    let optionsMode = 'G'; // 'G' for Group, 'O' for Options
    let optionsItems = [];
    let optionsLoading = false;

    function toggleOptionsMode() {
        optionsMode = optionsMode === 'G' ? 'O' : 'G';
    }

    function handleOptionsSubmit() {
        if (!optionsInput.trim()) return;
        
        const newItem = {
            type: optionsMode,
            value: optionsInput.trim()
        };
        
        optionsItems = [...optionsItems, newItem];
        optionsInput = ''; // Clear input after submit
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
                    <div class="title-container">
                        <input
                            type="text"
                            bind:value={productTitle}
                            placeholder="Untitled"
                            class="title-input"
                        />
                    </div>

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

                    <div class="ai-trigger">
                        <button 
                            class="ai-button" 
                            on:click={generateDescription}
                            disabled={descriptionLoading || (!productTitle.trim() && !productDescription.trim())}
                            title="Generate AI description"
                        >
                            {#if descriptionLoading}
                                <span class="loading-spinner"></span>
                            {:else}
                                <span class="sparkle">✨</span>
                            {/if}
                        </button>
                    </div>

                    <div class="description-container">
                        <textarea
                            bind:value={productDescription}
                            placeholder="Add a description..."
                            class="description-input"
                            on:focus={autoResize}
                        ></textarea>
                    </div>
                </div>
            {:else if currentTab === 'Options'}
                <div class="tab-panel" role="tabpanel">
                    <div class="options-input-container">
                        <button 
                            class="mode-toggle" 
                            on:click={toggleOptionsMode}
                            title={optionsMode === 'G' ? 'Group Mode' : 'Option Mode'}
                        >
                            {optionsMode}
                        </button>
                        <input
                            type="text"
                            bind:value={optionsInput}
                            placeholder={optionsMode === 'G' ? "Enter option group..." : "Enter option value..."}
                            class="options-input"
                        />
                        <button 
                            class="ai-button" 
                            on:click={handleOptionsSubmit}
                            disabled={!optionsInput.trim()}
                        >
                            <span class="sparkle">✨</span>
                        </button>
                    </div>

                    {#if optionsItems.length > 0}
                        <div class="options-table">
                            <table>
                                <tbody>
                                    {#each optionsItems as item}
                                        <tr>
                                            <td class="option-item">
                                                <span class="option-type">{item.type}</span>
                                                <span class="option-value">{item.value}</span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            {:else if currentTab === 'Variants'}
                <div class="tab-panel" role="tabpanel">
                    <!-- Empty Variants tab -->
                </div>
            {:else if currentTab === 'Properties'}
                <div class="tab-panel" role="tabpanel">Properties content here</div>
            {:else if currentTab === 'Branding'}
                <div class="tab-panel" role="tabpanel">Branding content here</div>
            {/if}
        </div>
    </div>
</section>

<style>
    .tabs-container {
        width: 100%;
        margin: 1rem 0;
        overflow-x: auto;
    }

    .tabs-header {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        min-width: min-content;
    }

    .tab-button {
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        color: #64748b;
        white-space: nowrap;
        font-weight: 400;
        font-size: 1.125rem;
    }

    @media (max-width: 768px) {
        .tabs-header {
            gap: 0.125rem;
        }

        .tab-button {
            padding: 0.5rem 0.75rem;
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .tabs-container {
            margin: 0.5rem 0;
        }

        .tabs-header {
            gap: 0.125rem;
            justify-content: flex-start;
        }

        .tab-button {
            padding: 0.5rem 0.5rem;
            font-size: 0.875rem;
        }
    }

    .tab-button.active {
        color: #0f172a;
        font-weight: 700;
    }

    .tab-button.active::after {
        display: none;
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

    .title-container {
        padding: 1rem 0;
        margin-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .title-input {
        width: 100%;
        font-size: 2rem;
        font-weight: 600;
        border: none;
        background: transparent;
        padding: 0.5rem 0;
        color: #0f172a;
    }

    .title-input:focus {
        outline: none;
    }

    .title-input::placeholder {
        color: #94a3b8;
        opacity: 0.8;
    }

    .description-container {
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: #f8fafc;
    }

    .description-input {
        width: 100%;
        min-height: 100px;
        border: none;
        background: transparent;
        resize: none;
        font-size: 0.95rem;
        line-height: 1.5;
        color: #1a1a1a;
        padding: 0.5rem;
        overflow-y: hidden;
    }

    .description-input:focus {
        outline: none;
    }

    .description-input::placeholder {
        color: #94a3b8;
        opacity: 0.8;
    }

    .ai-trigger {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
    }

    .ai-button {
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ai-button:hover {
        opacity: 0.7;
    }

    .ai-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .sparkle {
        font-size: 1.5rem;
        color: #94a3b8;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .loading-spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid #e2e8f0;
        border-top-color: #94a3b8;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .options-input-container {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
    }

    .mode-toggle {
        padding: 0.5rem 1rem;
        background: #e2e8f0;
        border: none;
        border-radius: 4px;
        color: #64748b;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .mode-toggle:hover {
        background: #cbd5e1;
    }

    .options-input {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: transparent;
        font-size: 0.95rem;
    }

    .options-input:focus {
        outline: none;
    }

    .options-table {
        margin-top: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
    }

    .options-table table {
        width: 100%;
        border-collapse: collapse;
    }

    .option-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .option-type {
        padding: 0.25rem 0.5rem;
        background: #e2e8f0;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
    }

    .option-value {
        color: #1a1a1a;
    }

    tr:last-child .option-item {
        border-bottom: none;
    }
</style>
