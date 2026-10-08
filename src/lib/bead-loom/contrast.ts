/** Select the higher-contrast neutral ink using linearized sRGB luminance.
 * For any opaque sRGB background, the better of black/white exceeds 4.5:1.
 */
export function loomSymbolInk(hex: string): '#000000' | '#ffffff' {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error('Symbol contrast needs a six-digit hex color.');
    const linear = [1, 3, 5].map(index => {
        const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    const blackContrast = (luminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (luminance + 0.05);
    return blackContrast >= whiteContrast ? '#000000' : '#ffffff';
}
