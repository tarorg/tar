<script>
  import '$lib/styles/global.css';
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


