<script>
    let currentTab = 'Core';
    const tabs = ['Core', 'Variants', 'Properties', 'Branding'];
    
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

    const MAX_GROUPS = 3;
    let optionsInput = '';
    let optionsItems = [];
    let optionsLoading = false;

    // Helper to count unique groups
    function getUniqueGroupCount() {
        return new Set(optionsItems.filter(item => !item.type).map(item => item.value)).size;
    }

    async function convertToGroupName(input) {
        optionsLoading = true;
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Spell check and correct this product option group name if needed (capitalize first letter): "${input}". Return ONLY the corrected word, no other text. Examples:
                    - "colr" -> "Color"
                    - "siz" -> "Size"
                    - "materil" -> "Material"
                    - "stylz" -> "Style"`
                })
            });

            if (!response.ok) throw new Error('Failed to convert group name');
            
            const data = await response.json();
            return data.message.trim();
        } catch (error) {
            console.error('Failed to convert group name:', error);
            return input.charAt(0).toUpperCase() + input.slice(1); // Fallback: just capitalize
        } finally {
            optionsLoading = false;
        }
    }

    async function mapOptionToGroup(value) {
        optionsLoading = true;
        try {
            const existingGroups = optionsItems
                .filter(item => item.isGroup)
                .map(item => item.value);

            if (existingGroups.length === 0) return null;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Given these product option groups: [${existingGroups.join(', ')}], 
                    which group would "${value}" belong to? Return ONLY the group name, no other text.
                    For example, if groups are [Color, Size] and value is "red", return "Color".`
                })
            });

            if (!response.ok) throw new Error('Failed to map option');
            const data = await response.json();
            return data.message.trim();
        } catch (error) {
            console.error('Failed to map option:', error);
            return null;
        } finally {
            optionsLoading = false;
        }
    }

    async function handleOptionsSubmit() {
        if (!optionsInput.trim()) return;

        const input = optionsInput.trim();
        if (input.startsWith('@group ')) {
            const groupName = input.replace('@group ', '').trim();
            if (groupName && getUniqueGroupCount() < MAX_GROUPS) {
                const correctedName = await convertToGroupName(groupName);
                optionsItems = [...optionsItems, {
                    type: '',
                    value: correctedName,
                    isGroup: true,
                    values: []
                }];
            }
        } else {
            // Handle adding values to specific group
            const match = input.match(/@(\w+)\s+(.*)/);
            if (match) {
                const [, groupName, value] = match;
                const values = value.split(',').map(v => v.trim());
                const targetGroup = optionsItems.find(
                    item => item.isGroup && item.value.toLowerCase() === groupName.toLowerCase()
                );
                
                if (targetGroup && values.length) {
                    optionsItems = optionsItems.map(item => {
                        if (item === targetGroup) {
                            return {
                                ...item,
                                values: [...(item.values || []), ...values]
                            };
                        }
                        return item;
                    });
                }
            }
        }
        
        optionsInput = '';
    }

    function isColorValue(groupName, value) {
        return groupName.toLowerCase() === 'color';
    }

    $: isGroupLimitReached = getUniqueGroupCount() >= MAX_GROUPS;

    // Add this function to get formatted option values
    function getFormattedValues(item) {
        if (!item.values || item.values.length === 0) return '—';
        return item.values.join(', ');
    }

    function getValueCircle(value, groupName) {
        if (isColorValue(groupName, value)) {
            return {
                type: 'color',
                display: value.toLowerCase(),
                fullValue: value
            };
        }
        return {
            type: 'text',
            display: value.slice(0, 2).toUpperCase(),
            fullValue: value
        };
    }

    function getValuesList(item) {
        if (!item.values || item.values.length === 0) return [];
        return item.values.map(value => getValueCircle(value, item.value));
    }

    let showDropdown = false;
    let dropdownPosition = { x: 0, y: 0 };
    // Create a base array for dropdownItems
    let dropdownItems = [{ id: 'group', label: '@group', isGroup: true }];

    function getAvailableGroups() {
        const groups = optionsItems
            .filter(item => item.isGroup)
            .map(item => ({
                id: item.value.toLowerCase(),
                label: `@${item.value.toLowerCase()}`,
                isGroup: false,
                groupName: item.value
            }));
        return [dropdownItems[0], ...groups];
    }

    // Update reactive statement to properly update dropdown items
    $: dropdownItems = getAvailableGroups();

    function handleInput(event) {
        const input = event.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        const lastChar = value[cursorPosition - 1];

        if (lastChar === '@') {
            const rect = input.getBoundingClientRect();
            dropdownPosition = {
                x: rect.left + 8,
                y: rect.bottom + window.scrollY + 4
            };
            // Ensure dropdown items are updated
            dropdownItems = getAvailableGroups();
            showDropdown = true;
        } else if (!value.includes('@') || cursorPosition === 0) {
            showDropdown = false;
        }
    }

    function getTextWidth(text, font) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }

    function selectDropdownItem(item) {
        const input = document.querySelector('.minimal-input');
        const cursorPosition = input.selectionStart;
        const textBeforeCursor = optionsInput.slice(0, cursorPosition - 1); // Remove @
        const textAfterCursor = optionsInput.slice(cursorPosition);
        
        // Insert command at cursor position
        optionsInput = textBeforeCursor + item.label + ' ' + textAfterCursor;
        
        // Set cursor position after inserted command
        setTimeout(() => {
            input.focus();
            const newPosition = textBeforeCursor.length + item.label.length + 1;
            input.setSelectionRange(newPosition, newPosition);
        }, 0);
        
        showDropdown = false;
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
            {:else if currentTab === 'Variants'}
                <div class="tab-panel" role="tabpanel">
                    <div class="minimal-input-container">
                        <div class="input-wrapper">
                            <input
                                type="text"
                                bind:value={optionsInput}
                                placeholder="Type @ to add group or option..."
                                class="minimal-input"
                                on:input={handleInput}
                                autocomplete="off"
                                autocapitalize="off"
                                spellcheck="false"
                            />
                            {#if showDropdown}
                                <div 
                                    class="dropdown-menu" 
                                    style="left: {dropdownPosition.x}px; top: {dropdownPosition.y}px"
                                >
                                    {#each dropdownItems as item}
                                        <button 
                                            class="dropdown-item"
                                            class:group-command={item.isGroup}
                                            on:click={() => selectDropdownItem(item)}
                                        >
                                            {item.label}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <button 
                            class="minimal-submit"
                            on:click={handleOptionsSubmit}
                            disabled={!optionsInput.trim()}
                        >
                            <span class="sparkle">✨</span>
                        </button>
                    </div>
                    
                    <div class="minimal-table">
                        {#each optionsItems.slice(0, 3) as item}
                            <div class="table-row">
                                <div class="table-cell group-cell">
                                    <div class="group-name">{item.value}</div>
                                </div>
                                <div class="table-cell values-cell">
                                    <div class="value-circles">
                                        {#each getValuesList(item) as valueCircle}
                                            <div
                                                class="value-circle"
                                                class:color-circle={valueCircle.type === 'color'}
                                                class:box-circle={valueCircle.type === 'text'}
                                                style={valueCircle.type === 'color' ? `background-color: ${valueCircle.display}` : ''}
                                                title={valueCircle.fullValue}
                                            >
                                                {valueCircle.type === 'text' ? valueCircle.display : ''}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/each}
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

    .options-input-container {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
    }

    .options-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        font-size: 0.95rem;
    }

    .options-input:focus {
        outline: none;
        border-color: #94a3b8;
    }

    .submit-button {
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .submit-button:hover {
        background: #f1f5f9;
    }

    .submit-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    .option-item.is-group {
        background: #f1f5f9;
        font-weight: 500;
    }

    .mode-toggle.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .options-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .option-value-row {
        padding-left: 2rem;
        background: white;
    }

    .color-circle {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.5rem;
        border: 1px solid #e2e8f0;
    }

    .option-item.option-value-row {
        background: white;
        padding-left: 2rem;
    }

    .settings-rows {
        margin-bottom: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
    }

    .setting-row {
        display: flex;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .setting-row:last-child {
        border-bottom: none;
    }

    .setting-label {
        flex: 1;
        color: #64748b;
        font-weight: 500;
    }

    .setting-input {
        width: 200px;
        padding: 0.25rem 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
    }

    .setting-input:focus {
        outline: none;
        border-color: #94a3b8;
    }

    .minimal-input-container {
        display: flex;
        gap: 0.25rem;
        margin: 0.5rem 0;
        border-radius: 6px;
        background: #fff;
        border: 1px solid #e2e8f0;
        padding: 0.5rem;
    }

    .minimal-input {
        flex: 1;
        padding: 0.35rem 0.5rem;
        border: none;
        font-size: 0.875rem;
        background: transparent;
    }

    .minimal-input:focus {
        outline: none;
    }

    .minimal-submit {
        padding: 0.35rem 0.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .minimal-submit:hover {
        opacity: 1;
    }

    .minimal-submit:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    @media (max-width: 480px) {
        .minimal-input-container {
            margin: 0.25rem 0;
        }

        .minimal-input {
            padding: 0.25rem;
            font-size: 0.875rem;
        }

        .minimal-submit {
            padding: 0.25rem;
        }
    }

    .minimal-table {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
        background: white;
    }

    .table-row {
        display: grid;
        grid-template-columns: 120px 1fr;
        border-bottom: 1px solid #e2e8f0;
        min-height: 80px; /* Increased height */
    }

    .table-row:last-child {
        border-bottom: none;
    }

    .table-cell {
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: #1a1a1a;
        display: flex;
        align-items: center;
    }

    .cell-action {
        background: transparent;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cell-action:hover {
        opacity: 1;
    }

    .action-dot {
        width: 4px;
        height: 4px;
        background: #64748b;
        border-radius: 50%;
        position: relative;
    }

    .action-dot::before,
    .action-dot::after {
        content: '';
        position: absolute;
        width: 4px;
        height: 4px;
        background: #64748b;
        border-radius: 50%;
    }

    .action-dot::before {
        left: -8px;
    }

    .action-dot::after {
        right: -8px;
    }

    @media (max-width: 480px) {
        .table-row {
            min-height: 60px;
        }

        .table-cell {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
        }

        .value-circle {
            width: 20px;
            height: 20px;
            font-size: 0.65rem;
        }
    }

    .values-cell {
        justify-content: flex-start;
        padding: 1rem;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .value-circles {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .value-circle {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        border: 2px solid transparent;
    }

    .color-circle {
        border: 2px solid white;
        box-shadow: 0 0 0 1px #e2e8f0;
    }

    .box-circle {
        border-radius: 4px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        font-weight: 500;
    }

    .group-cell {
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
    }

    .group-name {
        font-weight: 500;
        color: #1a1a1a;
    }

    @media (max-width: 480px) {
        .values-text {
            max-width: 120px;
        }

        .group-subtitle {
            font-size: 0.65rem;
        }
        
        .value-circle {
            width: 24px;
            height: 24px;
        }
    }

    .input-wrapper {
        position: relative;
        flex: 1;
    }

    .dropdown-menu {
        position: fixed;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        padding: 0.25rem;
        min-width: 120px;
        z-index: 1000;
    }

    .dropdown-item {
        width: 100%;
        padding: 0.5rem;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        color: #64748b;
        font-size: 0.875rem;
        text-align: left;
    }

    .dropdown-item:hover {
        background: #f1f5f9;
        color: #0f172a;
    }

    .group-command {
        color: #2563eb;
    }
</style>
