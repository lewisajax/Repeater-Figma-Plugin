/**
 * @param {number} num - A number longer than 2 decimal places
 * @description Rounds a number to at least 2 decimal places
 * @returns {number}
 * @link https://stackoverflow.com/a/11832950
 */
export const roundToTwoPlaces = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * @param {number} num - A number
 * @param {number} max - Number to return if num is greater than it
 * @param {number} min - Number to return if num is less than it
 * @description Caps a number if it's greater than the max or less than the min
 * @returns {number}
 */
export const capPercent = (num: number, max: number = 100, min: number = 0): number => num > max ? max : num < min ? min : num; 

/**
 * @param {string} str - A string with some symbols in it
 * @description Strips the string of any symbols, i.e. the percent symbol
 * @returns {string}
 */
export const removeSymbols = (str: string): string => str.replace(/[°%]/, '');

/**
 * @param rgbArray - An array of numbers between 0 and 255
 * @description Takes in an array of rgb values and returns a hex string
 * @returns {string}
 */
export const rgbArrayToHex = ([r, g, b]: Array<number>): string => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).substr(1)}`;

/**
 * @param val - An object or array from a figma node
 * @link https://www.figma.com/plugin-docs/editing-properties/
 */
export function clone (val) {
  const type = typeof val
  if (val === null) {
    return null
  } else if (type === 'undefined' || type === 'number' ||
             type === 'string' || type === 'boolean') {
    return val
  } else if (type === 'object') {
    if (val instanceof Array) {
      return val.map(x => clone(x))
    } else if (val instanceof Uint8Array) {
      return new Uint8Array(val)
    } else {
      let o = {}
      for (const key in val) {
        o[key] = clone(val[key])
      }
      return o
    }
  }
  throw 'unknown'
}

export const toPascalCaseText = (text: string) => {
  const val = text.replace('_', ' ');
  const split = val.split(' ');

  return split.reduce((prev, curr) => {
    curr = curr[0].toUpperCase() + curr.slice(1).toLowerCase();

    return prev + ' ' + curr;
  }, '');
}

export const multiplyRgbArrToString = (arr: Array<number>): string => {
  return arr.map(clr => Math.floor(clr * 255)).join("");
}