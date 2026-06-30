import { customAlphabet } from 'nanoid';

const alphabet : string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generate = customAlphabet(alphabet, 7);

export function generateShortCode(): string{
    return generate();
}