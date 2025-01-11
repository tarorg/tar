import { writable } from 'svelte/store';

const STORAGE_KEY = 'nav_selected_item';

function createNavigationStore() {
    // Get initial value from localStorage or default to empty string
    const storedValue = localStorage.getItem(STORAGE_KEY) || '';
    const { subscribe, set, update } = writable(storedValue);

    return {
        subscribe,
        select: (value) => {
            localStorage.setItem(STORAGE_KEY, value);
            set(value);
        },
        reset: () => {
            localStorage.removeItem(STORAGE_KEY);
            set('');
        }
    };
}

export const selectedNav = createNavigationStore();
