<script>
    let currentTab = 'Core';
    const tabs = ['Core', 'Options', 'Variants', 'Details', 'Publish'];
    
    let previewImages = Array(5).fill(null);
    let productTitle = "";
    let productDescription = '';
    let descriptionLoading = false;
    let colorLoading = false;

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

    // State variables for options
    let options = [];
    let newOption = '';

    // Replace the existing addOption function
    function addOption() {
        if (newOption.trim()) {
            options = [...options, { name: newOption.trim(), subOptions: [] }];
            newOption = '';
            generateVariants(); // Force regenerate variants
        }
    }

    // Replace the existing addSubOption function
    function addSubOption(index) {
        options = options.map((option, i) => {
            if (i === index) {
                return { 
                    ...option, 
                    subOptions: [...option.subOptions, { 
                        identifier: '', 
                        value: '', 
                        color: '', // Add color property
                        stock: 0 
                    }] 
                };
            }
            return option;
        });
        generateVariants(); // Force regenerate variants
    }

    // Add new imports and state
    let colorPickerVisible = false;
    let selectedColorIndex = { option: -1, sub: -1 };
    let imagePickerVisible = false;
    let colorImageFile = null;

    function showColorPicker(optionIndex, subIndex) {
        selectedColorIndex = { option: optionIndex, sub: subIndex };
        colorPickerVisible = true;
    }

    function generateSizeIdentifier(value) {
        if (!value) return '';
        
        // Handle common size patterns
        const upperValue = value.toUpperCase().trim();
        if (['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(upperValue)) {
            return upperValue;
        }
        
        // Handle written out sizes
        const words = upperValue.split(' ');
        if (words.length > 1) {
            // For cases like "Extra Large"
            return words.map(word => word[0]).join('');
        }
        
        // For single word, take first letter
        return upperValue[0];
    }

    function handleColorClick(event, optionIndex, subIndex) {
        event.preventDefault();
        selectedColorIndex = { option: optionIndex, sub: subIndex };
        const input = document.createElement('input');
        input.type = 'color';
        input.value = options[optionIndex].subOptions[subIndex].color || '#000000';
        
        input.addEventListener('input', (e) => {
            const color = e.target.value.toUpperCase();
            options = options.map((opt, i) => {
                if (i === optionIndex) {
                    const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                        if (j === subIndex) {
                            return { 
                                ...subOpt, 
                                color: color, // Only update the color property
                                identifier: color // Use HEX as identifier for colors
                            };
                        }
                        return subOpt;
                    });
                    return { ...opt, subOptions: updatedSubOptions };
                }
                return opt;
            });
        });
        
        input.addEventListener('change', () => {
            input.remove();
        });

        input.click();
    }

    // Update the updateSubOption function
    function updateSubOption(index, subIndex, field, value) {
        options = options.map((opt, i) => {
            if (i === index) {
                const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                    if (j === subIndex) {
                        const updates = { [field]: value };
                        
                        // Auto-generate identifier based on group type
                        if (field === 'value') {
                            if (opt.name.toLowerCase() === 'size') {
                                updates.identifier = generateSizeIdentifier(value);
                            } else if (opt.name.toLowerCase() !== 'color') {
                                // For other groups, identifier equals value
                                updates.identifier = value;
                            }
                        }
                        
                        return { ...subOpt, ...updates };
                    }
                    return subOpt;
                });
                return { ...opt, subOptions: updatedSubOptions };
            }
            return opt;
        });
        generateVariants(); // Force regenerate variants
    }

    function handleColorImageUpload(event) {
        const { option: index, sub: subIndex } = selectedColorIndex;
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                options = options.map((opt, i) => {
                    if (i === index) {
                        const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                            if (j === subIndex) {
                                return { 
                                    ...subOpt, 
                                    imageUrl: e.target.result
                                };
                            }
                            return subOpt;
                        });
                        return { ...opt, subOptions: updatedSubOptions };
                    }
                    return opt;
                });
            };
            reader.readAsDataURL(file);
        }
        imagePickerVisible = false;
    }

    function removeColorImage(optionIndex, subIndex) {
        options = options.map((opt, i) => {
            if (i === optionIndex) {
                const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                    if (j === subIndex) {
                        return { 
                            ...subOpt, 
                            imageUrl: null
                        };
                    }
                    return subOpt;
                });
                return { ...opt, subOptions: updatedSubOptions };
            }
            return opt;
        });
    }

    // Add function to handle generic image upload
    function handleIdentifierImageUpload(event, index, subIndex) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                options = options.map((opt, i) => {
                    if (i === index) {
                        const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                            if (j === subIndex) {
                                return { 
                                    ...subOpt, 
                                    identifierImage: e.target.result
                                };
                            }
                            return subOpt;
                        });
                        return { ...opt, subOptions: updatedSubOptions };
                    }
                    return opt;
                });
            };
            reader.readAsDataURL(file);
        }
    }

    // State variables for variants
    let variants = [];

    // Update the reactive statement to watch both options and productTitle
    $: {
        if (options) {
            generateVariants();
        }
    }

    // Add new state for variant tabs
    let variantTab = 'Inventory';
    const variantTabs = ['Inventory', 'Price'];
    
    // Add price to variant structure
    function generateVariants() {
        const optionGroups = options
            .filter(option => option.subOptions && option.subOptions.length > 0)
            .map(option => option.subOptions.map(subOption => ({
                group: option.name,
                identifier: subOption.identifier,
                value: subOption.value,
                imageUrl: subOption.imageUrl || null
            })));

        if (optionGroups.length === 0) {
            variants = [];
            return;
        }

        function cartesianProduct(arr) {
            return arr.reduce((a, b) => {
                if (!a.length) return b.map(b => [b]);
                return a.flatMap(d => b.map(e => [d, e].flat()));
            }, []);
        }

        const variantCombinations = cartesianProduct(optionGroups);
        
        // Get first 3 letters of product title for SKU prefix
        const skuPrefix = productTitle
            ? productTitle.trim().substring(0, 3).toUpperCase()
            : 'SKU';

        variants = variantCombinations.map((combination) => {
            // Generate SKU parts based on option types
            const skuParts = combination.map(c => {
                if (c.group.toLowerCase() === 'size') {
                    return c.identifier; // Use identifier directly for size
                } else {
                    return c.value.trim().substring(0, 3).toUpperCase(); // First 3 letters for other options
                }
            });

            return {
                id: `${skuPrefix}-${skuParts.join('-')}`,
                options: combination,
                stock: 0,
                price: 0,
                compareAtPrice: 0
            };
        });
    }

    // Add search functionality
    let searchQuery = '';
    $: filteredVariants = variants.filter(variant => 
        variant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.options.some(opt => 
            opt.value.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Add new state for variant features
    let variantFeatures = {
        inventory: true,
        price: true
    };

    // Replace variant features with view state
    let currentView = 'inventory';
    let viewDropdownOpen = false;
    const availableViews = [
        { id: 'inventory', label: 'Inventory', col: 'Stock' },
        { id: 'price', label: 'Price' }
    ];

    function formatNumber(value, type) {
        if (type === 'price') {
            return parseFloat(value).toFixed(2);
        }
        return value;
    }

    function handleViewChange(viewId) {
        currentView = viewId;
        viewDropdownOpen = false;
    }

    function handleVariantImageUpload(event, variant) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                variants = variants.map(v => {
                    if (v.id === variant.id) {
                        return { ...v, variantImage: e.target.result };
                    }
                    return v;
                });
            };
            reader.readAsDataURL(file);
        }
    }

    // Simplified columns definition - only Variant and Stock
    const variantColumns = [
        { id: 'variant', label: 'Variant', sticky: true },
        { id: 'stock', label: 'Stock' }
    ];

    // Remove view and filter state
    let activeColumns = [...variantColumns];

    // Remove other column-related functions
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
                    <div class="options-table">
                        <table>
                            <tbody>
                                <tr>
                                    <td class="input-row">
                                        <input
                                            type="text"
                                            bind:value={newOption}
                                            placeholder="Add new option group..."
                                            class="option-input"
                                        />
                                        <button class="add-button" on:click={addOption}>+</button>
                                    </td>
                                </tr>
                                {#each options as option, index}
                                    <tr>
                                        <td class="option-group">
                                            {option.name}
                                            <button class="add-suboption-button" on:click={() => addSubOption(index)}>+</button>
                                        </td>
                                    </tr>
                                    {#each option.subOptions as subOption, subIndex}
                                        <tr class="suboption-row">
                                            <td class="suboption-cell" style="width: 20%;">
                                                {#if option.name.toLowerCase() === 'color'}
                                                    <div class="color-preview">
                                                        {#if subOption.imageUrl}
                                                            <div class="color-image-container" 
                                                                on:click={() => imagePickerVisible = true}
                                                                role="button"
                                                                tabindex="0">
                                                                <img src={subOption.imageUrl} 
                                                                    alt="Color representation" 
                                                                    class="color-image" />
                                                                <button class="remove-image-btn"
                                                                        on:click|stopPropagation={() => removeColorImage(index, subIndex)}>
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        {:else}
                                                            <div class="color-circle" 
                                                                style="background-color: {subOption.color || 'transparent'}"
                                                                on:click={(e) => handleColorClick(e, index, subIndex)}
                                                                on:dblclick={() => imagePickerVisible = true}
                                                                role="button"
                                                                tabindex="0">
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {:else if option.name.toLowerCase() === 'size'}
                                                    <input
                                                        type="text"
                                                        bind:value={subOption.identifier}
                                                        class="suboption-input"
                                                        disabled={true}
                                                    />
                                                {:else}
                                                    <div class="identifier-cell">
                                                        {#if subOption.identifierImage}
                                                            <div class="identifier-image-container">
                                                                <img src={subOption.identifierImage} 
                                                                    alt="Identifier" 
                                                                    class="identifier-image" />
                                                                <button class="remove-image-btn"
                                                                        on:click|stopPropagation={() => {
                                                                            options = options.map((opt, i) => 
                                                                                i === index ? {
                                                                                    ...opt,
                                                                                    subOptions: opt.subOptions.map((so, j) =>
                                                                                        j === subIndex ? { ...so, identifierImage: null } : so
                                                                                    )
                                                                                } : opt
                                                                            );
                                                                        }}>
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        {:else}
                                                            <label class="identifier-upload">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    class="hidden-input"
                                                                    on:change={(e) => handleIdentifierImageUpload(e, index, subIndex)}
                                                                />
                                                                <span class="upload-icon">+</span>
                                                            </label>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </td>
                                            <td class="suboption-cell" style="width: 70%;">
                                                <input
                                                    type="text"
                                                    bind:value={subOption.value}
                                                    placeholder="Value"
                                                    class="suboption-input"
                                                    on:input={(e) => updateSubOption(index, subIndex, 'value', e.target.value)}
                                                />
                                            </td>
                                            <td class="suboption-cell" style="width: 10%;">
                                                {subOption.stock}
                                            </td>
                                        </tr>
                                    {/each}
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {:else if currentTab === 'Variants'}
                <div class="tab-panel variants-panel" role="tabpanel">
                    <div class="variants-content">
                        <div class="variants-search-container">
                            <input
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Search variants..."
                                class="variants-search-input"
                            />
                        </div>
                        <div class="variants-table">
                            <table>
                                <tbody>
                                    {#each filteredVariants as variant}
                                        <tr>
                                            <td class="sticky-col">
                                                <div class="variant-preview compact">
                                                    <div class="variant-image-upload">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            id="variant-upload-{variant.id}"
                                                            on:change={(e) => handleVariantImageUpload(e, variant)}
                                                            class="hidden-input"
                                                        />
                                                        <label for="variant-upload-{variant.id}" class="variant-upload-label">
                                                            {#if variant.variantImage}
                                                                <img src={variant.variantImage} 
                                                                     alt="Variant {variant.id}" 
                                                                     class="variant-preview-image" />
                                                            {:else}
                                                                <span class="upload-icon">+</span>
                                                            {/if}
                                                        </label>
                                                    </div>
                                                    <div class="variant-details">
                                                        <span class="variant-title">
                                                            {variant.options.map(opt => opt.value).join(' ')}
                                                        </span>
                                                        <span class="variant-sku">{variant.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="notion-cell">
                                                    <div class="notion-input inventory-value" 
                                                         contenteditable="true"
                                                         on:blur={(e) => {
                                                             const value = parseInt(e.target.textContent) || 0;
                                                             variant.stock = value;
                                                         }}>
                                                        {variant.stock || 0}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            {:else if currentTab === 'Properties'}
                <div class="tab-panel" role="tabpanel">Properties content here</div>
            {:else if currentTab === 'Branding'}
                <div class="tab-panel" role="tabpanel">Branding content here</div>
            {/if}
        </div>
    </div>
</section>

{#if imagePickerVisible}
    <div class="drawer">
        <div class="drawer-content">
            <input type="file" 
                   accept="image/*"
                   on:change={handleColorImageUpload}
                   class="image-picker" />
            <button class="close-drawer" on:click={() => imagePickerVisible = false}>Close</button>
        </div>
    </div>
{/if}

<style>
    .tabs-container {
        width: 100%;
        margin: 0; /* Changed from 1rem 0 */
        overflow-x: auto;
    }

    .tabs-header {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid #e2e8f0;
        margin: 0; /* Changed from margin-bottom: 1rem */
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
            margin: 0; /* Changed from 0.5rem 0 */
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
        padding: 0; /* Changed from 1rem 0 */
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

    .loading-spinner.small {
        width: 0.875rem;
        height: 0.875rem;
        border-width: 1px;
    }

    .options-table {
        margin-top: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        background: white;
    }

    .options-table table {
        width: 100%;
        border-collapse: collapse;
    }

    .input-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .option-input {
        flex: 1;
        padding: 0.25rem;
        border: none;
        font-size: 1rem;
        background: transparent;
    }

    .option-input:focus {
        outline: none;
    }

    .add-button {
        padding: 0.25rem;
        border: none;
        background: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 1.25rem;
        border-radius: 4px;
        transition: color 0.2s;
    }

    .add-button:hover {
        color: #1e40af;
    }

    .option-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .add-suboption-button {
        padding: 0.25rem;
        border: none;
        background: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 1.25rem;
        border-radius: 4px;
        transition: color 0.2s;
    }

    .add-suboption-button:hover {
        color: #1e40af;
    }

    .options-table td {
        padding: 0.5rem 0.75rem; /* Reduced from 0.75rem */
        border-bottom: 1px solid #e2e8f0;
        font-size: 1rem;
        color: #1a1a1a;
    }

    .options-table tr:last-child td {
        border-bottom: none;
    }

    .suboption-row {
        display: flex;
    }

    .suboption-cell {
        padding: 0.25rem 0.5rem; /* Reduced from 0.5rem */
        display: flex;
        align-items: center;
    }

    .suboption-input {
        width: 100%;
        padding: 0.25rem;
        border: none;
        background: transparent;
        font-size: 1rem;
        min-width: 0; /* Prevent input from overflowing */
    }

    .suboption-input:focus {
        outline: none;
    }

    .suboption-input:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        width: auto;
        min-width: 2rem;
        text-align: left;
        padding-left: 0.25rem;
    }

    .color-preview,
    .identifier-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start; /* Changed from center to flex-start */
        height: 100%;
        width: 100%;
        min-width: 60px; /* Ensure minimum width for identifier column */
    }

    .color-circle,
    .color-image-container,
    .identifier-image-container,
    .identifier-upload {
        flex: 0 0 1.5rem; /* Increased size */
        margin-left: 0.1rem; /* Reduced left margin */
        margin-right: 0.1rem; /* Added right margin for balance */
    }

    .color-circle {
        width: 1.5rem; /* Increased size */
        height: 1.5rem; /* Increased size */
        border-radius: 50%;
        border: 2px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .color-circle:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .color-circle:active {
        transform: scale(0.95);
    }

    .color-image-container {
        position: relative;
        width: 1.5rem; /* Increased size */
        height: 1.5rem; /* Increased size */
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
    }

    .color-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .remove-image-btn {
        position: absolute;
        top: -0.5rem;
        right: -0.5rem;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 1.2rem;
        height: 1.2rem;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .color-image-container:hover .remove-image-btn {
        opacity: 1;
    }

    .drawer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 1rem;
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
    }

    .drawer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .image-picker {
        width: 100%;
        height: 2rem;
        border: none;
        margin-bottom: 1rem;
    }

    .close-drawer {
        padding: 0.5rem 1rem;
        border: none;
        background: #e2e8f0;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .close-drawer:hover {
        background: #cbd5e1;
    }

    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }

    .identifier-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start; /* Changed from center to flex-start */
        height: 100%;
        min-height: 2rem;
        width: 100%;
        min-width: 60px; /* Ensure minimum width for identifier column */
    }

    .identifier-image-container {
        position: relative;
        width: 1.5rem; /* Increased size */
        height: 1.5rem; /* Increased size */
        border-radius: 0.25rem;
        overflow: hidden;
        flex: 0 0 1.5rem; /* Increased size */
        margin-left: 0.1rem; /* Reduced left margin */
        margin-right: 0.1rem; /* Added right margin for balance */
    }

    .identifier-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .identifier-upload {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem; /* Increased size */
        height: 1.5rem; /* Increased size */
        border: 1px dashed #e2e8f0;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        flex: 0 0 1.5rem; /* Increased size */
        margin-left: 0.1rem; /* Reduced left margin */
        margin-right: 0.1rem; /* Added right margin for balance */
    }

    .identifier-upload:hover {
        border-color: #94a3b8;
        background: #f8fafc;
    }

    .generate-variants-button {
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        background-color: #1e40af;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .generate-variants-button:hover {
        background-color: #1c3a9f;
    }

    .variants-table {
        margin-top: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        background: white;
        table-layout: fixed;
        width: 100%;
    }

    .variants-table table {
        width: 100%;
        border-collapse: collapse;
    }

    .variants-table th, .variants-table td {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        font-size: 1rem;
        color: #1a1a1a;
    }

    .variants-table tr:last-child td {
        border-bottom: none;
    }

    .variant-image {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.25rem;
        margin-right: 0.5rem;
    }

    .stock-input {
        width: 100%;
        padding: 0.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 1rem;
    }

    .stock-input:focus {
        outline: none;
        border-color: #1e40af;
    }

    .variant-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    .variant-tab-button {
        background: none;
        border: none;
        padding: 0.5rem 1rem;
        color: #64748b;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        position: relative;
    }

    .variant-tab-button.active {
        color: #0f172a;
    }

    .variant-tab-button.active::after {
        content: '';
        position: absolute;
        bottom: -0.5rem;
        left: 0;
        right: 0;
        height: 2px;
        background: #1e40af;
        border-radius: 2px;
    }

    .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 10;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
        width: auto !important;
        min-width: 300px !important;
        max-width: none !important;
    }

    .variant-preview {
        display: flex;
    }

    .variant-options {
        font-size: 0.6875rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .variant-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0;
    }

    .variant-image {
        width: 1.5rem; /* Reduced from 2rem */
        height: 1.5rem; /* Reduced from 2rem */
        border-radius: 0.25rem;
        object-fit: cover;
        flex-shrink: 0;
    }

    .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 10;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
        min-width: 200px; /* Reduced from 300px */
        max-width: 200px; /* Added max-width */
    }

    .search-container {
        margin-bottom: 1rem;
        padding: 0 0.5rem;
    }

    .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        background: #f8fafc;
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #1e40af;
        background: white;
        box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.1);
    }

    .variants-table th {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.5rem 0.75rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }

    .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 10;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
        min-width: 140px;
        max-width: 140px;
    }

    .variant-preview.compact {
        padding: 0.25rem 0;
        gap: 0.375rem;
        width: 100%;
        max-width: 100%;
    }

    .variant-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
    }

    .variant-code {
        font-size: 0.75rem;
        font-weight: 500;
    }

    .variant-options {
        font-size: 0.6875rem;
        color: #64748b;
    }

    .variant-image {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }

    .variants-table td {
        padding: 0.25rem 0.75rem;
    }

    .variant-controls {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        background: #fff;
    }

    .toggle-group {
        display: flex;
        gap: 1.5rem;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #64748b;
    }

    .toggle-switch {
        position: relative;
        width: 36px;
        height: 20px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #e2e8f0;
        transition: .4s;
        border-radius: 34px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #1e40af;
    }

    input:checked + .slider:before {
        transform: translateX(16px);
    }

    .notion-col {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 500;
        width: 60px; /* Add fixed width */
        min-width: 60px; /* Ensure minimum width */
        max-width: 60px; /* Ensure maximum width */
    }

    .notion-cell {
        padding: 0.25rem 0;
        width: 60px; /* Add fixed width */
        min-width: 60px; /* Ensure minimum width */
        max-width: 60px; /* Ensure maximum width */
    }

    .notion-input {
        padding: 0.25rem 0.5rem; /* Reduced horizontal padding */
        width: 100%;
        text-align: left;
    }

    .notion-cell {
        padding: 0;
        width: 80px; /* Increased from 50px */
        min-width: 80px; /* Increased from 50px */
        max-width: 80px; /* Increased from 50px */
    }

    .notion-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        min-height: 2rem;
        cursor: text;
        color: #1a1a1a;
        background: transparent;
        transition: all 0.2s;
        font-size: 0.875rem;
        border-radius: 0;
    }

    .notion-input:hover {
        background: #f8fafc;
    }

    .notion-input:focus {
        background: white;
        outline: 2px solid #1e40af;
        outline-offset: -2px;
    }

    .variants-table {
        overflow: auto;
        max-height: calc(100vh - 220px);
        position: relative;
        margin-top: 0;
    }

    .variants-header {
        position: sticky;
        top: 0;
        background: white;
        z-index: 30;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem;
    }

    .sticky-col {
        position: sticky;
        left: 0;
        background: inherit;
        min-width: 120px;
        max-width: 120px;
    }

    .variant-preview {
        width: 100%;
        overflow: hidden;
    }

    .variants-table td {
        background: white;
    }

    .variants-table tr:hover td {
        background: #f8fafc;
    }

    .variants-table th {
        background: white;
        height: 2.5rem;
        padding: 0 0.75rem;
    }

    .variants-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 400px;
        overflow: hidden; /* Changed from visible */
        position: relative; /* Added */
    }

    .variants-header {
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        background: white;
        position: sticky;
        top: 0;
        z-index: 30;
    }

    .header-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
    }

    .view-selector {
        position: relative;
        min-width: 100px; /* Reduced from 120px */
        order: 2; /* Ensure view selector comes second */
    }

    .view-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        background: white;
        color: #64748b;
        font-size: 0.75rem;
        width: 100%;
        transition: all 0.2s;
    }

    .view-icon {
        color: #94a3b8;
    }

    .view-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .view-option {
        width: 100%;
        text-align: left;
        padding: 0.375rem 0.5rem;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 0.75rem;
        cursor: pointer;
    }

    .view-option:hover {
        background: #f8fafc;
        color: #1e40af;
    }

    .search-input {
        flex: 1;
        max-width: 320px;
        order: 1; /* Ensure search box comes first */
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: #f8fafc;
    }

    .variants-content {
        flex: 1;
        position: relative;
        overflow: hidden; /* Changed from visible */
        display: flex;
        flex-direction: column;
    }

    .variants-table {
        position: relative;
        overflow: auto;
        height: 100%;
        min-height: 400px;
    }

    .variants-table {
        margin: 0;
        border: none;
        border-radius: 0;
    }

    /* Update table styles for better appearance */
    .variants-table th {
        position: sticky;
        top: 0;
        background: #f8fafc;
        font-size: 0.675rem;
        font-weight: 500;
        color: #64748b;
        padding: 0.25rem 0.75rem; /* Reduced padding */
        text-transform: none;
        letter-spacing: normal;
        text-align: left;
        height: 2rem; /* Reduced height */
        line-height: 1;
    }

    .notion-cell {
        padding: 0.25rem 0;
    }

    .notion-input {
        padding: 0.25rem 0.75rem;
    }

    /* Ensure proper sticky behavior */
    .sticky-col {
        background: inherit;
        z-index: 2;
        min-width: 80px; /* Reduced from 100px */
        max-width: 80px; /* Reduced from 100px */
    }

    .sticky-col {
        background: inherit;
        z-index: 2;
        min-width: 60px; /* Further reduced */
        max-width: 60px; /* Further reduced */
    }

    .notion-col {
        width: 50px; /* Reduced width */
        min-width: 50px;
        max-width: 50px;
    }

    .notion-cell {
        width: 50px; /* Reduced width */
        min-width: 50px;
        max-width: 50px;
    }

    .notion-input {
        text-align: right; /* Align numbers to the right */
        padding: 0.25rem 0.375rem; /* Reduced padding */
    }

    .variants-header {
        border-bottom: 1px solid #e2e8f0;
        padding: 0.5rem;
        background: white;
    }

    .search-header {
        padding: 0.5rem !important;
        background: white !important;
    }

    .filter-header {
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
        padding: 0.5rem !important;
        background: white !important;
    }

    .search-wrapper {
        width: 100%;
        padding-right: 0.5rem;
    }

    .table-search-input {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: #f8fafc;
        transition: all 0.2s;
        max-width: none;
    }

    .table-search-input:focus {
        outline: none;
        border-color: #1e40af;
        background: white;
        box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.1);
    }

    .filter-wrapper {
        position: relative;
        width: 100%;
        z-index: 100;
    }

    .filter-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.375rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.75rem;
        transition: all 0.2s;
        position: relative;
        z-index: 50;
    }

    .filter-button:hover {
        background: white;
        border-color: #1e40af;
    }

    .chevron-icon {
        color: #64748b;
        margin-left: 0.25rem;
    }

    .filter-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }

    .filter-option {
        width: 100%;
        text-align: left;
        padding: 0.375rem 0.5rem;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .filter-option:hover {
        background: #f8fafc;
        color: #1e40af;
    }

    .filter-option.active {
        background: #f1f5f9;
        color: #1e40af;
        font-weight: 500;
    }

    .variant-image-upload {
        position: relative;
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
        margin-right: 0.5rem;
    }

    .variant-upload-label {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        border: 1px dashed #e2e8f0;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        overflow: hidden;
    }

    .variant-upload-label:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
    }

    .variant-preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .inventory-value {
        font-size: 1rem !important;
        font-weight: 600 !important;
        color: #0f172a !important;
    }

    .notion-input.inventory-value {
        text-align: center !important;
        padding: 0.5rem !important;
        min-height: 2.5rem !important;
        font-size: 1.25rem !important; /* Increased from 1rem */
    }

    .notion-input.inventory-value:hover {
        background: #f1f5f9 !important;
    }

    .notion-input.inventory-value:focus {
        background: white !important;
        outline: 2px solid #1e40af !important;
    }

    .variant-preview.compact {
        display: flex;
        align-items: center;
        padding: 0.375rem 0;
    }

    .sticky-col {
        min-width: 200px !important;
        max-width: none !important;
    }

    .view-filter {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        background: white;
        position: relative;
    }

    .modern-dropdown {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 140px;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        color: #1a1a1a;
        font-size: 0.875rem;
        transition: all 0.2s;
        cursor: pointer;
    }

    .modern-dropdown:hover {
        border-color: #94a3b8;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .view-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .view-icon {
        color: #64748b;
    }

    .dropdown-arrow {
        color: #94a3b8;
        transition: transform 0.2s;
    }

    .modern-dropdown[aria-expanded="true"] .dropdown-arrow {
        transform: rotate(180deg);
    }

    .modern-dropdown-menu {
        position: absolute;
        top: calc(100% - 0.5rem);
        left: 1rem;
        width: 140px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 50;
        overflow: hidden;
    }

    .dropdown-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        color: #1a1a1a;
        font-size: 0.875rem;
        text-align: left;
        transition: all 0.2s;
        cursor: pointer;
    }

    .dropdown-option:hover {
        background: #f8fafc;
    }

    .dropdown-option.active {
        background: #f1f5f9;
        color: #1e40af;
    }

    .dropdown-option.active .view-icon {
        color: #1e40af;
    }

    .variants-search {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        background: white;
    }

    .variants-search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        font-size: 0.875rem;
        background: transparent;
        transition: all 0.2s;
    }

    .variants-search-input:focus {
        outline: none;
    }

    .variants-search-input::placeholder {
        color: #94a3b8;
    }

    .variant-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
    }

    .variant-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1a1a1a;
    }

    .variant-sku {
        font-size: 0.75rem;
        color: #64748b;
    }

    /* Update table styles to remove header visibility */
    .variants-table thead {
        display: none;
    }

    /* Adjust spacing for table without header */
    .variants-table {
        margin-top: 0;
    }
</style>
