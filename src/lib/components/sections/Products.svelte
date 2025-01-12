<script>
    // Update tabs order
    let currentTab = 'Core';
    const tabs = ['Core', 'Options', 'Variants', 'Properties', 'Branding'];
    
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

    let productTitle = ""; // Remove default value for title state
    let productDescription = ''; // Add this for description state
    let descriptionLoading = false;

    // Auto-resize textarea function
    function autoResize(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // AI Description Generation
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
            // Clean the generated description and limit to 500 words
            const cleanedDescription = data.message.replace(/Here is[^:]*:/, '').replace(/[^a-zA-Z0-9\s]/g, '').split(' ').slice(0, 500).join(' ');
            productDescription = cleanedDescription;
            autoResize({ target: document.querySelector('.description-input') });
        } catch (error) {
            console.error('Failed to generate description:', error);
        } finally {
            descriptionLoading = false;
        }
    }

    let optionsInput = '';
    let optionsTable = [];
    let optionsLoading = false;
    let variantsTable = [];

    // Add helper function to generate SKU
    function generateSKU(variant) {
        return Object.values(variant)
            .map(value => value.substring(0, 3).toUpperCase())
            .join('-');
    }

    // Add function to generate variants from options
    function generateVariants() {
        const groupedOptions = groupOptionsByType(optionsTable);
        
        // Create cartesian product of all options
        const optionTypes = Object.keys(groupedOptions);
        if (optionTypes.length === 0) return [];

        const combinations = optionTypes.reduce((acc, type) => {
            const values = groupedOptions[type].map(opt => opt.value);
            if (acc.length === 0) {
                return values.map(value => ({ [type]: value }));
            }

            return acc.flatMap(combo => 
                values.map(value => ({
                    ...combo,
                    [type]: value
                }))
            );
        }, []);

        // Generate SKUs and create variant objects
        variantsTable = combinations.map(combo => ({
            ...combo,
            sku: generateSKU(combo),
            price: '0.00',
            stock: '0'
        }));
    }

    async function categorizeAndGenerateOptions() {
        if (!optionsInput.trim()) return;
        
        optionsLoading = true;
        try {
            // Create context from current table and input
            const currentOptions = optionsTable
                .map(opt => `${opt.type}: ${opt.value}`)
                .join(', ');

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `STRICT JSON ONLY:
                            Input values: ${optionsInput}
                            Current options: [${currentOptions}]
                            
                            Rules:
                            1. Categorize input values into appropriate types
                            2. Each object needs exactly "type" and "value" properties
                            3. NO probabilities or variations
                            4. Keep values simple and direct
                            5. Maximum 3 types
                            
                            Response format:
                            [{"type": "Category", "value": "ExactValue"}]`
                })
            });

            if (!response.ok) throw new Error('Failed to generate options');
            
            const data = await response.json();
            try {
                const jsonMatch = data.message.match(/\[.*\]/s);
                if (jsonMatch) {
                    const parsedData = JSON.parse(jsonMatch[0]);
                    // Merge new options with existing ones, avoiding duplicates
                    const newOptions = Array.isArray(parsedData) ? parsedData : [parsedData];
                    const uniqueOptions = [...optionsTable];
                    
                    newOptions.forEach(newOpt => {
                        const isDuplicate = uniqueOptions.some(
                            existingOpt => 
                                existingOpt.type.toLowerCase() === newOpt.type.toLowerCase() &&
                                existingOpt.value.toLowerCase() === newOpt.value.toLowerCase()
                        );
                        if (!isDuplicate) {
                            uniqueOptions.push(newOpt);
                        }
                    });
                    
                    optionsTable = uniqueOptions;
                    generateVariants(); // Update variants whenever options change
                }
            } catch (e) {
                console.error('Failed to parse options:', e);
            }
        } catch (error) {
            console.error('Failed to generate options:', error);
        } finally {
            optionsLoading = false;
            optionsInput = ''; // Reset input after generation
        }
    }

    // Add helper function to group options by type
    function groupOptionsByType(options) {
        return options.reduce((groups, option) => {
            const type = option.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(option);
            return groups;
        }, {});
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
                    <!-- Add title input section -->
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

                    <!-- Add AI trigger button -->
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

                    <!-- Add description section -->
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
                        <input
                            type="text"
                            bind:value={optionsInput}
                            placeholder="Enter product options..."
                            class="options-input"
                            disabled={optionsLoading}
                        />
                        <button 
                            class="ai-button" 
                            on:click={categorizeAndGenerateOptions}
                            disabled={optionsLoading || !optionsInput.trim()}
                        >
                            {#if optionsLoading}
                                <span class="loading-spinner"></span>
                            {:else}
                                <span class="sparkle">✨</span>
                            {/if}
                        </button>
                    </div>

                    {#if optionsTable.length > 0}
                        <div class="options-table">
                            <table>
                                <tbody>
                                    {#each Object.entries(groupOptionsByType(optionsTable)) as [type, options]}
                                        <tr class="type-header">
                                            <td colspan="2">{type}</td>
                                        </tr>
                                        {#each options as option}
                                            <tr>
                                                <td class="value-cell">
                                                    {#if type.toLowerCase() === 'color'}
                                                        <div class="color-value">
                                                            <span class="color-circle" style="background-color: {option.value}"></span>
                                                            {option.value}
                                                        </div>
                                                    {:else}
                                                        {option.value}
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>
            {:else if currentTab === 'Variants'}
                <div class="tab-panel" role="tabpanel">
                    {#if variantsTable.length > 0}
                        <div class="variants-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Variant</th>
                                        <th class="text-right">Stock</th>
                                        <th class="text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each variantsTable as variant}
                                        <tr>
                                            <td>
                                                <div class="variant-info">
                                                    <div class="variant-sku">{variant.sku}</div>
                                                    <div class="variant-desc">
                                                        {Object.entries(variant)
                                                            .filter(([key]) => !['sku', 'price', 'stock'].includes(key))
                                                            .map(([type, value]) => 
                                                                type.toLowerCase() === 'color' 
                                                                    ? `${type}: ${value}`
                                                                    : `${type}: ${value}`
                                                            )
                                                            .join(' / ')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="text-right">
                                                <input 
                                                    type="number" 
                                                    bind:value={variant.stock}
                                                    class="variant-input"
                                                    min="0"
                                                />
                                            </td>
                                            <td class="text-right">
                                                <div class="price-input-wrapper">
                                                    <span class="currency">$</span>
                                                    <input 
                                                        type="number" 
                                                        bind:value={variant.price}
                                                        class="variant-input price"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {:else}
                        <div class="no-variants">
                            Add options in the Options tab to generate variants
                        </div>
                    {/if}
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
        border: none;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .options-table table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
    }

    .type-header td {
        padding: 0.75rem 1rem;
        background: #f8fafc;
        font-weight: 500;
        color: #64748b;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
    }

    .value-cell {
        padding: 0.75rem 1rem;
        color: #1a1a1a;
        border-bottom: 1px solid #f1f5f9;
    }

    .options-table tr:last-child td {
        border-bottom: none;
    }

    .color-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .color-circle {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        border: 2px solid #f1f5f9;
    }

    .options-table tr:hover {
        background: #f8fafc;
    }

    .variants-table {
        margin-top: 1rem;
        border: none;
        border-radius: 12px;
        overflow: hidden;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .variants-table table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
    }

    .variants-table th {
        padding: 1rem;
        background: #f8fafc;
        font-weight: 500;
        color: #64748b;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
    }

    .variants-table td {
        padding: 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
    }

    .variant-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .variant-sku {
        font-weight: 500;
        color: #1a1a1a;
    }

    .variant-desc {
        font-size: 0.813rem;
        color: #64748b;
        line-height: 1.4;
    }

    .variant-input {
        width: 80px;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 0.875rem;
        text-align: right;
        transition: all 0.2s;
    }

    .variant-input:focus {
        outline: none;
        border-color: #94a3b8;
        box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
    }

    .price-input-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .currency {
        position: absolute;
        left: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
    }

    .variant-input.price {
        padding-left: 1.5rem;
    }

    .text-right {
        text-align: right;
    }

    tr:hover .variant-sku {
        color: #2563eb;
    }

    .variants-table tr:last-child td {
        border-bottom: none;
    }

    .no-variants {
        text-align: center;
        padding: 2rem;
        color: #64748b;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px dashed #e2e8f0;
    }
</style>
