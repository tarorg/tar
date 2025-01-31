<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Placeholder from '@tiptap/extension-placeholder';
    import Link from '@tiptap/extension-link';
    import TaskList from '@tiptap/extension-task-list';
    import TaskItem from '@tiptap/extension-task-item';
    import Table from '@tiptap/extension-table';
    import TableRow from '@tiptap/extension-table-row';
    import TableCell from '@tiptap/extension-table-cell';
    import TableHeader from '@tiptap/extension-table-header';
    import {
        Bold,
        Italic,
        List,
        ListOrdered,
        Quote,
        Code,
        Type,
        ChevronDown,
        Link as LinkIcon,
        CheckSquare,
        Table as TableIcon,
        Minus,
        AlignLeft,
        AlignCenter,
        AlignRight,
        Strikethrough,
        Subscript,
        Superscript,
        CodeSquare
    } from 'lucide-svelte';

    export let content = '';
    export let placeholder = 'Start writing...';
    
    let element: HTMLElement;
    let editor: Editor;
    let isHeadingMenuOpen = false;
    let headingBtnRef: HTMLButtonElement;

    const headingLevels = [
        { level: 1, label: 'Heading 1' },
        { level: 2, label: 'Heading 2' },
        { level: 3, label: 'Heading 3' },
        { type: 'paragraph', label: 'Normal text' }
    ];

    onMount(() => {
        editor = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3]
                    }
                }),
                Placeholder.configure({
                    placeholder,
                }),
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        class: 'editor-link'
                    }
                }),
                TaskList,
                TaskItem,
                Table.configure({
                    resizable: true,
                }),
                TableRow,
                TableCell,
                TableHeader
            ],
            content,
            onUpdate: ({ editor }) => {
                content = editor.getHTML();
            },
        });

        // Close heading menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (isHeadingMenuOpen && !headingBtnRef?.contains(event.target as Node)) {
                isHeadingMenuOpen = false;
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });

    function getActiveHeading() {
        if (editor?.isActive('heading', { level: 1 })) return 'Heading 1';
        if (editor?.isActive('heading', { level: 2 })) return 'Heading 2';
        if (editor?.isActive('heading', { level: 3 })) return 'Heading 3';
        return 'Normal text';
    }

    const tools = [
        {
            type: 'heading-menu',
            icon: Type,
            getLabel: getActiveHeading
        },
        { type: 'separator' },
        {
            icon: Bold,
            action: () => editor?.chain().focus().toggleBold().run(),
            isActive: () => editor?.isActive('bold'),
            tooltip: 'Bold'
        },
        {
            icon: Italic,
            action: () => editor?.chain().focus().toggleItalic().run(),
            isActive: () => editor?.isActive('italic'),
            tooltip: 'Italic'
        },
        {
            icon: Strikethrough,
            action: () => editor?.chain().focus().toggleStrike().run(),
            isActive: () => editor?.isActive('strike'),
            tooltip: 'Strikethrough'
        },
        {
            icon: CodeSquare,
            action: () => editor?.chain().focus().toggleCode().run(),
            isActive: () => editor?.isActive('code'),
            tooltip: 'Code'
        },
        { type: 'separator' },
        {
            icon: LinkIcon,
            action: () => {
                const url = window.prompt('Enter URL:');
                if (url) {
                    editor?.chain().focus().setLink({ href: url }).run();
                }
            },
            isActive: () => editor?.isActive('link'),
            tooltip: 'Add Link'
        },
        { type: 'separator' },
        {
            icon: List,
            action: () => editor?.chain().focus().toggleBulletList().run(),
            isActive: () => editor?.isActive('bulletList'),
            tooltip: 'Bullet List'
        },
        {
            icon: ListOrdered,
            action: () => editor?.chain().focus().toggleOrderedList().run(),
            isActive: () => editor?.isActive('orderedList'),
            tooltip: 'Numbered List'
        },
        {
            icon: CheckSquare,
            action: () => editor?.chain().focus().toggleTaskList().run(),
            isActive: () => editor?.isActive('taskList'),
            tooltip: 'Task List'
        },
        { type: 'separator' },
        {
            icon: Quote,
            action: () => editor?.chain().focus().toggleBlockquote().run(),
            isActive: () => editor?.isActive('blockquote'),
            tooltip: 'Quote'
        },
        {
            icon: TableIcon,
            action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
            tooltip: 'Insert Table'
        }
    ];
</script>

<div class="editor-wrapper">
    <div class="toolbar">
        {#each tools as tool}
            {#if tool.type === 'separator'}
                <div class="separator" />
            {:else if tool.type === 'heading-menu'}
                <div class="heading-menu">
                    <button
                        bind:this={headingBtnRef}
                        class="tool-button heading-button"
                        on:click={() => isHeadingMenuOpen = !isHeadingMenuOpen}
                    >
                        <span class="heading-label">{tool.getLabel()}</span>
                        <div class:open={isHeadingMenuOpen} class="heading-icon">
                            <ChevronDown size={16} />
                        </div>
                    </button>
                    {#if isHeadingMenuOpen}
                        <div class="heading-dropdown">
                            {#each headingLevels as level}
                                <button
                                    class="heading-option"
                                    class:active={level.type ? !editor?.isActive('heading') : editor?.isActive('heading', { level: level.level })}
                                    on:click={() => {
                                        if (level.type === 'paragraph') {
                                            editor?.chain().focus().setParagraph().run();
                                        } else {
                                            editor?.chain().focus().toggleHeading({ level: level.level }).run();
                                        }
                                        isHeadingMenuOpen = false;
                                    }}
                                >
                                    {level.label}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {:else}
                <button
                    class="tool-button"
                    class:active={tool.isActive?.()}
                    on:click={tool.action}
                    title={tool.tooltip}
                >
                    <svelte:component this={tool.icon} size={16} />
                </button>
            {/if}
        {/each}
    </div>
    
    <div bind:this={element} class="editor-content" />
</div>

<style>
    .editor-wrapper {
        border: none;
        border-radius: 0;
        overflow: visible;
        background: transparent;
    }

    .toolbar {
        padding: 0.25rem;
        border: 1px solid #e2e8f0;
        background: white;
        display: flex;
        gap: 0.125rem;
        align-items: center;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .tool-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0.25rem;
        border: none;
        background: transparent;
        border-radius: 0.375rem;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
    }

    .heading-button {
        width: auto;
        padding: 0 0.5rem;
        gap: 0.25rem;
    }

    .heading-label {
        font-size: 0.875rem;
    }

    .heading-icon {
        display: inline-flex;
        align-items: center;
        transition: transform 0.15s;
    }

    .heading-icon.open {
        transform: rotate(180deg);
    }

    .heading-menu {
        position: relative;
    }

    .heading-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.25rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        min-width: 140px;
        z-index: 50;
    }

    .heading-option {
        width: 100%;
        text-align: left;
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;
    }

    .heading-option:hover {
        background: #f8fafc;
        color: #1e40af;
    }

    .heading-option.active {
        background: #f1f5f9;
        color: #1e40af;
    }

    /* ...existing editor styles... */

    :global(.editor-link) {
        color: #2563eb;
        text-decoration: underline;
        cursor: pointer;
    }

    :global(.editor-link:hover) {
        color: #1d4ed8;
    }

    :global(.has-focus) {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        border-radius: 0.25rem;
    }

    .separator {
        width: 1px;
        height: 1.25rem;
        background: #e2e8f0;
        margin: 0 0.25rem;
    }

    .editor-content {
        padding: 0;
        min-height: 200px;
    }

    :global(.editor-content) {
        cursor: text;
    }

    :global(.editor-content p) {
        margin: 0;
        padding: 0.25rem 0;
        line-height: 1.6;
        color: #1a1a1a;
    }

    :global(.editor-content p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        float: left;
        color: #94a3b8;
        pointer-events: none;
        height: 0;
    }

    :global(.editor-content blockquote) {
        border-left: 3px solid #e2e8f0;
        margin: 0.5rem 0;
        padding-left: 1rem;
        color: #475569;
    }

    :global(.editor-content code) {
        background: #f8fafc;
        padding: 0.2em 0.4em;
        border-radius: 0.25rem;
        font-size: 0.875em;
        font-family: ui-monospace, monospace;
        color: #1e40af;
    }

    :global(.editor-content h1) {
        font-size: 1.5em;
        margin: 0.5em 0 0.25em;
        font-weight: 600;
        color: #0f172a;
    }

    :global(.editor-content h2) {
        font-size: 1.25em;
        margin: 0.5em 0 0.25em;
        font-weight: 600;
        color: #1e293b;
    }

    :global(.editor-content ul),
    :global(.editor-content ol) {
        padding-left: 1.25rem;
        margin: 0.25em 0;
    }

    :global(.editor-content li) {
        margin: 0.125em 0;
        padding: 0.125em 0;
    }

    :global(.ProseMirror) {
        outline: none;
    }

    :global(.ProseMirror p.is-editor-empty:first-child::before) {
        color: #94a3b8;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }
</style>
