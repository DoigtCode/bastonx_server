export function generate_pseudo(length = 8) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const lettersUpper = letters.toUpperCase();
    const numbers = "0123456789";
    const symbols = "_-"; // optionnel, ajoute plus de combinaisons

    // Tous les caractères possibles
    const chars = letters + lettersUpper + numbers + symbols;

    let pseudo = "";
    for (let i = 0; i < length; i++) {
        // Choisir un caractère aléatoire
        const index = Math.floor(Math.random() * chars.length);
        pseudo += chars[index];
    }

    return pseudo;
}

export function choose(...values) {
    if (values.length === 1 && Array.isArray(values[0]))
        values = values[0];

    return values[Math.floor(Math.random() * values.length)];
}

export function choose_rarety(rareties) {
    const total = rareties.reduce((sum, value) => sum + value, 0);
    let random = Math.random() * total;

    for (let i = 0; i < rareties.length; i++) {
        random -= rareties[i];

        if (random < 0) {
            return i;
        }
    }
}