import { writable } from 'svelte/store';

function createNavigationStore() {
    const browser = typeof window !== 'undefined';
    const storedValue = browser ? localStorage.getItem('selectedNav') : null;
    const { subscribe, set } = writable(storedValue || '🎮');

    return {
        subscribe,
        select: (value) => {
            if (browser) {
                localStorage.setItem('selectedNav', value);
            }
            set(value);
        }
    };
}

export const selectedNav = createNavigationStore();
