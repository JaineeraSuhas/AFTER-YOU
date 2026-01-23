// Anonymous name generator for users
const ADJECTIVES = [
    'Swift', 'Quiet', 'Gentle', 'Wise', 'Brave', 'Kind',
    'Calm', 'Bold', 'Clever', 'Noble', 'Bright', 'Silent'
];

const ANIMALS = [
    'Owl', 'Fox', 'Deer', 'Rabbit', 'Bear', 'Wolf',
    'Hawk', 'Raven', 'Lynx', 'Otter', 'Panda', 'Tiger'
];

export const generateAnonymousName = (): string => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj} ${animal}`;
};

export const generateUserId = (): string => {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getUserIdAndName = (): { userId: string; userName: string } => {
    let userId = localStorage.getItem('afteryou-user-id');
    let userName = localStorage.getItem('afteryou-user-name');

    if (!userId || !userName) {
        userId = generateUserId();
        userName = generateAnonymousName();
        localStorage.setItem('afteryou-user-id', userId);
        localStorage.setItem('afteryou-user-name', userName);
    }

    return { userId, userName };
};
