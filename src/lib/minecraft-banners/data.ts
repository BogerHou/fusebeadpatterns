// Java 26.3 DyeColor textureDiffuseColor values. Flat schematic colors only;
// the renderer does not reproduce Minecraft's fabric texture or lighting.
export const GAME_VERSION = '26.3';
export const DYE_IDS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'] as const;
export type DyeId = typeof DYE_IDS[number];
export const DYE_COLORS: Readonly<Record<DyeId, string>> = Object.freeze({
    white: '#f9fffe', orange: '#f9801d', magenta: '#c74ebd', light_blue: '#3ab3da',
    yellow: '#fed83d', lime: '#80c71f', pink: '#f38baa', gray: '#474f52',
    light_gray: '#9d9d97', cyan: '#169c9c', purple: '#8932b8', blue: '#3c44aa',
    brown: '#835432', green: '#5e7c16', red: '#b02e26', black: '#1d1d21',
});
