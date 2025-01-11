<script>
    import BottomNavbar from '$lib/BottomNavbar.svelte';
    import Topbar from '$lib/Topbar.svelte';
    
    let messages = [];
    let userInput = '';
    let isLoading = false;
    let error = null;

    async function handleSubmit() {
        if (!userInput.trim()) return;
        
        const userMessage = { text: userInput, sender: 'user' };
        messages = [...messages, userMessage];
        const currentInput = userInput;
        userInput = '';
        isLoading = true;
        error = null;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentInput })
            });

            if (!response.ok) throw new Error('Failed to get response');
            
            const data = await response.json();
            messages = [...messages, { text: data.message, sender: 'assistant' }];
        } catch (e) {
            error = 'Failed to get response. Please try again.';
            console.error(e);
        } finally {
            isLoading = false;
        }
    }
</script>

<Topbar />

<div class="chat-container">
    <div class="messages">
        {#each messages as message}
            <div class="message {message.sender}">
                <p>{message.text}</p>
            </div>
        {/each}
        {#if isLoading}
            <div class="message assistant loading">
                <p>Thinking...</p>
            </div>
        {/if}
        {#if error}
            <div class="message error">
                <p>{error}</p>
            </div>
        {/if}
    </div>
</div>

<form class="input-area" on:submit|preventDefault={handleSubmit}>
    <input 
        type="text" 
        bind:value={userInput} 
        placeholder="Type your message..."
        disabled={isLoading}
    />
    <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
    </button>
</form>

<BottomNavbar />

<style>
    .chat-container {
        max-width: 800px;
        margin: 1rem auto;
        height: calc(100vh - 180px); /* Adjusted to account for fixed input */
        display: flex;
        flex-direction: column;
        padding: 1rem;
        padding-bottom: 80px; /* Space for fixed input */
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .message {
        margin: 0.5rem 0;
        padding: 0.8rem;
        border-radius: 8px;
        max-width: 70%;
    }

    .message.user {
        background: #007bff;
        color: white;
        margin-left: auto;
    }

    .message.assistant {
        background: #f0f0f0;
        color: #333;
        margin-right: auto;
    }

    .message.error {
        background: #fff0f0;
        color: #d00;
        margin-right: auto;
    }

    .message.loading {
        opacity: 0.7;
    }

    .message p {
        margin: 0;
    }

    .input-area {
        position: fixed;
        bottom: 60px; /* Space for BottomNavbar */
        left: 0;
        right: 0;
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
        background: white;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 100;
    }

    input {
        flex: 1;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
    }

    button {
        padding: 0.8rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
    }

    button:disabled {
        background: #cccccc;
        cursor: not-allowed;
    }

    button:hover {
        background: #0056b3;
    }
</style>