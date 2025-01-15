<script>
    let currentTab = 'Core';
    const tabs = ['Core', 'Options', 'Variants', 'Properties', 'Branding'];
    
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

    function addOption() {
        if (newOption.trim()) {
            options = [...options, { name: newOption.trim(), subOptions: [] }];
            newOption = '';
        }
    }

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
        input.value = options[optionIndex].subOptions[subIndex].color || '#000000'; // Use color property instead of value
        
        input.addEventListener('input', (e) => {
            const color = e.target.value.toUpperCase(); // Ensure HEX is uppercase
            options = options.map((opt, i) => {
                if (i === optionIndex) {
                    const updatedSubOptions = opt.subOptions.map((subOpt, j) => {
                        if (j === subIndex) {
                            return { 
                                ...subOpt, 
                                color: color, // Store color separately from value
                                value: color, // Store HEX value
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
                <div class="tab-panel" role="tabpanel">
                    <!-- Variants content here -->
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
        padding: 0.75rem;
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
        padding: 0.5rem;
    }

    .suboption-input {
        width: 100%;
        padding: 0.25rem;
        border: none;
        background: transparent;
        font-size: 1rem;
    }

    .suboption-input:focus {
        outline: none;
    }

    .suboption-input:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .color-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .color-circle {
        width: 1.5rem; /* Reduced size */
        height: 1.5rem; /* Reduced size */
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
        width: 2rem;
        height: 2rem;
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
        justify-content: center;
        height: 100%;
        min-height: 2rem;
    }

    .identifier-image-container {
        position: relative;
        width: 2rem;
        height: 2rem;
        border-radius: 0.25rem;
        overflow: hidden;
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
        width: 2rem;
        height: 2rem;
        border: 1px dashed #e2e8f0;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .identifier-upload:hover {
        border-color: #94a3b8;
        background: #f8fafc;
    }
</style>
