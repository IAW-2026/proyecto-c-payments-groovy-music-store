import { Cormorant_Garamond, Syne, DM_Sans } from 'next/font/google';

export const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['300', '400'],
    variable: '--font-cormorant',
});

export const syne = Syne({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-syne',
});

export const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600'],
    variable: '--font-dm',
});