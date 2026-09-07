import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/* `tailwind-merge`'s `theme` keys ARE Tailwind v4's `@theme` namespaces, so these
   four lists are the same names `tokens.css` declares as `--spacing-*`,
   `--text-*`, `--shadow-*` and `--container-*`. Without them a named-scale class
   is a class twMerge has never heard of: it survives every conflict, so
   `cn('px-box-lg', 'px-4')` kept BOTH and Tailwind's sort order — not the
   caller — decided the padding. Every component takes a `class` prop
   (presentation/AGENTS.md), and overriding the spacing is the first thing a
   caller reaches for, so the prop is only honest with these registered.

   The `@utility` composites (`card-shell`, `field-input`, `row-action`, …) are
   deliberately NOT enumerated here. Listing what each one contains would be a
   second copy of `tokens.css`, free to drift from it, and it buys nothing: a
   composite is multi-property, so a single-property utility beside it already
   wins on Tailwind's own sort order — which is what `card-shell`'s "smaller
   cards stack `rounded-xl` after it" note in `tokens.css` describes. */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			spacing: [
				'box-3xs',
				'box-2xs',
				'box-xs',
				'box-sm',
				'box-md',
				'box-lg',
				'box-xl',
				'box-2xl',
				'grid-2xs',
				'grid-xs',
				'grid-sm',
				'grid-md',
				'grid-lg',
				'grid-xl',
				'text-3xs',
				'text-2xs',
				'text-xs',
				'text-sm',
				'text-md',
				'text-lg',
				'text-xl',
				'text-2xl',
				'page-sm',
				'page-md',
				'page',
				'section',
				'section-lg',
				'empty-state',
				'day-block',
			],
			text: ['2xs'],
			shadow: ['card'],
			container: ['layout'],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;

export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
